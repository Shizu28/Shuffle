import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function formatEpisode(season: number, episode: number): string {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

/**
 * Versucht eine URL in eine einbettbare Embed-URL umzuwandeln.
 * Unterstützt YouTube (Single/Playlist/Shorts), ARD Mediathek.
 * Gibt null zurück wenn kein Embed möglich.
 */
export function getEmbedUrl(url?: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();

  // YouTube Playlist: youtube.com/playlist?list=PLxxx
  //                   youtube.com/watch?v=xxx&list=PLxxx
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    // Channel pages cannot be embedded — return null so companion window is used instead
    if (/youtube\.com\/(?:@|user\/|c\/)/.test(u)) return null;

    const listMatch = u.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (listMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&enablejsapi=1&rel=0`;
    }
    // Single video
    const vidMatch = u.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    if (vidMatch) {
      return `https://www.youtube.com/embed/${vidMatch[1]}?enablejsapi=1&rel=0&modestbranding=1`;
    }
  }

  // ARD Mediathek: ardmediathek.de/video/.../VIDEOID
  const ardMatch = u.match(
    /ardmediathek\.de\/(?:video|embed)\/(?:[^/?#]+\/)*([A-Za-z0-9+/=_-]{20,})\/?(?:[?#]|$)/
  );
  if (ardMatch) {
    return `https://www.ardmediathek.de/embed/${ardMatch[1]}`;
  }

  return null;
}

/** Prüft ob eine URL eine YouTube-Kanal-Seite ist (nicht einbettbar). */
export function isYouTubeChannelUrl(url?: string): boolean {
  if (!url?.trim()) return false;
  return /youtube\.com\/(?:@|user\/|c\/)/.test(url.trim());
}

/** Öffnet eine URL in einem kontrollierten Companion-Popup-Fenster. Gibt das Window-Objekt zurück. */
export function openCompanionWindow(url: string): Window | null {
  const width = 1200;
  const height = 720;
  const left = Math.max(0, Math.round((screen.width - width) / 2));
  const top = Math.max(0, Math.round((screen.height - height) / 2));
  return window.open(
    url,
    "shuffle-companion",
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
}
