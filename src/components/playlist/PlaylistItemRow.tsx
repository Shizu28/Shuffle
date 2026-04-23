"use client";

import { useState } from "react";
import Image from "next/image";
import { GripVertical, Trash2, ChevronDown, ChevronUp, ExternalLink, Tv, Film, MonitorPlay, Info } from "lucide-react";
import { PlaylistItem, PlatformConfig } from "@/types";
import { tmdbPosterUrl } from "@/lib/tmdb";
import { getPlatformColor, getPlatformLogo, getPlatformName } from "@/lib/platforms";
import { formatEpisode, cn, getEmbedUrl } from "@/lib/utils";

interface PlaylistItemRowProps {
  item: PlaylistItem;
  onUpdate: (updates: Partial<PlaylistItem>) => void;
  onDelete: () => void;
  platforms: PlatformConfig[];
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function PlaylistItemRow({ item, onUpdate, onDelete, platforms, dragHandleProps }: PlaylistItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  const maxSeason = item.seasons?.length
    ? Math.max(...item.seasons.map((s) => s.seasonNumber))
    : 99;
  const currentSeasonData = item.seasons?.find(
    (s) => s.seasonNumber === item.currentSeason
  );
  const maxEpisode = currentSeasonData?.episodeCount ?? 99;

  const embedUrl = getEmbedUrl(item.customUrl);
  const selectedPlatform = platforms.find((p) => p.id === item.preferredPlatform);

  return (
    <div className="card overflow-hidden">
      {/* Header Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="p-0.5 text-white/20 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Poster */}
        <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={tmdbPosterUrl(item.posterPath, "w185")}
            alt={item.title}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {item.mediaType === "tv" ? (
                <Tv className="w-3 h-3 inline" />
              ) : (
                <Film className="w-3 h-3 inline" />
              )}
            </span>
            <h4 className="font-semibold text-sm text-white truncate">{item.title}</h4>
            <span className="text-white/30 text-xs flex-shrink-0">{item.year}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            {/* Platform Badge */}
            <span
              className="badge"
              style={{
                backgroundColor: getPlatformColor(item.preferredPlatform) + "33",
                color: getPlatformColor(item.preferredPlatform),
              }}
            >
              {getPlatformLogo(item.preferredPlatform)} {getPlatformName(item.preferredPlatform)}
            </span>

            {item.mediaType === "tv" && (
              <>
                <span>Start: {formatEpisode(item.currentSeason, item.currentEpisode)}</span>
                <span className="text-accent font-semibold">
                  {item.episodesPerCycle}× pro Runde
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-ghost p-1.5 text-white/40"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="btn-ghost p-1.5 text-white/40 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4 bg-bg-secondary/50">
          {/* Platform Auswahl */}
          <div>
            <label className="label">Plattform</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onUpdate({ preferredPlatform: p.id })}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5",
                    item.preferredPlatform === p.id
                      ? "border border-current"
                      : "bg-bg-elevated text-white/50 hover:text-white"
                  )}
                  style={
                    item.preferredPlatform === p.id
                      ? {
                          backgroundColor: p.color + "22",
                          color: p.color,
                          borderColor: p.color + "44",
                        }
                      : undefined
                  }
                >
                  {p.logo} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL */}
          <div>
            <label className="label flex items-center gap-1">
              Direkter Link
              {embedUrl ? (
                <span className="ml-auto flex items-center gap-1 text-green-400 font-medium">
                  <MonitorPlay className="w-3 h-3" />
                  Embed aktiv
                </span>
              ) : selectedPlatform?.supportsEmbed ? (
                <span className="ml-auto flex items-center gap-1 text-white/40">
                  <Info className="w-3 h-3" />
                  Embed möglich
                </span>
              ) : (
                <ExternalLink className="w-3 h-3" />
              )}
            </label>
            <input
              type="url"
              value={item.customUrl ?? ""}
              onChange={(e) => onUpdate({ customUrl: e.target.value })}
              placeholder={
                selectedPlatform?.supportsEmbed
                  ? `z.B. https://www.youtube.com/watch?v=... oder Playlist-URL`
                  : `z.B. https://www.netflix.com/title/12345`
              }
              className={cn(
                "input text-sm",
                embedUrl && "border-green-400/30 focus:border-green-400/60"
              )}
            />
            <p className="text-white/30 text-xs mt-1">
              {selectedPlatform?.id === "youtube"
                ? "Einzelvideo-URL oder Playlist-URL (youtube.com/playlist?list=...)"
                : selectedPlatform?.supportsEmbed
                ? "ARD-URL → wird direkt im Player eingebettet."
                : "Plattform-Link → öffnet in einem Companion-Fenster neben Shuffle."}
            </p>
          </div>

          {/* Episode Duration (für Timer-basiertes Autoplay) */}
          {(embedUrl || selectedPlatform?.supportsEmbed) && (
            <div>
              <label className="label flex items-center gap-2">
                Folgenlänge
                <span className="text-white/30 font-normal text-xs">(optional, für Auto-Weiter)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={item.duration ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      duration: e.target.value
                        ? Math.max(1, Number(e.target.value))
                        : undefined,
                    })
                  }
                  placeholder="z.B. 24"
                  className="input text-sm w-28"
                />
                <span className="text-white/40 text-sm">Minuten</span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                Wenn gesetzt, wechselt Shuffle nach dieser Zeit automatisch zur nächsten Folge.
                Bei YouTube wird auch das Video-Ende erkannt.
              </p>
            </div>
          )}

          {/* TV-spezifisch */}
          {item.mediaType === "tv" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Folgen pro Runde</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={item.episodesPerCycle}
                  onChange={(e) =>
                    onUpdate({ episodesPerCycle: Math.max(1, Number(e.target.value)) })
                  }
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Aktuelle Position</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={maxSeason}
                    value={item.currentSeason}
                    onChange={(e) =>
                      onUpdate({
                        currentSeason: Math.min(
                          maxSeason,
                          Math.max(1, Number(e.target.value))
                        ),
                      })
                    }
                    className="input text-sm"
                    placeholder="S"
                    title="Staffel"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxEpisode}
                    value={item.currentEpisode}
                    onChange={(e) =>
                      onUpdate({
                        currentEpisode: Math.min(
                          maxEpisode,
                          Math.max(1, Number(e.target.value))
                        ),
                      })
                    }
                    className="input text-sm"
                    placeholder="E"
                    title="Episode"
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">
                  Staffel / Episode
                  {currentSeasonData && (
                    <span className="ml-1 text-white/20">
                      (S{item.currentSeason}: {currentSeasonData.episodeCount} Folgen)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
