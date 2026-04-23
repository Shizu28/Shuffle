import { nanoid } from "nanoid";
import { PlaylistItem, QueueEntry, ShuffleConfig, ShuffleMode } from "@/types";
import { buildDeepLink, getPlatformById } from "./platforms";

// ─── Queue Generator ─────────────────────────────────────────────────────────────

/**
 * Generiert eine geordnete Shuffle-Queue basierend auf Playlist-Items und Konfiguration.
 *
 * Beispiel "pattern" mit 3x Serie A, 2x Serie B:
 *   A1, A2, A3, B1, B2, A4, A5, A6, B3, B4, ...
 */
export function generateQueue(
  items: PlaylistItem[],
  config: ShuffleConfig
): QueueEntry[] {
  if (items.length === 0) return [];

  // Kopie mit mutierungsfreiem Episoden-Tracking
  const trackers = items.map((item) => ({
    item,
    currentSeason: item.currentSeason || item.startSeason || 1,
    currentEpisode: item.currentEpisode || item.startEpisode || 1,
  }));

  const queue: QueueEntry[] = [];

  switch (config.mode) {
    case "pattern":
      queue.push(...generatePatternQueue(trackers, config));
      break;
    case "random":
      queue.push(...generateRandomQueue(trackers, config));
      break;
    case "sequential":
      queue.push(...generateSequentialQueue(trackers, config));
      break;
  }

  return queue;
}

// ─── Pattern Mode ────────────────────────────────────────────────────────────────
// Runde für Runde: erst X Folgen von Item 1, dann Y Folgen von Item 2, etc.

type Tracker = {
  item: PlaylistItem;
  currentSeason: number;
  currentEpisode: number;
};

function generatePatternQueue(
  trackers: Tracker[],
  config: ShuffleConfig
): QueueEntry[] {
  const queue: QueueEntry[] = [];

  for (let cycle = 0; cycle < config.cycles; cycle++) {
    const order = config.randomizeOrder
      ? [...trackers].sort(() => Math.random() - 0.5)
      : [...trackers];

    for (const tracker of order) {
      const { item } = tracker;

      if (item.mediaType === "movie") {
        queue.push(buildMovieEntry(item));
      } else {
        // episodesPerCycle Folgen pro Runde
        for (let i = 0; i < item.episodesPerCycle; i++) {
          queue.push(
            buildEpisodeEntry(item, tracker.currentSeason, tracker.currentEpisode)
          );
          advanceEpisode(tracker, item);
        }
      }
    }
  }

  return queue;
}

// ─── Random Mode ─────────────────────────────────────────────────────────────────
// Alle Items werden in einen Pool geworfen und zufällig gemischt

function generateRandomQueue(
  trackers: Tracker[],
  config: ShuffleConfig
): QueueEntry[] {
  const pool: QueueEntry[] = [];

  for (const tracker of trackers) {
    const { item } = tracker;
    const total = config.cycles * item.episodesPerCycle;

    if (item.mediaType === "movie") {
      for (let i = 0; i < config.cycles; i++) {
        pool.push(buildMovieEntry(item));
      }
    } else {
      for (let i = 0; i < total; i++) {
        pool.push(
          buildEpisodeEntry(item, tracker.currentSeason, tracker.currentEpisode)
        );
        advanceEpisode(tracker, item);
      }
    }
  }

  // Fisher-Yates Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

// ─── Sequential Mode ─────────────────────────────────────────────────────────────
// Item 1 komplett, dann Item 2 komplett, etc.

function generateSequentialQueue(
  trackers: Tracker[],
  config: ShuffleConfig
): QueueEntry[] {
  const queue: QueueEntry[] = [];

  for (const tracker of trackers) {
    const { item } = tracker;

    if (item.mediaType === "movie") {
      queue.push(buildMovieEntry(item));
    } else {
      const totalEpisodes = getTotalEpisodes(item);
      const episodesToQueue = Math.min(
        totalEpisodes,
        config.cycles * item.episodesPerCycle
      );

      for (let i = 0; i < episodesToQueue; i++) {
        queue.push(
          buildEpisodeEntry(item, tracker.currentSeason, tracker.currentEpisode)
        );
        advanceEpisode(tracker, item);
      }
    }
  }

  return queue;
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────────

function buildMovieEntry(item: PlaylistItem): QueueEntry {
  const platform = getPlatformById(item.preferredPlatform);
  const deepLink = platform
    ? buildDeepLink(platform, item.title, item.customUrl)
    : "#";

  return {
    id: nanoid(),
    playlistItemId: item.id,
    tmdbId: item.tmdbId,
    mediaType: "movie",
    title: item.title,
    posterPath: item.posterPath,
    duration: item.duration,
    platform: item.preferredPlatform,
    deepLink,
    watched: false,
  };
}

function buildEpisodeEntry(
  item: PlaylistItem,
  season: number,
  episode: number
): QueueEntry {
  const platform = getPlatformById(item.preferredPlatform);
  const deepLink = platform
    ? buildDeepLink(platform, item.title, item.customUrl)
    : "#";

  return {
    id: nanoid(),
    playlistItemId: item.id,
    tmdbId: item.tmdbId,
    mediaType: "tv",
    title: item.title,
    posterPath: item.posterPath,
    season,
    episode,
    duration: item.duration,
    platform: item.preferredPlatform,
    deepLink,
    watched: false,
  };
}

function advanceEpisode(tracker: Tracker, item: PlaylistItem) {
  const seasons = item.seasons;
  if (!seasons || seasons.length === 0) {
    // Fallback: 20 Episoden pro Staffel
    tracker.currentEpisode++;
    if (tracker.currentEpisode > 20) {
      tracker.currentEpisode = 1;
      tracker.currentSeason++;
    }
    return;
  }

  const currentSeasonData = seasons.find(
    (s) => s.seasonNumber === tracker.currentSeason
  );
  const maxEpisode = currentSeasonData?.episodeCount ?? 20;

  tracker.currentEpisode++;
  if (tracker.currentEpisode > maxEpisode) {
    tracker.currentEpisode = 1;
    tracker.currentSeason++;
    // Wenn letzte Staffel überschritten → zurück zu Staffel 1
    const maxSeason = Math.max(...seasons.map((s) => s.seasonNumber));
    if (tracker.currentSeason > maxSeason) {
      tracker.currentSeason = 1;
    }
  }
}

function getTotalEpisodes(item: PlaylistItem): number {
  if (!item.seasons || item.seasons.length === 0) return 100;
  return item.seasons.reduce((sum, s) => sum + s.episodeCount, 0);
}

// ─── Nächste Position berechnen ──────────────────────────────────────────────────

export function getNextUnwatchedIndex(
  queue: QueueEntry[],
  currentIndex: number
): number {
  for (let i = currentIndex + 1; i < queue.length; i++) {
    if (!queue[i].watched) return i;
  }
  return -1; // Queue beendet
}

export function getProgress(queue: QueueEntry[]): {
  watched: number;
  total: number;
  percent: number;
} {
  const watched = queue.filter((e) => e.watched).length;
  const total = queue.length;
  return { watched, total, percent: total > 0 ? (watched / total) * 100 : 0 };
}
