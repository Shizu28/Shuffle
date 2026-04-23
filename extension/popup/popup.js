// Shuffle Extension – Popup Logic (v2 – mit Script-Injection Fallback & Feedback)

const PLATFORMS = {
  netflix:     { name: "Netflix",      icon: "🎬", hint: "netflix.com/browse/my-list",  script: "content/netflix.js" },
  disney:      { name: "Disney+",      icon: "✨", hint: "disneyplus.com/de-de/browse/watchlist", script: "content/disney.js" },
  prime:       { name: "Prime Video",  icon: "📦", hint: "primevideo.com/watchlist",     script: "content/prime.js" },
  crunchyroll: { name: "Crunchyroll",  icon: "🍥", hint: "crunchyroll.com/watchlist",    script: "content/crunchyroll.js" },
};

const SHUFFLE_URL = "http://localhost:3002/import";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const btnScrape      = document.getElementById("btn-scrape-now");
const btnClearAll    = document.getElementById("btn-clear-all");
const btnOpenShuffle = document.getElementById("btn-open-shuffle");
const pageHint       = document.getElementById("page-hint");
const scrapeStatus   = document.getElementById("scrape-status");
const platformRows   = document.getElementById("platform-rows");
const totalCount     = document.getElementById("total-count");

// ── Init ──────────────────────────────────────────────────────────────────────
refreshLibraryUI();

// Detect current tab to show relevant hint
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) return;
  const url = tab.url;
  const platform = detectPlatform(url);
  if (platform) {
    const hint = PLATFORMS[platform]?.hint || "";
    pageHint.innerHTML = `<strong>${PLATFORMS[platform]?.icon} ${PLATFORMS[platform]?.name}</strong> erkannt &ndash; navigiere zu <em>${hint}</em> und klicke &bdquo;Seite scannen&ldquo;.`;
  } else {
    pageHint.textContent = 'Navigiere zur Merkliste einer Plattform und klicke "Seite scannen".';
  }
});

// ── Scrape current tab ────────────────────────────────────────────────────────
btnScrape.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab?.url) {
    showStatus("Kein aktiver Tab gefunden.", "error");
    return;
  }

  const platform = detectPlatform(tab.url);
  if (!platform) {
    showStatus("⚠️ Diese Seite wird nicht unterstützt. Öffne Netflix, Disney+, Prime oder Crunchyroll.", "error");
    return;
  }

  const cfg = PLATFORMS[platform];
  btnScrape.disabled = true;
  btnScrape.textContent = "⏳ Scannt…";

  try {
    // Disney+ uses a ServiceWorker for API calls → window.fetch interception doesn't work.
    // Instead: scan React fiber tree directly in MAIN world.
    if (platform === "disney") {
      setProgress("🔍 Scanne Disney+ (Cache / Store / Fiber)…");
      const { items, diag } = await scrapeDisneyViaReact(tab.id);
      if (!items || items.length === 0) {
        const diagStr = (diag || []).join(" | ");
        showStatus(`⚠️ Keine Titel gefunden. ${diagStr}`, "error");
        resetBtn();
        return;
      }
      setProgress(`💾 Speichere ${items.length} Titel…`);
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "SAVE_ITEMS", platform: "disney", items }, () => resolve());
      });
      showStatus(`✅ ${items.length} Titel von Disney+ gespeichert!`, "success");
      refreshLibraryUI();
      resetBtn();
      return;
    }

    // Step 1: Try to reach already-injected content script
    setProgress("🔍 Verbinde mit Seite…");
    let response = await sendMessageWithTimeout(tab.id, { type: "SCRAPE_NOW" }, 4000);

    // Step 2: No response → tab was open before install → inject script dynamically
    if (!response) {
      setProgress("💉 Injiziere Scraper (Tab neu → einmalig nötig)…");
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [cfg.script] });
      } catch (injErr) {
        showStatus(`❌ Injection fehlgeschlagen: ${injErr.message} — Lade die Seite neu (F5) und versuche es erneut.`, "error");
        resetBtn();
        return;
      }
      await sleep(400);
      setProgress("📡 Sende Scan-Befehl…");
      response = await sendMessageWithTimeout(tab.id, { type: "SCRAPE_NOW" }, 6000);
    }

    if (!response) {
      showStatus("❌ Keine Antwort vom Scraper. Bitte Seite neu laden (F5) und nochmal versuchen.", "error");
      resetBtn();
      return;
    }

    if (!response.success) {
      showStatus(`⚠️ ${response.hint || "Keine Titel gefunden."}`, "error");
    } else {
      showStatus(`✅ ${response.count} Titel von ${cfg.name} gespeichert!`, "success");
      refreshLibraryUI();
    }
  } catch (err) {
    showStatus(`❌ Fehler: ${err.message}`, "error");
  }

  resetBtn();
});

// ── Clear all ─────────────────────────────────────────────────────────────────
btnClearAll.addEventListener("click", () => {
  if (!confirm("Alle gespeicherten Bibliotheksdaten löschen?")) return;
  chrome.runtime.sendMessage({ type: "CLEAR_ALL" }, () => {
    refreshLibraryUI();
    showStatus("Bibliothek geleert.", "success");
  });
});

// ── Open Shuffle import page ──────────────────────────────────────────────────
btnOpenShuffle.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: SHUFFLE_URL });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function refreshLibraryUI() {
  chrome.runtime.sendMessage({ type: "GET_LIBRARY" }, ({ library }) => {
    if (!library) return;
    const keys = Object.keys(library);
    let total = 0;

    if (keys.length === 0) {
      platformRows.innerHTML = "<p style='color:rgba(255,255,255,0.25); font-size:11px;'>Noch keine Daten. Scanne zuerst deine Merklisten.</p>";
      totalCount.textContent = "0 Titel";
      return;
    }

    platformRows.innerHTML = "";
    keys.forEach((platform) => {
      const { items, scrapedAt } = library[platform];
      total += items.length;
      const cfg = PLATFORMS[platform] || { name: platform, icon: "📺" };
      const ago = timeAgo(scrapedAt);

      const row = document.createElement("div");
      row.className = "platform-row";
      row.innerHTML = `
        <div class="platform-info">
          <span class="platform-icon">${cfg.icon}</span>
          <div>
            <div class="platform-name">${cfg.name}</div>
            <div class="platform-count">${items.length} Titel · ${ago}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" data-platform="${platform}" title="Löschen">🗑</button>
      `;
      row.querySelector("button").addEventListener("click", (e) => {
        const p = e.target.dataset.platform;
        chrome.runtime.sendMessage({ type: "CLEAR_PLATFORM", platform: p }, () => refreshLibraryUI());
      });
      platformRows.appendChild(row);
    });

    totalCount.textContent = `${total} Titel`;
  });
}

/**
 * Disney+ DOM scraper – uses data-item-id attribute on every content card.
 * Title extracted from aria-label (strips platform/type descriptors + German suffix).
 */
async function scrapeDisneyViaReact(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: () => {
        const items = [];
        const seen = new Set();

        const cards = document.querySelectorAll("a[data-item-id]");

        for (const card of cards) {
          const rawId = card.getAttribute("data-item-id");
          if (!rawId || seen.has(rawId)) continue;
          seen.add(rawId);

          const ariaLabel = card.getAttribute("aria-label") || "";

          // Clean up title from aria-label
          // Format: "Solar Opposites Hulu Original Series Für Details zu diesem Titel auswählen."
          let title = ariaLabel
            // German / English "for details" suffix
            .replace(/\s+Für Details zu diesem Titel[^]*$/i, "")
            .replace(/\s+For more details[^]*$/i, "")
            .replace(/\s+Select (to get|for) details[^]*$/i, "")
            // Platform brand + type: "Disney+ Original Series", "Hulu Original Series", etc.
            .replace(/\s+(Disney\+?|Hulu|Star\+?|ESPN\+?|National\s+Geographic|NatGeo)\s+Original\s+(Series|Movie|Film|Kurzfilm|Special)\s*$/i, "")
            // Just "Original Series/Movie/Film"
            .replace(/\s+Original\s+(Series|Movie|Film|Kurzfilm|Special)\s*$/i, "")
            // Plain type word at end: "Series", "Film", etc.
            .replace(/\s+(Series|Movie|Film|Kurzfilm|Show|Special)\s*$/i, "")
            .trim();

          const lbl = ariaLabel.toLowerCase();
          const isMovie = /\bfilm\b|\bmovie\b/.test(lbl);
          const isSeries = /\bseries\b|\bshow\b|\bserie\b/.test(lbl);

          const img = card.querySelector("img");

          items.push({
            id: `disney-${rawId}`,
            title: title || rawId,
            platform: "disney",
            deepLink: `https://www.disneyplus.com/play/${rawId}`,
            type: isMovie ? "movie" : isSeries ? "tv" : "unknown",
            thumbnailUrl: img?.src || undefined,
            scrapedAt: Date.now(),
          });
        }

        return { items, diag: [`cards:${cards.length}`] };
      },
    });
    const res = results?.[0]?.result;
    if (!res) return { items: [], diag: ["executeScript returned nothing"] };
    return { items: res.items || [], diag: res.diag || [] };
  } catch (err) {
    console.error("[Shuffle] Disney scan failed:", err);
    return { items: [], diag: [`error: ${err.message}`] };
  }
}
/** Sends a message to a tab and resolves with response or null on error/timeout. */
function sendMessageWithTimeout(tabId, message, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, timeoutMs);
    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve(chrome.runtime.lastError ? null : response);
      }
    });
  });
}

function setProgress(msg) {
  scrapeStatus.textContent = msg;
  scrapeStatus.className = "status-msg";
  scrapeStatus.style.display = "block";
  scrapeStatus.style.background = "rgba(139,92,246,0.12)";
  scrapeStatus.style.color = "#c4b5fd";
}

function showStatus(msg, type) {
  scrapeStatus.textContent = msg;
  scrapeStatus.style.background = "";
  scrapeStatus.style.color = "";
  scrapeStatus.className = "status-msg" + (type ? ` ${type}` : "");
  scrapeStatus.style.display = type ? "block" : "none";
}

function resetBtn() {
  btnScrape.disabled = false;
  btnScrape.textContent = "📥 Seite scannen";
}

function detectPlatform(url) {
  if (url.includes("netflix.com")) return "netflix";
  if (url.includes("disneyplus.com")) return "disney";
  if (url.includes("primevideo.com") || (url.includes("amazon.") && url.includes("/video"))) return "prime";
  if (url.includes("crunchyroll.com")) return "crunchyroll";
  return null;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.floor(h / 24)} Tagen`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
