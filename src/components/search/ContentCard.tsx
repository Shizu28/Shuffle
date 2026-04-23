"use client";

import Image from "next/image";
import { Plus, Star, Tv, Film } from "lucide-react";
import { TMDBMovie, TMDBShow, MediaType } from "@/types";
import { tmdbPosterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export type SearchResult = (TMDBMovie | TMDBShow) & { media_type?: MediaType };

interface ContentCardProps {
  result: SearchResult;
  onAdd?: (result: SearchResult, mediaType: MediaType) => void;
  isAdded?: boolean;
  compact?: boolean;
}

function isMovie(result: SearchResult): result is TMDBMovie {
  return "title" in result;
}

export function ContentCard({
  result,
  onAdd,
  isAdded,
  compact = false,
}: ContentCardProps) {
  const movie = isMovie(result);
  const title = movie ? result.title : (result as TMDBShow).name;
  const year = movie
    ? result.release_date?.slice(0, 4)
    : (result as TMDBShow).first_air_date?.slice(0, 4);
  const mediaType: MediaType = result.media_type ?? (movie ? "movie" : "tv");
  const posterUrl = tmdbPosterUrl(result.poster_path, "w342");

  return (
    <div
      className={cn(
        "card group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-accent/30",
        compact ? "flex gap-3 p-3" : "flex flex-col"
      )}
    >
      {/* Poster */}
      <div
        className={cn(
          "relative overflow-hidden bg-bg-elevated flex-shrink-0",
          compact ? "w-16 h-24 rounded-xl" : "w-full aspect-[2/3] rounded-t-2xl"
        )}
      >
        <Image
          src={posterUrl}
          alt={title}
          fill
          className="object-cover"
          sizes={compact ? "64px" : "200px"}
          unoptimized={posterUrl.includes("placeholder")}
        />
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "badge text-white",
              mediaType === "tv" ? "bg-cyan-accent/80" : "bg-accent/80"
            )}
          >
            {mediaType === "tv" ? (
              <Tv className="w-3 h-3" />
            ) : (
              <Film className="w-3 h-3" />
            )}
            {mediaType === "tv" ? "Serie" : "Film"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={cn("flex flex-col", compact ? "flex-1 min-w-0 justify-center" : "p-3 gap-1")}>
        <h3
          className={cn(
            "font-semibold text-white leading-tight",
            compact ? "text-sm" : "text-base"
          )}
        >
          {title}
        </h3>
        <div className="flex items-center gap-2 text-white/50 text-xs mt-0.5">
          {year && <span>{year}</span>}
          {result.vote_average > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {result.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        {!compact && result.overview && (
          <p className="text-white/50 text-xs line-clamp-3 mt-1">
            {result.overview}
          </p>
        )}

        {/* Add Button */}
        {onAdd && (
          <button
            onClick={() => onAdd(result, mediaType)}
            disabled={isAdded}
            className={cn(
              "transition-all duration-200 font-medium text-sm inline-flex items-center gap-1.5",
              compact ? "mt-2" : "mt-3",
              isAdded
                ? "text-green-400 cursor-default"
                : "btn-primary text-xs px-3 py-1.5"
            )}
          >
            {isAdded ? (
              "✓ Hinzugefügt"
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Zur Playlist
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
