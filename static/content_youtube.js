const MAX_VIDEOS_PER_SET = 6;
const MAX_SET = 4;
// eslint-disable-next-line no-undef
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

let homeObserverActive = false;
let homeObserverTimeout = null;

//Youtube is a SPA, need to listen when back to homepage.
function startHistoryObserver() {
  let previousUrl = "";
  const observer = new MutationObserver(function () {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      if (location.pathname === "/") {
        startHomeObserver();
      }
      console.log(`URL changed to ${location.href}`);
    }
  });
  const config = { subtree: true, childList: true };
  observer.observe(document, config);
}

function startHomeObserver() {
  if (homeObserverActive) return;
  homeObserverActive = true;

  const observer = new MutationObserver((mutations, obs) => {
    if (homeObserverTimeout) {
      clearTimeout(homeObserverTimeout);
    }

    homeObserverTimeout = setTimeout(() => {
      handleHomeMutation(obs);
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function handleHomeMutation(obs) {
  const contentsElement = document.getElementById("contents");
  if (!contentsElement) return;

  const videoCardElements = Array.from(
    contentsElement.querySelectorAll("ytd-rich-item-renderer"),
  ).filter((item) => {
    //Remove sponsored/ads and shorts
    if (
      item.querySelectorAll("ytd-ad-slot-renderer").length === 0 &&
      item.querySelectorAll(".yt-lockup-view-model--wrapper").length > 0
    ) {
      return item;
    }
  });

  // Prevent saving same set again
  const latestLink = videoCardElements[MAX_VIDEOS_PER_SET - 1]?.querySelector(
    ".yt-lockup-metadata-view-model__title",
  ).href;
  extensionAPI.storage.local.get("sets", (result) => {
    const existingSets = result.sets || [];
    const lastSet = existingSets[0] || [];
    const lastLink = lastSet[MAX_VIDEOS_PER_SET - 1]?.link;

    if (latestLink && lastLink && latestLink === lastLink) {
      console.log("Same homepage data, skipping save");
      return;
    }

    parseData(videoCardElements);
    obs.disconnect();
    homeObserverActive = false; // reset flag
  });
}

async function parseData(videoCardElements) {
  const videos = await Promise.all(
    videoCardElements.slice(0, MAX_VIDEOS_PER_SET).map(async (video) => {
      const thumbnailElement = video.querySelector("img");
      let thumbnail = null;
      try {
        thumbnail = await waitForImgSrc(thumbnailElement);
      } catch (err) {
        console.log("Thumbnail not found: ", err);
      }

      const linkElement = video.querySelector(
        ".yt-lockup-metadata-view-model__title",
      );
      if (!linkElement) return null;

      const titleElement =
        linkElement?.textContent.trim() ||
        linkElement.getAttribute("aria-label");
      return {
        id: generateUUIDv7(),
        thumbnail,
        title: titleElement,
        link: linkElement.href,
      };
    }),
  );
  const filteredVideos = videos.filter(Boolean);
  if (!filteredVideos.length) return;

  const set = {
    setId: generateUUIDv7(),
    timeAdded: new Date().toLocaleString(),
    videos: filteredVideos,
  };

  await saveToStorage(set);
}

function waitForImgSrc(img, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!img) return resolve(null);
    if (img.src) return resolve(img.src);

    const observer = new MutationObserver(() => {
      if (img.src) {
        observer.disconnect();
        resolve(img.src);
      }
    });

    observer.observe(img, { attributes: true, attributeFilter: ["src"] });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out waiting for img.src"));
    }, timeout);
  });
}

async function saveToStorage(newSet) {
  return new Promise((resolve) => {
    extensionAPI.storage.local.get("sets", (result) => {
      const existingSets = result.sets || [];
      const updatedSets = [newSet, ...existingSets];

      if (updatedSets.length > MAX_SET) {
        updatedSets.pop();
      }

      extensionAPI.storage.local.set({ sets: updatedSets }, () => {
        console.log("New set saved");
        resolve();
      });
    });
  });
}

function generateUUIDv7() {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, "0");
  const randomHex = crypto
    .getRandomValues(new Uint8Array(10))
    .reduce((acc, val) => acc + val.toString(16).padStart(2, "0"), "");

  return (
    timeHex.slice(0, 8) +
    "-" +
    timeHex.slice(8, 12) +
    "-7" +
    randomHex.slice(0, 3) +
    "-" +
    (8 + (randomHex.charCodeAt(3) % 4)).toString(16) +
    randomHex.slice(4, 6) +
    "-" +
    randomHex.slice(6, 16)
  );
}

startHistoryObserver();
