"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ContentCard, SearchResult } from "@/components/search/ContentCard";
import {
  MediaType,
  SearchTab,
  TMDBSearchResult,
  TMDBShow,
  PlaylistItem,
} from "@/types";
import { Loader2, SearchX, X, Plus, FolderPlus } from "lucide-react";
import { useShuffleStore } from "@/store/useShuffleStore";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const router = useRouter();
  const { playlists, addItemToPlaylist, getAllPlatforms } = useShuffleStore();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Modal state
  const [pendingAdd, setPendingAdd] = useState<{
    result: SearchResult;
    mediaType: MediaType;
  } | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);

  const handleSearch = useCallback(async (query: string, tab: SearchTab) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(query)}&type=${tab}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Suche fehlgeschlagen");
      }
      const data: TMDBSearchResult = await res.json();
      const filtered = data.results.filter(
        (r) =>
          r.media_type === "movie" ||
          r.media_type === "tv" ||
          "title" in r ||
          "name" in r
      ) as SearchResult[];
      setResults(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAdd = (result: SearchResult, mediaType: MediaType) => {
    if (playlists.length === 0) {
      router.push("/playlist/new");
      return;
    }
    setPendingAdd({ result, mediaType });
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!pendingAdd) return;
    setAddingToPlaylist(true);

    const { result, mediaType } = pendingAdd;
    const isTV = mediaType === "tv";
    const title = isTV
      ? (result as TMDBShow).name
      : (result as { title: string }).title;
    const year = isTV
      ? (result as TMDBShow).first_air_date?.slice(0, 4) ?? ""
      : (result as { release_date: string }).release_date?.slice(0, 4) ?? "";

    let seasons: PlaylistItem["seasons"] = undefined;
    if (isTV) {
      try {
        const res = await fetch(`/api/tmdb/${result.id}?type=tv`);
        const details = await res.json();
        seasons = (details.seasons ?? [])
          .filter((s: { season_number: number }) => s.season_number > 0)
          .map(
            (s: { season_number: number; episode_count: number }) => ({
              seasonNumber: s.season_number,
              episodeCount: s.episode_count,
            })
          );
      } catch {
        // Ohne Season-Daten weitermachen
      }
    }

    const platforms = getAllPlatforms();
    addItemToPlaylist(playlistId, {
      tmdbId: result.id,
      mediaType,
      title,
      posterPath: result.poster_path,
      backdropPath: result.backdrop_path,
      year,
      overview: result.overview,
      voteAverage: result.vote_average,
      preferredPlatform: platforms[0]?.id ?? "netflix",
      seasons,
      startSeason: 1,
      startEpisode: 1,
      currentSeason: 1,
      currentEpisode: 1,
      episodesPerCycle: 1,
    });

    setAddedIds((prev) => new Set([...prev, result.id]));
    setPendingAdd(null);
    setAddingToPlaylist(false);
  };

  const pendingTitle = pendingAdd
    ? "name" in pendingAdd.result
      ? (pendingAdd.result as TMDBShow).name
      : (pendingAdd.result as { title: string }).title
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Suchen</h1>
        <p className="text-white/50">
          Finde Serien und Filme für deine Shuffle-Playlists
        </p>
      </div>

      <div className="max-w-2xl mb-8">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/30 bg-red-900/20 p-4 mb-6 text-red-300 text-sm flex items-center gap-2">
          <SearchX className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 text-white/50 py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          Suche läuft...
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((result) => (
            <ContentCard
              key={`${result.id}-${result.media_type}`}
              result={result}
              onAdd={handleAdd}
              isAdded={addedIds.has(result.id)}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && hasSearched && results.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50">Keine Ergebnisse gefunden</p>
          <p className="text-white/30 text-sm mt-1">Versuche einen anderen Suchbegriff</p>
        </div>
      )}

      {/* Hint */}
      {!hasSearched && (
        <div className="text-center py-16 text-white/30 text-sm">
          Gib mindestens 2 Zeichen ein um zu suchen
        </div>
      )}

      {/* Playlist Selection Modal */}
      <AnimatePresence>
        {pendingAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !addingToPlaylist && setPendingAdd(null)}
          >
            <motion.div
              className="card w-full max-w-md p-6 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg">
                    Zur Playlist hinzufügen
                  </h3>
                  <p className="text-white/50 text-sm mt-0.5 truncate">
                    {pendingTitle}
                  </p>
                </div>
                <button
                  onClick={() => setPendingAdd(null)}
                  disabled={addingToPlaylist}
                  className="btn-ghost p-1.5 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Playlist List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addingToPlaylist}
                    className="w-full text-left card p-3 hover:border-accent/40 transition-all duration-200 flex items-center justify-between group disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {playlist.name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {playlist.items.length} Titel
                      </p>
                    </div>
                    {addingToPlaylist ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0 ml-2" />
                    ) : (
                      <Plus className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create New Playlist */}
              <div className="border-t border-white/5 pt-3">
                <button
                  onClick={() => {
                    setPendingAdd(null);
                    router.push("/playlist/new");
                  }}
                  disabled={addingToPlaylist}
                  className="btn-secondary w-full justify-center text-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                  Neue Playlist erstellen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
