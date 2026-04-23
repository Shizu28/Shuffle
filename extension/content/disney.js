// Shuffle Extension – Disney+ Content Script (Isolated World)
// Primary source: sessionStorage["__shuffle_disney_items"] filled by disney-main.js
// Fallback: DOM scraping

const STORAGE_KEY = "__shuffle_disney_items";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SCRAPE_NOW") return;

  // ── Primary: read from sessionStorage (set by disney-main.js interceptor) ──
  let items = [];
  try {
    items = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    items = [];
  }

  // ── Fallback: DOM scraping if interceptor has no data yet ─────────────────
  if (items.length === 0) {
    items = domScrape();
  }

  if (items.length === 0) {
    const debug = debugCount();
    sendResponse({
      success: false,
      count: 0,
      hint: `Keine Titel gefunden (${debug}). Lade die Seite neu, warte bis alle Cards geladen sind, dann scanne erneut.`,
    });
    return true;
  }

  // Update scrapedAt timestamps
  const now = Date.now();
  items = items.map((i) => ({ ...i, scrapedAt: now }));

  chrome.runtime.sendMessage({ type: "SAVE_ITEMS", platform: "disney", items }, (res) => {
    sendResponse({ success: true, count: res?.count ?? items.length });
  });
  return true;
});

// ── DOM Fallback ──────────────────────────────────────────────────────────────
const NAV_WORDS = new Set([
  "home","browse","search","movies","series","originals","new","brands",
  "login","account","help","settings","legal","privacy","cookies","about",
  "store","watchlist","startseite","meineliste","filme","serien",
]);

function isContentHref(href) {
  if (!href || href === "#" || href === "/") return false;
  const path = href.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const segments = path.split("/").filter(Boolean);
  if (segments.length < 3) return false;
  const last = segments[segments.length - 1];
  if (NAV_WORDS.has(last.toLowerCase())) return false;
  // Disney version IDs always contain uppercase letters or digits
  if (last.length < 4 || !/[A-Z0-9]/.test(last)) return false;
  return true;
}

function domScrape() {
  const items = [];
  const seen = new Set();

  document.querySelectorAll("img[alt]").forEach((img) => {
    const alt = (img.getAttribute("alt") || "").trim();
    if (!alt) return;
    const anchor = img.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (!isContentHref(href)) return;
    const clean = href.split("?")[0];
    const segments = clean.replace(/^https?:\/\/[^/]+/, "").split("/").filter(Boolean);
    const contentId = segments[segments.length - 1];
    if (seen.has(contentId)) return;
    seen.add(contentId);
    items.push({
      id: `disney-${contentId}`,
      title: alt,
      platform: "disney",
      deepLink: href.startsWith("http") ? clean : `https://www.disneyplus.com${clean}`,
      type: /\/series\/|\/show\//.test(href) ? "tv" : /\/movies?\//.test(href) ? "movie" : "unknown",
      thumbnailUrl: img.src || undefined,
      scrapedAt: Date.now(),
    });
  });

  return items;
}

function debugCount() {
  let storageTry = "no-session-storage";
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    storageTry = raw ? `storage-items:${JSON.parse(raw).length}` : "storage-empty";
  } catch (e) {}
  const imgs = document.querySelectorAll("img[alt]").length;
  return `${storageTry} dom-imgs:${imgs}`;
}

