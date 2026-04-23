"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ExternalLink,
  CheckCircle2,
  SkipForward,
  SkipBack,
  RefreshCw,
  Tv,
  Film,
  Shuffle,
  MonitorPlay,
  Minimize2,
  Info,
  X,
  Clock,
  Timer,
} from "lucide-react";
import { ShuffleSession, QueueEntry } from "@/types";
import { tmdbPosterUrl } from "@/lib/tmdb";
import { getPlatformColor, getPlatformLogo, getPlatformName, getPlatformById } from "@/lib/platforms";
import { cn, formatEpisode as fmtEp, getEmbedUrl, isYouTubeChannelUrl, openCompanionWindow } from "@/lib/utils";
import { getProgress } from "@/lib/shuffle-engine";

interface ShufflePlayerProps {
  session: ShuffleSession;
  onMarkWatched: (entryId: string) => void;
  onGoToIndex: (index: number) => void;
  onRegenerate: () => void;
  onEnd: () => void;
}

export function ShufflePlayer({
  session,
  onMarkWatched,
  onGoToIndex,
  onRegenerate,
  onEnd,
}: ShufflePlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [embedExpanded, setEmbedExpanded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [durationElapsed, setDurationElapsed] = useState(0);
  const companionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stable ref so effects don't go stale
  const onMarkWatchedRef = useRef(onMarkWatched);
  onMarkWatchedRef.current = onMarkWatched;

  const current: QueueEntry | undefined = session.queue[session.currentIndex];
  const progress = getProgress(session.queue);
  const platformColor = current ? getPlatformColor(current.platform) : "#8b5cf6";
  const embedUrl = current ? getEmbedUrl(current.deepLink) : null;
  const isChannelUrl = current ? isYouTubeChannelUrl(current.deepLink) : false;
  const currentPlatform = current ? getPlatformById(current.platform) : undefined;
  const platformSupportsEmbed = currentPlatform?.supportsEmbed ?? false;
  const durationMinutes = current?.duration ?? null;
  const durationTotal = durationMinutes ? durationMinutes * 60 : null;

  // Reset everything when current item changes
  useEffect(() => {
    setCountdown(null);
    setDurationElapsed(0);
    setEmbedExpanded(false);
    if (companionPollRef.current) clearInterval(companionPollRef.current);
  }, [current?.id]);

  // Cleanup companion poll on unmount
  useEffect(() => {
    return () => {
      if (companionPollRef.current) clearInterval(companionPollRef.current);
    };
  }, []);

  // Countdown tick â†’ auto-advance at 0
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (current) onMarkWatchedRef.current(current.id);
      setCountdown(null);
      return;
    }
    const t = setTimeout(
      () => setCountdown((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(t);
  }, [countdown, current?.id]);

  // Episode duration timer â€“ starts counting when embed opens
  useEffect(() => {
    if (!embedExpanded || !durationTotal || countdown !== null) return;
    setDurationElapsed(0);
    const iv = setInterval(() => {
      setDurationElapsed((prev) => {
        const next = prev + 1;
        if (next >= durationTotal) {
          clearInterval(iv);
          setCountdown(5);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [current?.id, embedExpanded, durationTotal]);

  // YouTube iframe API: video ended â†’ trigger countdown
  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const ended =
          (d?.event === "onStateChange" && d?.info === 0) ||
          (d?.event === "infoDelivery" && d?.info?.playerState === 0);
        if (ended) setCountdown((c) => (c === null ? 5 : c));
      } catch {
        /* ignore non-JSON */
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  // Open companion popup, auto-trigger countdown when user closes it
  const handleOpenCompanion = useCallback((url: string) => {
    if (companionPollRef.current) clearInterval(companionPollRef.current);
    const win = openCompanionWindow(url);
    if (!win) return;
    companionPollRef.current = setInterval(() => {
      if (win.closed) {
        if (companionPollRef.current) clearInterval(companionPollRef.current);
        setCountdown((c) => (c === null ? 5 : c));
      }
    }, 500);
  }, []);

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center animate-pulse-glow">
          <Shuffle className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Queue abgeschlossen!</h2>
          <p className="text-white/50 mt-2">Du hast alles in dieser Queue geschaut.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onRegenerate} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Neue Queue generieren
          </button>
          <button onClick={onEnd} className="btn-secondary">
            Beenden
          </button>
        </div>
      </div>
    );
  }

  const prevIndex = session.currentIndex > 0 ? session.currentIndex - 1 : -1;
  const nextIndex =
    session.queue.findIndex((e, i) => i > session.currentIndex && !e.watched);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
          <span>Queue Fortschritt</span>
          <span>
            {progress.watched}/{progress.total} gesehen
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Auto-advance Countdown Banner */}
      {countdown !== null && (
        <div className="card border-accent/40 bg-accent/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex-shrink-0">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="#8b5cf6" strokeWidth="3"
                  strokeDasharray={`${(countdown / 5) * 94.2} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-accent font-bold text-sm">
                {countdown}
              </span>
            </div>
            <p className="text-white/70 text-sm">
              Nächste Folge startet in <strong className="text-accent">{countdown}s</strong> automatisch.
            </p>
          </div>
          <button
            onClick={() => setCountdown(null)}
            className="btn-ghost p-1.5 text-white/40 hover:text-white flex-shrink-0"
            title="Abbrechen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Now Playing Card */}
      <div
        className="relative rounded-2xl overflow-hidden border"
        style={{
          borderColor: platformColor + "40",
          background: `linear-gradient(135deg, ${platformColor}15 0%, #1a1a2e 100%)`,
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 opacity-10">
          <Image
            src={tmdbPosterUrl(current.posterPath, "w500")}
            alt=""
            fill
            className="object-cover blur-xl scale-110"
            sizes="100vw"
          />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="relative w-32 md:w-40 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 shadow-2xl mx-auto md:mx-0">
            <Image
              src={tmdbPosterUrl(current.posterPath, "w342")}
              alt={current.title}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-xs font-semibold uppercase tracking-wider">
                  Jetzt gucken
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {current.title}
              </h1>

              {current.mediaType === "tv" && current.season && current.episode && (
                <div className="flex items-center gap-2 mt-2">
                  <Tv className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 font-mono">
                    {fmtEp(current.season, current.episode)}
                  </span>
                  {current.episodeTitle && (
                    <span className="text-white/50 text-sm">â€“ {current.episodeTitle}</span>
                  )}
                </div>
              )}

              {current.mediaType === "movie" && (
                <div className="flex items-center gap-2 mt-2">
                  <Film className="w-4 h-4 text-white/50" />
                  <span className="text-white/50 text-sm">Film</span>
                </div>
              )}

              {durationMinutes && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/40 text-xs">{durationMinutes} Min.</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span
                  className="badge"
                  style={{
                    backgroundColor: platformColor + "25",
                    color: platformColor,
                  }}
                >
                  {getPlatformLogo(current.platform)}{" "}
                  {getPlatformName(current.platform)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {embedUrl ? (
                <button
                  onClick={() => setEmbedExpanded((v) => !v)}
                  className="btn-primary flex-1 md:flex-none justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)`,
                  }}
                >
                  {embedExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <MonitorPlay className="w-4 h-4" />
                  )}
                  {embedExpanded ? "Player ausblenden" : "Direkt hier abspielen"}
                </button>
              ) : platformSupportsEmbed ? (
                <div className="flex items-center gap-2 text-white/40 text-xs bg-white/5 rounded-xl px-3 py-2 flex-1 md:flex-none">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  Füge in der Playlist einen direkten Link ein um hier abzuspielen
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCompanion(current.deepLink)}
                  className="btn-primary flex-1 md:flex-none justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)`,
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Im Fenster öffnen
                </button>
              )}

              <button
                onClick={() => onMarkWatched(current.id)}
                className="btn-secondary flex-1 md:flex-none justify-center"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Als gesehen markieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Embed Player */}
      {embedUrl && embedExpanded && (
        <div className="space-y-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video w-full">
            <iframe
              src={embedUrl}
              title={current.title}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            />
          </div>

          {/* Episode duration progress */}
          {durationTotal && durationElapsed > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Folgen-Timer
                </span>
                <span>
                  {Math.floor(durationElapsed / 60)}:
                  {String(durationElapsed % 60).padStart(2, "0")} /{" "}
                  {durationMinutes}:00 Min.
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent/60 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (durationElapsed / durationTotal) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Companion-Modus Hinweis */}
      {!embedUrl && !platformSupportsEmbed && (
        <div className="card p-3 flex items-start gap-3 border-white/5">
          <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
          <p className="text-white/40 text-xs leading-relaxed">
            <strong className="text-white/60">{getPlatformName(current.platform)}</strong> nutzt
            DRM-Kopierschutz – aus Browser-Sicherheitsgründen nicht einbettbar. Das
            Companion-Fenster öffnet die Plattform neben Shuffle. Wenn du es{" "}
            <strong className="text-white/60">schließt</strong>, startet automatisch der
            Weiter-Countdown.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => prevIndex >= 0 && onGoToIndex(prevIndex)}
          disabled={prevIndex < 0}
          className="btn-ghost disabled:opacity-30"
        >
          <SkipBack className="w-4 h-4" />
          Zurück
        </button>

        <button
          onClick={() => setShowQueue(!showQueue)}
          className="btn-ghost text-accent"
        >
          <Shuffle className="w-4 h-4" />
          Queue ({session.queue.length - progress.watched} übrig)
        </button>

        <button
          onClick={() => nextIndex >= 0 && onGoToIndex(nextIndex)}
          disabled={nextIndex < 0}
          className="btn-ghost disabled:opacity-30"
        >
          Weiter
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Queue List */}
      {showQueue && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">
              Shuffle Queue ({session.queue.length} Einträge)
            </h3>
            <button onClick={onRegenerate} className="btn-ghost text-xs text-white/50">
              <RefreshCw className="w-3.5 h-3.5" />
              Neu generieren
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {session.queue.map((entry, idx) => (
              <button
                key={entry.id}
                onClick={() => !entry.watched && onGoToIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                  idx === session.currentIndex && "bg-accent/10 border-l-2 border-accent",
                  entry.watched && "opacity-40"
                )}
              >
                <span className="text-white/30 text-xs w-6 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="relative w-8 h-11 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={tmdbPosterUrl(entry.posterPath, "w185")}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{entry.title}</p>
                  {entry.mediaType === "tv" && entry.season && entry.episode && (
                    <p className="text-xs text-white/40 font-mono">
                      {fmtEp(entry.season, entry.episode)}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: getPlatformColor(entry.platform) }}
                >
                  {getPlatformLogo(entry.platform)}
                </span>
                {entry.watched && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
                {idx === session.currentIndex && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
