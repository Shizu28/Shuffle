"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Shuffle, Trash2, Play, AlertCircle } from "lucide-react";
import { useShuffleStore } from "@/store/useShuffleStore";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";

export default function DashboardPage() {
  const router = useRouter();
  const { playlists, deletePlaylist, startSession } = useShuffleStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleShuffle = (playlistId: string) => {
    const session = startSession(playlistId);
    router.push(`/shuffle/${session.id}`);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deletePlaylist(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      // Auto-reset after 3s
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Meine Playlists</h1>
          <p className="text-white/50 mt-1">
            {playlists.length} {playlists.length === 1 ? "Playlist" : "Playlists"}
          </p>
        </div>
        <Link href="/playlist/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Neue Playlist
        </Link>
      </div>

      {/* Empty State */}
      {playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
            <Shuffle className="w-10 h-10 text-accent/50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Noch keine Playlists</h2>
          <p className="text-white/50 mb-6 max-w-sm">
            Erstelle deine erste Shuffle-Playlist und mische deine Lieblingsserien.
          </p>
          <Link href="/playlist/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Erste Playlist erstellen
          </Link>
        </div>
      )}

      {/* Grid */}
      {playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="relative">
              {/* Confirm Delete Overlay */}
              {confirmDelete === playlist.id && (
                <div className="absolute inset-0 z-10 bg-red-900/90 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 text-center backdrop-blur-sm">
                  <AlertCircle className="w-8 h-8 text-red-300" />
                  <p className="text-white font-semibold text-sm">
                    Wirklich löschen?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      Löschen
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="bg-white/20 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
              <PlaylistCard
                playlist={playlist}
                onDelete={handleDelete}
                onShuffle={handleShuffle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
