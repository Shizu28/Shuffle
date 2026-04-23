"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Edit2, Trash2, Shuffle } from "lucide-react";
import { Playlist } from "@/types";
import { tmdbPosterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { getPlatformColor } from "@/lib/platforms";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (id: string) => void;
  onShuffle?: (id: string) => void;
}

export function PlaylistCard({ playlist, onDelete, onShuffle }: PlaylistCardProps) {
  const previewItems = playlist.items.slice(0, 4);
  const itemCount = playlist.items.length;

  return (
    <div className="card group relative overflow-hidden transition-all duration-300 hover:border-accent/30 hover:scale-[1.01]">
      {/* Cover / Poster Grid */}
      <div className="relative aspect-video bg-bg-elevated overflow-hidden rounded-t-2xl">
        {previewItems.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Shuffle className="w-12 h-12 text-white/10" />
          </div>
        ) : previewItems.length === 1 ? (
          <Image
            src={tmdbPosterUrl(previewItems[0].posterPath, "w342")}
            alt={previewItems[0].title}
            fill
            className="object-cover"
            sizes="400px"
          />
        ) : (
          <div className="grid grid-cols-2 w-full h-full">
            {previewItems.slice(0, 4).map((item, i) => (
              <div key={i} className="relative overflow-hidden">
                <Image
                  src={tmdbPosterUrl(item.posterPath, "w185")}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
            ))}
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-transparent to-transparent opacity-80" />

        {/* Platform Dots */}
        <div className="absolute top-3 right-3 flex gap-1">
          {[...new Set(playlist.items.map((i) => i.preferredPlatform))]
            .slice(0, 4)
            .map((p) => (
              <div
                key={p}
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: getPlatformColor(p) }}
                title={p}
              />
            ))}
        </div>

        {/* Play Button Overlay */}
        {onShuffle && (
          <button
            onClick={() => onShuffle(playlist.id)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-full bg-accent glow flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-300">
              <Shuffle className="w-6 h-6 text-white" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-white text-base leading-tight truncate">
          {playlist.name}
        </h3>
        {playlist.description && (
          <p className="text-white/50 text-xs mt-1 line-clamp-1">
            {playlist.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-white/40 text-xs">
            {itemCount} {itemCount === 1 ? "Titel" : "Titel"} ·{" "}
            <span className="capitalize">{playlist.shuffleConfig.mode}</span>
          </span>

          <div className="flex items-center gap-1">
            <Link
              href={`/playlist/${playlist.id}`}
              className="btn-ghost p-2 text-white/50"
              title="Bearbeiten"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(playlist.id)}
                className="btn-ghost p-2 text-white/50 hover:text-red-400"
                title="Löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onShuffle && (
              <button
                onClick={() => onShuffle(playlist.id)}
                className={cn(
                  "btn-primary text-xs px-3 py-1.5",
                  itemCount === 0 && "opacity-50 cursor-not-allowed"
                )}
                disabled={itemCount === 0}
              >
                <Shuffle className="w-3 h-3" />
                Shuffle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
