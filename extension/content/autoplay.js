/**
 * Shuffle - Autoplay Content Script
 * Runs on Netflix/Disney+/Prime player pages.
 *
 * Disney+ entity navigation flow:
 *   openCompanionWindow opens disneyplus.com/#shuffle=/de-de/browse/entity-{uuid}
 *   => This script reads the hash, waits for React Router to mount, then navigates
 *      internally via an anchor-click (SPA navigation, no server request).
 */
(function () {
  "use strict";

  let btnInjected = false;
  const MAX_WAIT_MS = 25000;
  const startedAt = Date.now();

  // Helper: click primary play button
  function clickPlayButton() {
    const selectors = [
      '[data-testid="play-btn"]',
      '[data-testid="resume-btn"]',
      '[data-testid="hero-play-btn"]',
      '[data-testid="primary-button"]',
      '[data-testid="hero-rail-play-button"]',
      'button[aria-label="Abspielen"]',
      'button[aria-label="Play"]',
      'button[aria-label="Weiter"]',
      'button[aria-label="Resume"]',
      'button[aria-label="Continue Watching"]',
      'a[aria-label="Abspielen"]',
      'a[aria-label="Play"]',
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) { btn.click(); return true; }
    }
    const playWords = ["weiter", "abspielen", "play", "resume"];
    for (const btn of document.querySelectorAll("button, a[role='button']")) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      if (playWords.some(w => txt === w)) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  // Helper: inject fullscreen button overlay
  function injectFullscreenButton() {
    if (btnInjected || document.getElementById("__shuffle_fs_btn")) return;
    btnInjected = true;
    const btn = document.createElement("button");
    btn.id = "__shuffle_fs_btn";
    btn.textContent = "\u26F6 Vollbild";
    Object.assign(btn.style, {
      position: "fixed", bottom: "24px", right: "24px",
      zIndex: "2147483647",
      background: "rgba(139,92,246,0.92)", color: "#fff",
      border: "none", borderRadius: "10px",
      padding: "10px 18px", fontSize: "15px", fontWeight: "700",
      cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      transition: "opacity 0.3s",
    });
    btn.addEventListener("click", () => {
      const t =
        document.querySelector(".watch-video--player-view") ||
        document.querySelector('[class*="bam-media-player"]') ||
        document.querySelector('[class*="dv-player"]') ||
        document.querySelector("video") ||
        document.documentElement;
      (t.requestFullscreen || t.webkitRequestFullscreen || function(){}).call(t);
      btn.style.opacity = "0";
      setTimeout(() => btn.remove(), 400);
    });
    setTimeout(() => { btn.style.opacity = "0"; setTimeout(() => btn.remove(), 400); }, 12000);
    document.body.appendChild(btn);
  }

  // Helper: start video playback (only for platforms that need it; Netflix auto-plays natively)
  function tryPlay(video) {
    // Netflix auto-plays on its own — calling play() can interrupt its initialization.
    if (/netflix\.com/.test(location.href)) return;
    if (!video.paused) return;
    video.play().catch(() => {
      const p = document.querySelector(
        '[aria-label="Abspielen"], [aria-label="Play"], ' +
        '[data-testid*="play-pause-btn"], [class*="PlayButton"], ' +
        '[class*="play-button"], [title="Abspielen"], [title="Play"]'
      );
      if (p) p.click();
    });
  }

  // ── Hash-based navigation for Disney+ entity URLs ─────────────────────────
  // URL format: disneyplus.com/#shuffle=%2Fde-de%2Fbrowse%2Fentity-{uuid}
  const hashMatch = location.hash.match(/[#&]shuffle=([^&]+)/);
  if (hashMatch) {
    const targetPath = decodeURIComponent(hashMatch[1]);
    // Remove hash immediately to prevent loops on reload
    history.replaceState(null, "", location.pathname);

    let navigated = false;
    let navAttempts = 0;

    const navInterval = setInterval(() => {
      if (navAttempts++ > 120) { clearInterval(navInterval); return; }

      // Wait for React Router / Disney+ nav to be active
      const navReady =
        document.querySelector("nav[class]") ||
        document.querySelector('[class*="site-nav"]') ||
        document.querySelector('[class*="GlobalNav"]') ||
        document.querySelector('a[href*="browse/home"]') ||
        document.querySelector('a[href*="startseite"]') ||
        document.querySelector('[class*="global-header"]');

      if (!navReady) return;
      clearInterval(navInterval);
      if (navigated) return;
      navigated = true;

      // Dispatch to MAIN world via shared document.
      // disney-main.js (MAIN world) receives this and calls history.pushState +
      // window.dispatchEvent(popstate) on the REAL page window — reaching the SPA router.
      document.dispatchEvent(new CustomEvent("__shuffle_navigate", {
        detail: targetPath,
        bubbles: false,
      }));

      // Poll for play button - content script won't re-run on SPA navigation
      let playAttempts = 0;
      const playInterval = setInterval(() => {
        if (playAttempts++ > 40) { clearInterval(playInterval); return; }
        if (clickPlayButton()) clearInterval(playInterval);
      }, 500);
    }, 250);

    return; // Don't run startWatcher on the homepage
  }

  // ── Main watcher for direct page loads ───────────────────────────────────
  function startWatcher() {
    const isDisneyDetail = /disneyplus\.com\/.*(?:browse\/entity-|\/series\/|\/movies\/)/.test(location.href);

    if (isDisneyDetail) {
      // Direct load of a detail page: poll for play button
      let attempts = 0;
      const interval = setInterval(() => {
        if (Date.now() - startedAt > MAX_WAIT_MS || attempts++ > 50) {
          clearInterval(interval);
          return;
        }
        if (clickPlayButton()) clearInterval(interval);
      }, 500);
      return;
    }

    // Player page (Netflix /watch/, Disney+ /play/, Prime /detail/): wait for <video>
    const check = () => {
      if (Date.now() - startedAt > MAX_WAIT_MS) { observer.disconnect(); return; }
      const video = document.querySelector("video");
      if (!video) return;
      observer.disconnect();
      setTimeout(() => {
        tryPlay(video);
        injectFullscreenButton();
      }, 800);
    };

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    check();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatcher);
  } else {
    startWatcher();
  }
})();
