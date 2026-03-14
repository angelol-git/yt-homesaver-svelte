const MAX_VIDEOS_PER_SET = 6;
const MAX_SET = 4;
// eslint-disable-next-line no-undef
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

let isProcessing = false;
let lastProcessedDataKey = null;
let domObserver = null;
let navigationDebounceTimer = null;

let wasOnHomepage = location.pathname === "/";

function generateDataKey(videoIds) {
  return videoIds.slice(0, MAX_VIDEOS_PER_SET).join("|");
}

function init() {
  if (location.pathname === "/") {
    waitForDomAndParse();
  }

  setupNavigationListener();
  setupDomObserver();
}

function waitForDomAndParse() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(parseAndSaveVideos, 2000);
    });
  } else {
    const videosExist =
      document.querySelectorAll("ytd-rich-item-renderer").length > 0;
    if (videosExist) {
      setTimeout(parseAndSaveVideos, 500);
    } else {
      setTimeout(waitForDomAndParse, 1000);
    }
  }
}

function setupNavigationListener() {
  let previousUrl = location.href;

  const urlObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== previousUrl) {
      const isOnHomepage = location.pathname === "/";

      if (wasOnHomepage && !isOnHomepage) {
        lastProcessedDataKey = null;
      }

      wasOnHomepage = isOnHomepage;
      previousUrl = currentUrl;

      if (isOnHomepage) {
        clearTimeout(navigationDebounceTimer);
        navigationDebounceTimer = setTimeout(() => {
          console.log("[HomeSaver] Navigated to homepage (observer)");
          parseAndSaveVideos();
        }, 3000);
      }
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });
}
function setupDomObserver() {
  let domChangeTimeout = null;

  domObserver = new MutationObserver((mutations) => {
    if (location.pathname !== "/" || isProcessing) return;

    const hasVideoChanges = mutations.some((mutation) => {
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return (
            node.matches?.("ytd-rich-item-renderer") ||
            node.querySelector?.("ytd-rich-item-renderer")
          );
        }
        return false;
      });
    });

    if (hasVideoChanges) {
      clearTimeout(domChangeTimeout);
      domChangeTimeout = setTimeout(() => {
        console.log(
          "[HomeSaver] DOM changed - new videos detected, parsing...",
        );
        parseAndSaveVideos();
      }, 1500);
    }
  });

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function parseVideosFromDOM() {
  try {
    const videos = [];

    const videoItems = document.querySelectorAll("ytd-rich-item-renderer");
    if (videoItems.length === 0) {
      console.log("[HomeSaver] No video items found in DOM yet");
      return null;
    }

    for (const item of videoItems) {
      if (videos.length >= MAX_VIDEOS_PER_SET) break;

      // Skip shorts
      const isShort =
        item.querySelector("ytd-shorts-lockup-view-model") !== null ||
        item.querySelector('[overlay-style="SHORTS"]') !== null ||
        item.querySelector(
          "ytd-thumbnail-overlay-time-status-renderer[overlay-style='SHORTS']",
        ) !== null;

      if (isShort) {
        continue;
      }

      // Skip ads
      const isAd =
        item.querySelector("ytd-ad-slot-renderer") !== null ||
        item.querySelector("ytd-in-feed-ad-layout-renderer") !== null ||
        item.querySelector("ytd-display-ad-renderer") !== null ||
        item.querySelector("[is-ad]") !== null ||
        item.querySelector(".ytd-ad-slot-renderer") !== null ||
        item.querySelector(".ytd-in-feed-ad-layout-renderer") !== null ||
        item.textContent?.includes("Sponsored") ||
        item.textContent?.includes("Ad ") ||
        item.querySelector(".badge-style-type-ad") !== null;

      if (isAd) {
        continue;
      }

      // Link
      const thumbnailLink = item.querySelector(
        "a.yt-lockup-view-model__content-image",
      );
      if (!thumbnailLink) continue;

      const href = thumbnailLink.getAttribute("href");
      if (!href) continue;

      // Video Id
      const videoIdMatch = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) continue;

      // Title
      let title = null;
      const titleLink = item.querySelector(
        "h3.yt-lockup-metadata-view-model__heading-reset a.yt-lockup-metadata-view-model__title",
      );
      if (titleLink) {
        title =
          titleLink.textContent?.trim() ||
          titleLink.getAttribute("title")?.trim();
      }

      if (!title) continue;

      // Thumbnail Image
      let thumbnail = null;
      const thumbnailImg = item.querySelector(
        "img.ytCoreImageHost, img.yt-core-image, yt-image img",
      );
      if (thumbnailImg) {
        thumbnail =
          thumbnailImg.src ||
          thumbnailImg.getAttribute("data-thumb") ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      } else {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      // Channel name
      let channelName = null;
      const channelLink = item.querySelector(
        "yt-content-metadata-view-model a[href^='/@']",
      );
      if (channelLink) {
        channelName = channelLink.textContent?.trim();
      }

      // Duration
      let duration = null;
      const durationBadge = item.querySelector(
        "badge-shape .yt-badge-shape__text",
      );
      if (durationBadge) {
        duration = durationBadge.textContent?.trim();
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
    console.error("[HomeSaver] Error parsing DOM:", error);
    return null;
  }
}

async function parseAndSaveVideos() {
  if (isProcessing) {
    console.log("[HomeSaver] Already processing, skipping");
    return;
  }

  isProcessing = true;

  try {
    const videos = parseVideosFromDOM();

    if (!videos || videos.length === 0) {
      console.log("[HomeSaver] No videos found in DOM");
      isProcessing = false;
      return;
    }

    const videoLinks = videos.map((v) => v.link);
    const dataKey = generateDataKey(videoLinks);

    if (dataKey === lastProcessedDataKey) {
      console.log("[HomeSaver] Same data as last processed, skipping save");
      isProcessing = false;
      return;
    }

    const stored = await getStoredData();
    const lastSet = stored[0]?.videos || [];
    const lastSetVideoLinks = lastSet.map((v) => v.link);
    const lastSetKey = generateDataKey(lastSetVideoLinks);

    if (dataKey === lastSetKey) {
      console.log("[HomeSaver] Data matches stored set, skipping save");
      lastProcessedDataKey = dataKey;
      isProcessing = false;
      return;
    }

    const set = {
      setId: crypto.randomUUID(),
      timeAdded: new Date().toLocaleString(),
      videos: videos.slice(0, MAX_VIDEOS_PER_SET),
    };

    await saveToStorage(set);
    lastProcessedDataKey = dataKey;
  } catch (error) {
    console.error("[HomeSaver] Error in parseAndSaveVideos:", error);
  } finally {
    isProcessing = false;
  }
}

function getStoredData() {
  return new Promise((resolve) => {
    extensionAPI.storage.local.get("homesaver", (result) => {
      resolve(result["homesaver"]?.sets || []);
    });
  });
}

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
          resolve();
        },
      );
    });
  });
}

init();
