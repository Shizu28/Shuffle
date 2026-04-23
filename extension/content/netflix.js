// Shuffle Extension – Netflix Content Script
// Scrapes "Meine Liste" and all visible title cards.
// Trigger: popup sends { type: 'SCRAPE_NOW' } via chrome.tabs.sendMessage

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SCRAPE_NOW") return;
  const items = scrape();
  if (items.length === 0) {
    // Debug: report what selectors found anything at all
    const debug = debugCount();
    sendResponse({ success: false, count: 0, hint: `Keine Titel gefunden (${debug}). Scrolle die Seite einmal durch und versuche es erneut.` });
    return true;
  }
  chrome.runtime.sendMessage({ type: "SAVE_ITEMS", platform: "netflix", items }, (res) => {
    sendResponse({ success: true, count: res?.count ?? items.length });
  });
  return true;
});

function scrape() {
  const items = [];
  const seen = new Set();

  function addItem(titleId, title, href, thumbUrl) {
    if (!titleId || !title || seen.has(titleId)) return;
    seen.add(titleId);
    items.push({
      id: `netflix-${titleId}`,
      title: title.trim(),
      platform: "netflix",
      deepLink: `https://www.netflix.com/watch/${titleId}`,
      type: "unknown",
      thumbnailUrl: thumbUrl || undefined,
      scrapedAt: Date.now(),
    });
  }

  // ── Strategy 1: <a href="/title/ID"> links ────────────────────────────────
  document.querySelectorAll("a[href*='/title/']").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const m = href.match(/\/title\/(\d+)/);
    if (!m) return;
    const title = extractTitle(link);
    const thumb = extractThumb(link);
    addItem(m[1], title, href, thumb);
  });

  // ── Strategy 2: <a href="/watch/ID"> links (play buttons) ─────────────────
  document.querySelectorAll("a[href*='/watch/']").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const m = href.match(/\/watch\/(\d+)/);
    if (!m) return;
    const title = extractTitle(link);
    const thumb = extractThumb(link);
    addItem(m[1], title, href, thumb);
  });

  // ── Strategy 3: data-title-id attribute on any element ───────────────────
  document.querySelectorAll("[data-title-id]").forEach((el) => {
    const titleId = el.getAttribute("data-title-id");
    if (!titleId) return;
    const title = extractTitle(el);
    const thumb = extractThumb(el);
    addItem(titleId, title, null, thumb);
  });

  // ── Strategy 4: data-id on list-context rows ──────────────────────────────
  document.querySelectorAll("[data-list-context] [data-id], [data-id][class*='title-card']").forEach((el) => {
    const titleId = el.getAttribute("data-id");
    if (!titleId || !/^\d+$/.test(titleId)) return;
    const title = extractTitle(el);
    const thumb = extractThumb(el);
    addItem(titleId, title, null, thumb);
  });

  // ── Strategy 5: img[alt] inside slider rows ───────────────────────────────
  // Netflix title card images always have alt = title name
  document.querySelectorAll(
    ".slick-track img[alt], .slider-item img[alt], [class*='title-card'] img[alt], [class*='TitleCard'] img[alt]"
  ).forEach((img) => {
    const alt = img.getAttribute("alt") || "";
    if (!alt || alt.length < 1) return;
    // Try to find ID from nearest anchor
    const anchor = img.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    const m = href.match(/\/(?:title|watch)\/(\d+)/);
    if (!m) return;
    const thumb = img.src || img.getAttribute("data-src") || undefined;
    addItem(m[1], alt, href, thumb);
  });

  // ── Strategy 6: aria-label on clickable card containers ──────────────────
  document.querySelectorAll("[aria-label][class*='card' i], [aria-label][class*='Card']").forEach((el) => {
    const label = el.getAttribute("aria-label") || "";
    if (!label) return;
    const anchor = el.querySelector("a[href*='/title/'], a[href*='/watch/']") || el.closest("a[href]");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    const m = href.match(/\/(?:title|watch)\/(\d+)/);
    if (!m) return;
    const thumb = extractThumb(el);
    addItem(m[1], label, href, thumb);
  });

  return items;
}

function extractTitle(el) {
  if (!el) return "";
  // 1. img alt (most reliable on Netflix)
  const img = el.querySelector("img[alt]") || (el.tagName === "IMG" ? el : null);
  if (img) {
    const alt = img.getAttribute("alt") || "";
    if (alt.length > 0 && alt.length < 150) return alt;
  }
  // 2. aria-label walking up
  let cur = el;
  for (let i = 0; i < 6; i++) {
    if (!cur) break;
    const label = cur.getAttribute("aria-label") || "";
    if (label.length > 0 && label.length < 150) return label;
    cur = cur.parentElement;
  }
  // 3. .fallback-text / span with text
  const textEl =
    el.querySelector(".fallback-text") ||
    el.querySelector("[class*='title' i]") ||
    el.querySelector("p, span");
  const t = textEl?.textContent?.trim() || el.textContent?.trim() || "";
  return t.length < 200 ? t : "";
}

function extractThumb(el) {
  const img = el.querySelector("img") || (el.tagName === "IMG" ? el : null);
  return img?.src || img?.getAttribute("data-src") || undefined;
}

function debugCount() {
  const a1 = document.querySelectorAll("a[href*='/title/']").length;
  const a2 = document.querySelectorAll("a[href*='/watch/']").length;
  const a3 = document.querySelectorAll("[data-title-id]").length;
  const a4 = document.querySelectorAll("[class*='title-card'] img[alt]").length;
  return `links/title:${a1} links/watch:${a2} data-title-id:${a3} card-imgs:${a4}`;
}
