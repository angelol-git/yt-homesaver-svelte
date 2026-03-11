// This script runs in the page context (not isolated) and can access ytInitialData
(function () {
  "use strict";

  console.log("[YTHomeSaver PageScript] Injected into page");

  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data.type !== "YTHOME_REQUEST_DATA") return;

    let data = null;
    let attempts = 0;
    const maxAttempts = 10;

    function checkForData() {
      attempts++;

      if (window.ytInitialData) {
        data = window.ytInitialData;
        sendData();
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkForData, 250);
      } else {
        console.log(
          "[YTHomeSaver PageScript] ytInitialData not found after",
          maxAttempts,
          "attempts",
        );
        sendData();
      }
    }

    function sendData() {
      window.postMessage(
        {
          type: "YTHOME_DATA",
          payload: data,
        },
        "*",
      );
    }

    checkForData();
  });

  if (location.pathname === "/") {
    setTimeout(function () {
      if (window.ytInitialData) {
        console.log(
          "[YTHomeSaver PageScript] Auto-sending ytInitialData on page load",
        );
        window.postMessage(
          {
            type: "YTHOME_DATA",
            payload: window.ytInitialData,
          },
          "*",
        );
      }
    }, 1000);
  }
})();
