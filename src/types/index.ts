// ─── TMDB Typen ────────────────────────────────────────────────────────────────

export type MediaType = "movie" | "tv";
export type ShuffleMode = "pattern" | "random" | "sequential";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: "movie";
}

export interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeason[];
  media_type?: "tv";
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  air_date: string | null;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBShow)[];
  total_results: number;
  total_pages: number;
}

// ─── Plattform Typen ────────────────────────────────────────────────────────────

export interface PlatformConfig {
  id: string;
  name: string;
  color: string;
  logo: string; // emoji oder URL
  searchTemplate: string; // {title} wird ersetzt
  deepLinkTemplate?: string; // {id} wird ersetzt (plattformspezifisch)
  supportsEmbed?: boolean; // kann per iframe eingebettet werden
  isCustom?: boolean;
}

// ─── Playlist Typen ─────────────────────────────────────────────────────────────

export interface PlaylistItemSeason {
  seasonNumber: number;
  episodeCount: number;
}

export interface PlaylistItem {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  year: string;
  overview: string;
  voteAverage: number;
  // Plattform
  preferredPlatform: string;
  customUrl?: string; // vom User eingefügter Deep Link
  // Staffel/Episoden Tracking (nur TV)
  seasons?: PlaylistItemSeason[];
  startSeason: number;
  startEpisode: number;
  currentSeason: number;
  currentEpisode: number;
  // Shuffle Konfiguration
  episodesPerCycle: number; // wie viele Folgen pro "Runde"
  duration?: number; // Länge einer Episode in Minuten (für Timer)
  order: number;
}

export interface ShuffleConfig {
  mode: ShuffleMode;
  cycles: number; // wie viele Zyklen die Queue haben soll
  loop: boolean; // Queue wiederholen wenn am Ende
  randomizeOrder: boolean; // Item-Reihenfolge in jedem Zyklus zufällig
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  items: PlaylistItem[];
  shuffleConfig: ShuffleConfig;
  createdAt: string;
  updatedAt: string;
}

// ─── Shuffle Session Typen ──────────────────────────────────────────────────────

export interface QueueEntry {
  id: string;
  playlistItemId: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  duration?: number; // Länge in Minuten
  platform: string;
  deepLink: string;
  watched: boolean;
  watchedAt?: string;
}

export interface ShuffleSession {
  id: string;
  playlistId: string;
  playlistName: string;
  queue: QueueEntry[];
  currentIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── UI Hilfstypen ──────────────────────────────────────────────────────────────

export type SearchTab = "all" | "movie" | "tv";

export interface SearchFilters {
  tab: SearchTab;
  query: string;
}
