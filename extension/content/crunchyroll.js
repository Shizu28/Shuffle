// Shuffle Extension – Crunchyroll Content Script
// Best used on: crunchyroll.com/watchlist

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SCRAPE_NOW") return;
  const items = scrape();
  if (items.length === 0) {
    sendResponse({ success: false, count: 0, hint: "Keine Titel gefunden. Navigiere zur Crunchyroll Watchlist und versuche es erneut." });
    return true;
  }
  chrome.runtime.sendMessage({ type: "SAVE_ITEMS", platform: "crunchyroll", items }, (res) => {
    sendResponse({ success: true, count: res?.count ?? items.length });
  });
  return true;
});

function scrape() {
  const items = [];
  const seen = new Set();

  // Crunchyroll series links: /series/SLUG or /watch/SLUG
  document.querySelectorAll("a[href*='/series/'], a[href*='/watch/']").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const m = href.match(/\/(series|watch)\/([A-Z0-9]+)/i);
    if (!m) return;
    const id = m[2];
    if (seen.has(id)) return;
    seen.add(id);

    const container =
      link.closest("[class*='card'], [class*='Card'], [class*='item'], [data-t]") ||
      link.parentElement;

    const title =
      container?.querySelector("[class*='title'], [class*='Title'], h4, h3, p[class*='name']")?.textContent?.trim() ||
      link.getAttribute("aria-label") ||
      link.querySelector("img")?.getAttribute("alt") ||
      link.textContent?.trim() ||
      "";
    if (!title || title.length < 1) return;

    const thumb = link.querySelector("img")?.src || container?.querySelector("img")?.src || undefined;
    const type = href.includes("/series/") ? "tv" : "unknown";

    items.push({
      id: `crunchyroll-${id}`,
      title: title.replace(/\s+/g, " ").trim(),
      platform: "crunchyroll",
      deepLink: href.startsWith("http") ? href.split("?")[0] : `https://www.crunchyroll.com${href.split("?")[0]}`,
      type,
      thumbnailUrl: thumb,
      scrapedAt: Date.now(),
    });
  });

  return items;
}
