const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbPosterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342"
): string {
  if (!path) return "/placeholder-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdropUrl(
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280"
): string {
  if (!path) return "/placeholder-backdrop.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY ist nicht gesetzt");

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "de-DE");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB API Fehler: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Such-Endpoints ─────────────────────────────────────────────────────────────

export async function searchMulti(query: string, page = 1) {
  return tmdbFetch("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch("/search/movie", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export async function searchTV(query: string, page = 1) {
  return tmdbFetch("/search/tv", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

// ─── Detail-Endpoints ───────────────────────────────────────────────────────────

export async function getMovieDetails(id: number) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: "external_ids",
  });
}

export async function getTVDetails(id: number) {
  return tmdbFetch(`/tv/${id}`, {
    append_to_response: "external_ids,seasons",
  });
}

export async function getTVSeasonDetails(showId: number, seasonNumber: number) {
  return tmdbFetch(`/tv/${showId}/season/${seasonNumber}`);
}

// ─── Watch Provider Endpoint ────────────────────────────────────────────────────

export async function getWatchProviders(id: number, type: "movie" | "tv") {
  return tmdbFetch(`/${type}/${id}/watch/providers`);
}
