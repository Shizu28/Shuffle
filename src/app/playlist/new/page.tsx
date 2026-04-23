"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shuffle } from "lucide-react";
import Link from "next/link";
import { useShuffleStore } from "@/store/useShuffleStore";

export default function NewPlaylistPage() {
  const router = useRouter();
  const { createPlaylist } = useShuffleStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    const playlist = createPlaylist(name.trim(), description.trim() || undefined);
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/dashboard" className="btn-ghost mb-6 -ml-2 text-white/50">
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-sm">
          <Shuffle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Neue Playlist</h1>
          <p className="text-white/50 text-sm">Erstelle deinen Shuffle-Mix</p>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="z.B. Abend-Mix oder Anime-Marathon"
            className="input text-base"
            maxLength={60}
            autoFocus
          />
          <p className="text-white/30 text-xs mt-1 text-right">
            {name.length}/60
          </p>
        </div>

        <div>
          <label className="label">Beschreibung (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was ist das für eine Playlist?"
            className="input resize-none h-24 text-sm"
            maxLength={200}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="btn-primary flex-1 justify-center py-3"
          >
            <Shuffle className="w-4 h-4" />
            Playlist erstellen
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Abbrechen
          </Link>
        </div>
      </div>
    </div>
  );
}
