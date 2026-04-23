// Shuffle Extension – Bridge Content Script
// Runs on localhost (the Shuffle app).
// Listens for postMessage requests from the page and responds with library data from chrome.storage.

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "SHUFFLE_GET_LIBRARY") {
    chrome.runtime.sendMessage({ type: "GET_LIBRARY" }, (response) => {
      window.postMessage({
        type: "SHUFFLE_LIBRARY_RESPONSE",
        library: response?.library || {},
      }, "*");
    });
  }

  if (event.data?.type === "SHUFFLE_CLEAR_LIBRARY") {
    chrome.runtime.sendMessage({ type: "CLEAR_ALL" }, () => {
      window.postMessage({ type: "SHUFFLE_LIBRARY_CLEARED" }, "*");
    });
  }

  // Respond to ping – fixes race condition where page registers listener
  // after the initial SHUFFLE_EXTENSION_READY was already posted.
  if (event.data?.type === "SHUFFLE_PING") {
    window.postMessage({ type: "SHUFFLE_EXTENSION_READY" }, "*");
  }
});

// Signal to the page that the extension is installed (early load case)
window.postMessage({ type: "SHUFFLE_EXTENSION_READY" }, "*");
