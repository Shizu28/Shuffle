"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  PlusCircle,
  Trash2,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useShuffleStore } from "@/store/useShuffleStore";
import { ImportedLibrary, ImportedLibraryItem, Playlist } from "@/types";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  netflix:     { name: "Netflix",     icon: "🎬", color: "#e50914" },
  disney:      { name: "Disney+",     icon: "✨", color: "#113ccf" },
  prime:       { name: "Prime Video", icon: "📦", color: "#00a8e0" },
  crunchyroll: { name: "Crunchyroll", icon: "🍥", color: "#f47521" },
};

const PLATFORM_ID_MAP: Record<string, string> = {
  netflix:     "netflix",
  disney:      "disney",
  prime:       "prime",
  crunchyroll: "crunchyroll",
};

export default function ImportPage() {
  const router = useRouter();
  const { playlists, createPlaylist, addItemToPlaylist } = useShuffleStore();

  const [extensionReady, setExtensionReady] = useState<boolean | null>(null);
  const [library, setLibrary] = useState<ImportedLibrary>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(Object.keys(PLATFORM_CONFIG)));
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);

  // ── Extension detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (extensionReady === null) setExtensionReady(false);
    }, 1500);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === "SHUFFLE_EXTENSION_READY") {
        clearTimeout(timeout);
        setExtensionReady(true);
      }
      if (e.data?.type === "SHUFFLE_LIBRARY_RESPONSE") {
        setLibrary(e.data.library || {});
        setLoading(false);
      }
      if (e.data?.type === "SHUFFLE_LIBRARY_CLEARED") {
        setLibrary({});
        setSelected(new Set());
      }
    };
    window.addEventListener("message", handler);
    // Ping the bridge in case it already ran before React mounted
    window.postMessage({ type: "SHUFFLE_PING" }, "*");
    return () => { window.removeEventListener("message", handler); clearTimeout(timeout); };
  }, []);

  // ── Load library from extension ─────────────────────────────────────────────
  const loadLibrary = useCallback(() => {
    setLoading(true);
    window.postMessage({ type: "SHUFFLE_GET_LIBRARY" }, "*");
    // Fallback timeout
    setTimeout(() => setLoading(false), 3000);
  }, []);

  useEffect(() => {
    if (extensionReady) loadLibrary();
  }, [extensionReady, loadLibrary]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allItems: ImportedLibraryItem[] = Object.values(library).flatMap((p) => p.items);
  const totalCount = allItems.length;

  const toggleItem = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const togglePlatform = (platform: string) => {
    const platformItems = library[platform]?.items || [];
    const ids = platformItems.map((i) => i.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allItems.map((i) => i.id)));
  const clearSelection = () => setSelected(new Set());

  const toggleExpanded = (platform: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(platform) ? next.delete(platform) : next.add(platform);
      return next;
    });

  // ── Add to playlist ──────────────────────────────────────────────────────────
  const addToPlaylist = async (playlistId: string) => {
    setAddingTo(playlistId);
    const itemsToAdd = allItems.filter((i) => selected.has(i.id));
    let count = 0;
    for (const item of itemsToAdd) {
      addItemToPlaylist(playlistId, {
        tmdbId: 0, // no TMDB data for imported items
        mediaType: item.type === "movie" ? "movie" : "tv",
        title: item.title,
        posterPath: item.thumbnailUrl || null,
        backdropPath: null,
        year: item.year || "",
        overview: "",
        voteAverage: 0,
        preferredPlatform: PLATFORM_ID_MAP[item.platform] || item.platform,
        customUrl: item.deepLink,
        startSeason: 1,
        startEpisode: 1,
        currentSeason: 1,
        currentEpisode: 1,
        episodesPerCycle: 1,
      });
      count++;
    }
    setDoneCount(count);
    setShowPlaylistModal(false);
    setAddingTo(null);
    setTimeout(() => setDoneCount(0), 3000);
  };

  const handleNewPlaylist = () => {
    const name = `Import ${new Date().toLocaleDateString("de-DE")}`;
    const pl = createPlaylist(name);
    addToPlaylist(pl.id).then(() => router.push(`/playlist/${pl.id}`));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bibliothek importieren</h1>
        <p className="text-white/50 text-sm mt-1">
          Übernimm deine Merklisten von Streaming-Plattformen direkt in Shuffle.
        </p>
      </div>

      {/* Extension status */}
      {extensionReady === false && (
        <div className="card p-4 border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Erweiterung nicht gefunden</p>
            <p className="text-white/50 text-xs mt-1">
              Installiere die <strong className="text-white/70">Shuffle Bibliothek Importer</strong> Browser-Erweiterung
              aus dem Ordner <code className="text-white/60 bg-white/5 px-1 rounded">extension/</code> in Chrome
              (<em>Erweiterungen → Entpackte Erweiterung laden</em>).
            </p>
          </div>
        </div>
      )}

      {extensionReady === true && (
        <div className="card p-4 border-green-500/20 bg-green-500/5 flex items-center gap-3">
          <Check className="w-4 h-4 text-green-400" />
          <p className="text-green-300 text-sm font-medium">Erweiterung verbunden</p>
          <button onClick={loadLibrary} className="ml-auto btn-ghost text-xs" disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Neu laden
          </button>
        </div>
      )}

      {/* How-to */}
      {extensionReady !== false && totalCount === 0 && (
        <div className="card p-4 space-y-2 border-white/5">
          <p className="text-white/60 text-sm font-medium">So funktioniert es:</p>
          <ol className="text-white/40 text-xs space-y-1.5 list-decimal list-inside">
            <li>Öffne <strong className="text-white/60">Netflix → Meine Liste</strong>, <strong className="text-white/60">Disney+ → Merkliste</strong> etc.</li>
            <li>Klicke auf das Erweiterungs-Symbol in der Toolbar → <strong className="text-white/60">„Seite scannen"</strong></li>
            <li>Wiederhole für alle gewünschten Plattformen</li>
            <li>Klicke hier auf <strong className="text-white/60">„Neu laden"</strong> um die Daten zu sehen</li>
          </ol>
        </div>
      )}

      {/* Success banner */}
      <AnimatePresence>
        {doneCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-3 border-green-500/20 bg-green-500/5 flex items-center gap-2 text-green-300 text-sm"
          >
            <Check className="w-4 h-4" />
            {doneCount} Titel zur Playlist hinzugefügt!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library content */}
      {totalCount > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={selectAll} className="btn-ghost text-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              Alle auswählen ({totalCount})
            </button>
            <button onClick={clearSelection} className="btn-ghost text-xs" disabled={selected.size === 0}>
              <Square className="w-3.5 h-3.5" />
              Auswahl aufheben
            </button>
            <button
              onClick={() => window.postMessage({ type: "SHUFFLE_CLEAR_LIBRARY" }, "*")}
              className="btn-ghost text-xs text-red-400/70 hover:text-red-400 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Alles löschen
            </button>
          </div>

          {/* Platform sections */}
          {Object.entries(library).map(([platform, { items, scrapedAt }]) => {
            const cfg = PLATFORM_CONFIG[platform] || { name: platform, icon: "📺", color: "#8b5cf6" };
            const isExpanded = expanded.has(platform);
            const platformSelected = items.filter((i) => selected.has(i.id)).length;
            return (
              <div key={platform} className="card overflow-hidden border-white/5">
                {/* Platform header */}
                <button
                  onClick={() => toggleExpanded(platform)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl">{cfg.icon}</span>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-white text-sm">{cfg.name}</span>
                    <span className="text-white/30 text-xs ml-2">
                      {items.length} Titel · {platformSelected > 0 && <span className="text-accent">{platformSelected} ausgewählt</span>}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlatform(platform); }}
                    className="btn-ghost text-xs px-2 py-1"
                  >
                    {items.every((i) => selected.has(i.id)) ? "Alle ab" : "Alle an"}
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                </button>

                {/* Items list */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-white/5 max-h-72 overflow-y-auto border-t border-white/5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/5",
                              selected.has(item.id) && "bg-accent/5"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                              selected.has(item.id) ? "bg-accent border-accent" : "border-white/20"
                            )}>
                              {selected.has(item.id) && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            {item.thumbnailUrl && (
                              <img
                                src={item.thumbnailUrl}
                                alt=""
                                className="w-8 h-11 object-cover rounded flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{item.title}</p>
                              <p className="text-xs text-white/30">
                                {item.type === "movie" ? "Film" : item.type === "tv" ? "Serie" : "Unbekannt"}
                                {item.year && ` · ${item.year}`}
                              </p>
                            </div>
                            <a
                              href={item.deepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-white/20 hover:text-white/60 flex-shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Add to playlist CTA */}
          {selected.size > 0 && (
            <div className="sticky bottom-4">
              <div className="card p-3 border-accent/30 bg-accent/10 flex items-center justify-between gap-3 shadow-2xl">
                <p className="text-accent text-sm font-medium">
                  {selected.size} Titel ausgewählt
                </p>
                <button
                  onClick={() => setShowPlaylistModal(true)}
                  className="btn-primary"
                >
                  <PlusCircle className="w-4 h-4" />
                  Zur Playlist hinzufügen
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Playlist selection modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowPlaylistModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-sm p-0 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5">
                <h3 className="font-bold text-white">Playlist auswählen</h3>
                <p className="text-white/40 text-xs mt-1">{selected.size} Titel werden hinzugefügt</p>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => addToPlaylist(pl.id)}
                    disabled={addingTo === pl.id}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{pl.name}</p>
                      <p className="text-xs text-white/30">{pl.items.length} Einträge</p>
                    </div>
                    {addingTo === pl.id && <RefreshCw className="w-4 h-4 text-accent animate-spin" />}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-white/5">
                <button
                  onClick={handleNewPlaylist}
                  className="w-full btn-primary justify-center"
                >
                  <PlusCircle className="w-4 h-4" />
                  Neue Playlist erstellen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
