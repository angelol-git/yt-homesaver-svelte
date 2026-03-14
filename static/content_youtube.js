const MAX_VIDEOS_PER_SET = 6;
const MAX_SET = 4;
// eslint-disable-next-line no-undef
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

let isProcessing = false;
let lastProcessedDataHash = null;
let dataCheckInterval = null;

function generateDataHash(videoIds) {
  return videoIds.slice(0, MAX_VIDEOS_PER_SET).join("|");
}

function init() {
  console.log("[YTHomeSaver] Content script initialized");

  injectPageScript();

  window.addEventListener("message", handlePageMessage);

  if (location.pathname === "/") {
    console.log("[YTHomeSaver] On homepage, requesting data from page");
    requestYtData();
  }

  setupNavigationListener();
}

// Inject script into page to access ytInitialData
function injectPageScript() {
  const script = document.createElement("script");
  script.src = extensionAPI.runtime.getURL("page_script.js");
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

function handlePageMessage(event) {
  if (event.source !== window) return;
  if (event.data.type !== "YTHOME_DATA") return;

  const data = event.data.payload;
  if (data) {
    console.log("[YTHomeSaver] Received ytInitialData from page script");
    parseAndSaveVideos(data);
  } else {
    console.log("[YTHomeSaver] Page script reported no data available");
  }
}

function requestYtData() {
  window.postMessage({ type: "YTHOME_REQUEST_DATA" }, "*");
}

function setupNavigationListener() {
  let previousUrl = location.href;

  // YouTube's internal navigation event
  window.addEventListener("yt-navigate-finish", () => {
    console.log("[YTHomeSaver] yt-navigate-finish event fired");
    if (location.pathname === "/" && location.href !== previousUrl) {
      previousUrl = location.href;
      console.log("[YTHomeSaver] Navigated to homepage, requesting data...");
      setTimeout(requestYtData, 500);
    }
  });

  // Fallback: observe URL changes
  const observer = new MutationObserver(() => {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      if (location.pathname === "/") {
        console.log(
          "[YTHomeSaver] URL changed to homepage, requesting data...",
        );
        setTimeout(requestYtData, 500);
      }
    }
  });

  observer.observe(document, { subtree: true, childList: true });
}

function parseVideosFromData(data) {
  try {
    if (!data) {
      console.log("[YTHomeSaver] No data provided to parseVideosFromData");
      return null;
    }

    console.log("[YTHomeSaver] Data structure:", Object.keys(data));

    const contents =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
        ?.content?.richGridRenderer?.contents;

    if (!Array.isArray(contents)) {
      console.log("[YTHomeSaver] No contents array found");
      return null;
    }

    console.log("[YTHomeSaver] Found", contents.length, "items in contents");

    const videos = [];

    for (const item of contents) {
      if (videos.length >= MAX_VIDEOS_PER_SET) break;

      const lockup = item?.richItemRenderer?.content?.lockupViewModel;
      if (!lockup) continue;

      // Skip shorts
      const isShort =
        item?.richItemRenderer?.content?.shortsLockupViewModel !== undefined;
      if (isShort) continue;

      const videoId =
        lockup?.contentId ||
        lockup?.itemPlayback?.inlinePlayerData?.onSelect?.innertubeCommand
          ?.watchEndpoint?.videoId;

      if (!videoId) continue;

      const metadata = lockup?.metadata?.lockupMetadataViewModel;
      if (!metadata) continue;

      const title = metadata?.title?.content;
      if (!title) continue;

      // Get thumbnail from thumbnailViewModel
      const thumbnailSources =
        lockup?.contentImage?.thumbnailViewModel?.image?.sources;
      const thumbnail = thumbnailSources?.[0]?.url || null;

      // Get channel info
      const channelAvatar = metadata?.image?.decoratedAvatarViewModel;
      const channelName =
        metadata?.metadata?.contentMetadataViewModel?.metadataRows?.[0]
          ?.metadataParts?.[0]?.text?.content ||
        channelAvatar?.avatar?.avatarViewModel?.a11yLabel?.replace(
          "Go to channel ",
          "",
        );

      // Get video duration from badges
      const overlays = lockup?.contentImage?.thumbnailViewModel?.overlays || [];
      let duration = null;
      for (const overlay of overlays) {
        const badge =
          overlay?.thumbnailBottomOverlayViewModel?.badges?.[0]
            ?.thumbnailBadgeViewModel?.text;
        if (badge) {
          duration = badge;
          break;
        }
      }

      videos.push({
        id: videoId,
        thumbnail,
        title,
        link: `https://youtube.com/watch?v=${videoId}`,
        length: duration,
        channel: channelName,
      });
    }

    return videos.length > 0 ? videos : null;
  } catch (error) {
    console.error("[YTHomeSaver] Error parsing ytInitialData:", error);
    return null;
  }
}

async function parseAndSaveVideos(data) {
  if (isProcessing) {
    console.log("[YTHomeSaver] Already processing, skipping");
    return;
  }
  isProcessing = true;

  try {
    if (!data) {
      console.log("[YTHomeSaver] No data received");
      isProcessing = false;
      return;
    }

    const videos = parseVideosFromData(data);

    if (!videos || videos.length === 0) {
      console.log("[YTHomeSaver] No videos found in data");
      isProcessing = false;
      return;
    }

    const videoIds = videos.map((v) => v.link);
    const dataHash = generateDataHash(videoIds);

    if (dataHash === lastProcessedDataHash) {
      console.log("[YTHomeSaver] Same homepage data, skipping save");
      isProcessing = false;
      return;
    }

    const stored = await getStoredData();
    const lastSet = stored[0]?.videos || [];
    const lastSetHash = generateDataHash(lastSet.map((v) => v.link));

    if (dataHash === lastSetHash) {
      console.log("[YTHomeSaver] Data matches stored set, skipping save");
      lastProcessedDataHash = dataHash;
      isProcessing = false;
      return;
    }

    // Save the new set
    const set = {
      setId: crypto.randomUUID(),
      timeAdded: new Date().toLocaleString(),
      videos: videos.slice(0, MAX_VIDEOS_PER_SET),
    };

    await saveToStorage(set);
    lastProcessedDataHash = dataHash;
    console.log(`[YTHomeSaver] Saved ${set.videos.length} videos`);
  } catch (error) {
    console.error("[YTHomeSaver] Error in parseAndSaveVideos:", error);
  } finally {
    isProcessing = false;
  }
}

// Get stored data
function getStoredData() {
  return new Promise((resolve) => {
    extensionAPI.storage.local.get("homesaver", (result) => {
      resolve(result["homesaver"]?.sets || []);
    });
  });
}

// Save to storage
async function saveToStorage(newSet) {
  return new Promise((resolve) => {
    extensionAPI.storage.local.get("homesaver", (result) => {
      const existingData = result["homesaver"]?.sets || [];
      const updatedSets = [newSet, ...existingData];

      if (updatedSets.length > MAX_SET) {
        updatedSets.pop();
      }

      extensionAPI.storage.local.set(
        { homesaver: { sets: updatedSets } },
        () => {
          console.log("[YTHomeSaver] New set saved to storage");
          resolve();
        },
      );
    });
  });
}

init();
