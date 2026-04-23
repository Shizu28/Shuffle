import { PlatformConfig } from "@/types";

// ─── Standard Plattformen ───────────────────────────────────────────────────────

export const DEFAULT_PLATFORMS: PlatformConfig[] = [
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    logo: "▶️",
    searchTemplate: "https://www.youtube.com/results?search_query={title}",
    supportsEmbed: true,
  },
  {
    id: "netflix",
    name: "Netflix",
    color: "#E50914",
    logo: "🎬",
    searchTemplate: "https://www.netflix.com/search?q={title}",
    deepLinkTemplate: "https://www.netflix.com/title/{id}",
  },
  {
    id: "prime",
    name: "Prime Video",
    color: "#00A8E1",
    logo: "📦",
    searchTemplate: "https://www.amazon.de/s?k={title}&i=instant-video",
    deepLinkTemplate: "https://www.amazon.de/dp/{id}",
  },
  {
    id: "disney",
    name: "Disney+",
    color: "#113CCF",
    logo: "✨",
    searchTemplate: "https://www.disneyplus.com/search/{title}",
  },
  {
    id: "appletv",
    name: "Apple TV+",
    color: "#555555",
    logo: "🍎",
    searchTemplate: "https://tv.apple.com/search?term={title}",
  },
  {
    id: "hulu",
    name: "Hulu",
    color: "#1CE783",
    logo: "📺",
    searchTemplate: "https://www.hulu.com/search?query={title}",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    color: "#F47521",
    logo: "🍥",
    searchTemplate: "https://www.crunchyroll.com/search?q={title}",
  },
  {
    id: "hbo",
    name: "Max (HBO)",
    color: "#002BE7",
    logo: "💜",
    searchTemplate: "https://www.max.com/search?q={title}",
  },
  {
    id: "paramount",
    name: "Paramount+",
    color: "#0064FF",
    logo: "⛰️",
    searchTemplate: "https://www.paramountplus.com/search/?query={title}",
  },
  {
    id: "ard",
    name: "ARD Mediathek",
    color: "#003D8F",
    logo: "🇩🇪",
    searchTemplate: "https://www.ardmediathek.de/suche/{title}",
    supportsEmbed: true,
  },
  {
    id: "zdf",
    name: "ZDF Mediathek",
    color: "#E4002B",
    logo: "📡",
    searchTemplate: "https://www.zdf.de/suche#{title}",
    supportsEmbed: true,
  },
  {
    id: "joyn",
    name: "Joyn",
    color: "#FF4500",
    logo: "🎭",
    searchTemplate: "https://www.joyn.de/suche?q={title}",
  },
  {
    id: "mubi",
    name: "MUBI",
    color: "#0ABAB5",
    logo: "🎨",
    searchTemplate: "https://mubi.com/search/{title}",
  },
];

// ─── Plattform Hilfsfunktionen ──────────────────────────────────────────────────

export function getPlatformById(
  id: string,
  customPlatforms: PlatformConfig[] = []
): PlatformConfig | undefined {
  return (
    [...DEFAULT_PLATFORMS, ...customPlatforms].find((p) => p.id === id)
  );
}

/**
 * Generiert einen Deep Link für eine Plattform.
 * Fallback: Suche auf der Plattform.
 */
export function buildDeepLink(
  platform: PlatformConfig,
  title: string,
  customUrl?: string
): string {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  return platform.searchTemplate.replace(
    "{title}",
    encodeURIComponent(title)
  );
}

export function getPlatformColor(platformId: string): string {
  const platform = getPlatformById(platformId);
  return platform?.color ?? "#8b5cf6";
}

export function getPlatformName(platformId: string): string {
  const platform = getPlatformById(platformId);
  return platform?.name ?? platformId;
}

export function getPlatformLogo(platformId: string): string {
  const platform = getPlatformById(platformId);
  return platform?.logo ?? "🎥";
}
