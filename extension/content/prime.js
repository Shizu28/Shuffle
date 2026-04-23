// Shuffle Extension – Prime Video Content Script
// Works on primevideo.com and amazon.de/amazon.com video sections.
// Best used on: primevideo.com/watchlist

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SCRAPE_NOW") return;
  const items = scrape();
  if (items.length === 0) {
    sendResponse({ success: false, count: 0, hint: "Keine Titel gefunden. Navigiere zur Prime Video Merkliste und versuche es erneut." });
    return true;
  }
  chrome.runtime.sendMessage({ type: "SAVE_ITEMS", platform: "prime", items }, (res) => {
    sendResponse({ success: true, count: res?.count ?? items.length });
  });
  return true;
});

function scrape() {
  const items = [];
  const seen = new Set();

  // Prime Video title links match /detail/ or /dp/ patterns
  document.querySelectorAll("a[href*='/detail/'], a[href*='/dp/']").forEach((link) => {
    const href = link.getAttribute("href") || "";

    // Extract ASIN (Amazon Standard Identification Number) – the content ID
    const asinMatch =
      href.match(/\/detail\/([A-Z0-9]{10})/) ||
      href.match(/\/dp\/([A-Z0-9]{10})/);
    if (!asinMatch) return;
    const asin = asinMatch[1];
    if (seen.has(asin)) return;
    seen.add(asin);

    // Title can be in data-automation-id or aria-label or image alt
    const container = link.closest("[data-testid], [data-automation-id], [class*='DashCard'], [class*='card']") || link.parentElement;
    const title =
      container?.querySelector("[data-automation-id='title-metadata-title']")?.textContent?.trim() ||
      container?.querySelector("[class*='title']")?.textContent?.trim() ||
      link.getAttribute("aria-label") ||
      link.querySelector("img")?.getAttribute("alt") ||
      link.textContent?.trim() ||
      "";
    if (!title || title.length < 1) return;

    const thumb = link.querySelector("img")?.src || container?.querySelector("img")?.src || undefined;

    // Detect type from URL or metadata
    let type = "unknown";
    if (href.includes("/season/") || container?.textContent?.includes("Staffel") || container?.textContent?.includes("Season")) {
      type = "tv";
    }

    const baseUrl = location.hostname.includes("primevideo.com")
      ? "https://www.primevideo.com"
      : `https://www.${location.hostname}`;

    items.push({
      id: `prime-${asin}`,
      title: title.replace(/\s+/g, " ").trim(),
      platform: "prime",
      deepLink: href.startsWith("http") ? href.split("?")[0] : `${baseUrl}${href.split("?")[0]}`,
      type,
      thumbnailUrl: thumb,
      scrapedAt: Date.now(),
    });
  });

  return items;
}
