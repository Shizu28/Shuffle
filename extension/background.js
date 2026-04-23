// Shuffle Extension – Background Service Worker
// Handles all storage operations and message routing.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SAVE_ITEMS") {
    chrome.storage.local.get(["library"], (result) => {
      const library = result.library || {};
      library[message.platform] = {
        items: message.items,
        scrapedAt: Date.now(),
      };
      chrome.storage.local.set({ library }, () => {
        sendResponse({ success: true, count: message.items.length });
      });
    });
    return true; // keep message channel open for async response
  }

  if (message.type === "GET_LIBRARY") {
    chrome.storage.local.get(["library"], (result) => {
      sendResponse({ library: result.library || {} });
    });
    return true;
  }

  if (message.type === "CLEAR_PLATFORM") {
    chrome.storage.local.get(["library"], (result) => {
      const library = result.library || {};
      delete library[message.platform];
      chrome.storage.local.set({ library }, () => sendResponse({ success: true }));
    });
    return true;
  }

  if (message.type === "CLEAR_ALL") {
    chrome.storage.local.remove("library", () => sendResponse({ success: true }));
    return true;
  }
});
