"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Shuffle,
  Plus,
  Search,
  Loader2,
  SearchX,
  X,
  Edit2,
  Check,
} from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { useShuffleStore } from "@/store/useShuffleStore";
import { PlaylistItemRow } from "@/components/playlist/PlaylistItemRow";
import { ShuffleConfigPanel } from "@/components/playlist/ShuffleConfigPanel";
import { ContentCard, SearchResult } from "@/components/search/ContentCard";
import { MediaType, PlaylistItem, PlatformConfig, TMDBSearchResult, TMDBShow } from "@/types";
import { tmdbPosterUrl } from "@/lib/tmdb";

// ─── Draggable wrapper for each playlist row ─────────────────────────────────

function DraggablePlaylistItem({
  item,
  onUpdate,
  onDelete,
  platforms,
}: {
  item: PlaylistItem;
  onUpdate: (updates: Partial<PlaylistItem>) => void;
  onDelete: () => void;
  platforms: PlatformConfig[];
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      className="list-none"
    >
      <PlaylistItemRow
        item={item}
        onUpdate={onUpdate}
        onDelete={onDelete}
        platforms={platforms}
        dragHandleProps={{ onPointerDown: (e) => controls.start(e) }}
      />
    </Reorder.Item>
  );
}

export default function PlaylistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const {
    playlists,
    updatePlaylist,
    updateShuffleConfig,
    addItemToPlaylist,
    updatePlaylistItem,
    removeItemFromPlaylist,
    reorderItems,
    startSession,
    getAllPlatforms,
  } = useShuffleStore();

  const playlist = playlists.find((p) => p.id === params.id);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(playlist?.name ?? "");

  const platforms = getAllPlatforms();

  // Debounced search
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(q)}&type=all`
      );
      const data: TMDBSearchResult = await res.json();
      setSearchResults(
        data.results.filter(
          (r) => r.media_type === "movie" || r.media_type === "tv" || "title" in r || "name" in r
        ) as SearchResult[]
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddContent = async (result: SearchResult, mediaType: MediaType) => {
    const isTV = mediaType === "tv";
    const title = isTV ? (result as TMDBShow).name : (result as { title: string }).title;
    const year = isTV
      ? (result as TMDBShow).first_air_date?.slice(0, 4) ?? ""
      : (result as { release_date: string }).release_date?.slice(0, 4) ?? "";

    // Fetch season details for TV shows
    let seasons: PlaylistItem["seasons"] = undefined;
    if (isTV) {
      try {
        const res = await fetch(`/api/tmdb/${result.id}?type=tv`);
        const details = await res.json();
        seasons = (details.seasons ?? [])
          .filter((s: { season_number: number; episode_count: number }) => s.season_number > 0)
          .map((s: { season_number: number; episode_count: number }) => ({
            seasonNumber: s.season_number,
            episodeCount: s.episode_count,
          }));
      } catch {
        // Ignore, continue without season data
      }
    }

    addItemToPlaylist(params.id, {
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
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleStartShuffle = () => {
    if (!playlist || playlist.items.length === 0) return;
    const session = startSession(params.id);
    router.push(`/shuffle/${session.id}`);
  };

  const handleSaveName = () => {
    if (nameValue.trim()) {
      updatePlaylist(params.id, { name: nameValue.trim() });
    }
    setEditingName(false);
  };

  if (!playlist) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-white/50 mb-4">Playlist nicht gefunden</p>
        <Link href="/dashboard" className="btn-primary">
          Zur Übersicht
        </Link>
      </div>
    );
  }

  const addedIds = new Set(playlist.items.map((i) => i.tmdbId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="btn-ghost -ml-2 text-white/50">
          <ArrowLeft className="w-4 h-4" />
          Übersicht
        </Link>
        <button
          onClick={handleStartShuffle}
          disabled={playlist.items.length === 0}
          className="btn-primary disabled:opacity-40"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle starten
        </button>
      </div>

      {/* Playlist Header */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Shuffle className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="input text-lg font-bold py-1.5 flex-1"
                  autoFocus
                />
                <button onClick={handleSaveName} className="btn-ghost p-2">
                  <Check className="w-4 h-4 text-green-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-xl font-bold text-white truncate">
                  {playlist.name}
                </h1>
                <button
                  onClick={() => {
                    setNameValue(playlist.name);
                    setEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            )}
            <p className="text-white/40 text-sm mt-0.5">
              {playlist.items.length}{" "}
              {playlist.items.length === 1 ? "Titel" : "Titel"}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-base">Inhalte</h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" />
            Hinzufügen
          </button>
        </div>

        {/* Search Panel */}
        {showSearch && (
          <div className="card p-4 mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Serie oder Film suchen..."
                className="input pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="grid gap-2 max-h-80 overflow-y-auto">
                {searchResults.slice(0, 12).map((result) => (
                  <ContentCard
                    key={`${result.id}-${result.media_type}`}
                    result={result}
                    onAdd={handleAddContent}
                    isAdded={addedIds.has(result.id)}
                    compact
                  />
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="flex items-center gap-2 text-white/40 text-sm py-2">
                <SearchX className="w-4 h-4" />
                Keine Ergebnisse
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        {playlist.items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-white/40 text-sm mb-3">
              Noch keine Inhalte in dieser Playlist
            </p>
            <button onClick={() => setShowSearch(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Erste Serie / Film hinzufügen
            </button>
          </div>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={[...playlist.items].sort((a, b) => a.order - b.order)}
            onReorder={(newOrder) => reorderItems(params.id, newOrder)}
            className="space-y-2"
          >
            {[...playlist.items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <DraggablePlaylistItem
                  key={item.id}
                  item={item}
                  onUpdate={(updates) =>
                    updatePlaylistItem(params.id, item.id, updates)
                  }
                  onDelete={() => removeItemFromPlaylist(params.id, item.id)}
                  platforms={platforms}
                />
              ))}
          </Reorder.Group>
        )}
      </div>

      {/* Shuffle Config */}
      <ShuffleConfigPanel
        config={playlist.shuffleConfig}
        onChange={(updates) => updateShuffleConfig(params.id, updates)}
      />

      {/* Start Button */}
      {playlist.items.length > 0 && (
        <button
          onClick={handleStartShuffle}
          className="btn-primary w-full justify-center py-4 text-base"
        >
          <Shuffle className="w-5 h-5" />
          Shuffle starten
        </button>
      )}
    </div>
  );
}
