// Shuffle Extension – Disney+ Fetch Interceptor (MAIN WORLD)
// Runs in the page's JS context so it can intercept window.fetch.
// Saves scraped items to sessionStorage for disney.js (isolated world) to read.

(function () {
  const STORAGE_KEY = "__shuffle_disney_items";

  function saveItems(newItems) {
    if (!newItems || newItems.length === 0) return;
    try {
      const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      const seen = new Set(existing.map((i) => i.id));
      const merged = [...existing];
      newItems.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      // sessionStorage unavailable – ignore
    }
  }

  function extractTitle(textObj) {
    // Disney API text structure: text.title.full.{series|movie|program}.default.content
    if (!textObj) return "";
    try {
      const full = textObj?.title?.full;
      if (!full) return "";
      for (const type of ["series", "movie", "program", "collection"]) {
        const content = full[type]?.default?.content;
        if (content) return content;
      }
      // Fallback: first nested content found
      const vals = Object.values(full);
      for (const v of vals) {
        const c = v?.default?.content;
        if (c) return c;
      }
    } catch (e) {}
    return "";
  }

  function extractThumb(imageObj) {
    // Disney API image structure: image.tile["1.78"].{series|movie}.default.url
    try {
      const tile = imageObj?.tile;
      if (!tile) return undefined;
      for (const ratio of ["1.78", "0.71", "1.33", "2.89"]) {
        const ratioObj = tile[ratio];
        if (!ratioObj) continue;
        for (const type of ["series", "movie", "program", "default"]) {
          const url = ratioObj[type]?.default?.url || ratioObj[type]?.url;
          if (url) return url;
        }
      }
    } catch (e) {}
    return undefined;
  }

  function processHit(hit) {
    // hit is a DmcSeries, DmcVideo, or StandardCollection item
    const type = hit.__typename || hit.type || "";
    const isSeries = /series/i.test(type);
    const isMovie = /movie|video/i.test(type);

    const contentId =
      hit.contentId ||
      hit.encodedSeriesId ||
      hit.encodedContentId ||
      hit.seriesId ||
      hit.videoId ||
      hit.id;
    if (!contentId) return null;

    const title = extractTitle(hit.text) || hit.title || "";
    if (!title) return null;

    const thumb = extractThumb(hit.image);

    // Build deep link
    const slug = (hit.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const deepLink = `https://www.disneyplus.com${isSeries ? "/series" : "/movies"}/${slug}/${contentId}`;

    return {
      id: `disney-${contentId}`,
      title,
      platform: "disney",
      deepLink,
      type: isSeries ? "tv" : isMovie ? "movie" : "unknown",
      thumbnailUrl: thumb,
      scrapedAt: Date.now(),
    };
  }

  function tryExtract(json) {
    const items = [];
    if (!json || typeof json !== "object") return items;

    // Recursively find arrays that look like content lists
    function findHits(obj, depth) {
      if (depth > 8 || !obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        // If this array contains objects with __typename or contentId, treat as hits
        if (obj.length > 0 && obj[0] && typeof obj[0] === "object" &&
            (obj[0].__typename || obj[0].contentId || obj[0].encodedSeriesId || obj[0].videoId || obj[0].seriesId)) {
          obj.forEach((hit) => {
            const item = processHit(hit);
            if (item) items.push(item);
          });
          return;
        }
        obj.forEach((child) => findHits(child, depth + 1));
      } else {
        // Check common known keys first
        const knownKeys = ["items", "hits", "videos", "results", "entities", "content", "watchlist", "UserWatchList"];
        for (const key of knownKeys) {
          if (obj[key]) findHits(obj[key], depth + 1);
        }
        // Also check all values shallowly
        if (depth < 4) {
          Object.values(obj).forEach((v) => {
            if (v && typeof v === "object") findHits(v, depth + 1);
          });
        }
      }
    }

    findHits(json, 0);
    // Deduplicate
    const seen = new Set();
    return items.filter((i) => seen.has(i.id) ? false : seen.add(i.id));
  }

  // ── Intercept fetch ───────────────────────────────────────────────────────
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      // Capture ALL bamgrid.com or Disney+ API calls (no keyword filter)
      if (/bamgrid\.com|disneyplus\.com\/api|execute-api/i.test(url)) {
        const clone = response.clone();
        clone.json().then((json) => {
          const items = tryExtract(json);
          if (items.length > 0) {
            saveItems(items);
            window.dispatchEvent(new CustomEvent("__shuffleDisneyData", { detail: items.length }));
          }
          // Debug: log all API URLs regardless so we can see what's being called
          console.debug("[Shuffle] Disney API:", url.substring(0, 120), "→ extracted:", items.length);
        }).catch(() => {});
      }
    } catch (e) {}
    return response;
  };

  // Also intercept XMLHttpRequest for older code paths
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__shuffleUrl = url;
    return _open.apply(this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const url = this.__shuffleUrl || "";
        if (
          /bamgrid\.com|disneyplus\.com\/api/.test(url) &&
          /watchlist|WatchList|collection|Collection/i.test(url)
        ) {
          const json = JSON.parse(this.responseText);
          const items = tryExtract(json);
          if (items.length > 0) saveItems(items);
        }
      } catch (e) {}
    });
    return _send.apply(this, args);
  };
})();
