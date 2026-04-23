"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  Playlist,
  PlaylistItem,
  ShuffleSession,
  ShuffleConfig,
  PlatformConfig,
  QueueEntry,
} from "@/types";
import { generateQueue } from "@/lib/shuffle-engine";
import { DEFAULT_PLATFORMS } from "@/lib/platforms";

// ─── State Interface ─────────────────────────────────────────────────────────────

interface ShuffleState {
  // Playlists
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, "id">>) => void;
  deletePlaylist: (id: string) => void;

  // Playlist Items
  addItemToPlaylist: (playlistId: string, item: Omit<PlaylistItem, "id" | "order">) => void;
  updatePlaylistItem: (playlistId: string, itemId: string, updates: Partial<PlaylistItem>) => void;
  removeItemFromPlaylist: (playlistId: string, itemId: string) => void;
  reorderItems: (playlistId: string, items: PlaylistItem[]) => void;

  // Shuffle Config
  updateShuffleConfig: (playlistId: string, config: Partial<ShuffleConfig>) => void;

  // Sessions
  sessions: ShuffleSession[];
  activeSessionId: string | null;
  startSession: (playlistId: string) => ShuffleSession;
  endSession: (sessionId: string) => void;
  markWatched: (sessionId: string, entryId: string) => void;
  goToIndex: (sessionId: string, index: number) => void;
  getSession: (sessionId: string) => ShuffleSession | undefined;
  regenerateQueue: (sessionId: string) => void;

  // Plattformen
  customPlatforms: PlatformConfig[];
  addCustomPlatform: (platform: Omit<PlatformConfig, "isCustom">) => void;
  removeCustomPlatform: (id: string) => void;
  getAllPlatforms: () => PlatformConfig[];
}

// ─── Default Config ───────────────────────────────────────────────────────────────

const DEFAULT_SHUFFLE_CONFIG: ShuffleConfig = {
  mode: "pattern",
  cycles: 10,
  loop: true,
  randomizeOrder: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────────

export const useShuffleStore = create<ShuffleState>()(
  persist(
    (set, get) => ({
      playlists: [],
      sessions: [],
      activeSessionId: null,
      customPlatforms: [],

      // ── Playlists ──────────────────────────────────────────────────────────────

      createPlaylist(name, description) {
        const now = new Date().toISOString();
        const playlist: Playlist = {
          id: nanoid(),
          name,
          description,
          items: [],
          shuffleConfig: { ...DEFAULT_SHUFFLE_CONFIG },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
        return playlist;
      },

      updatePlaylist(id, updates) {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deletePlaylist(id) {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          sessions: state.sessions.filter((s) => s.playlistId !== id),
        }));
      },

      // ── Playlist Items ─────────────────────────────────────────────────────────

      addItemToPlaylist(playlistId, item) {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const newItem: PlaylistItem = {
              ...item,
              id: nanoid(),
              order: p.items.length,
            };
            return {
              ...p,
              items: [...p.items, newItem],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      updatePlaylistItem(playlistId, itemId, updates) {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            return {
              ...p,
              items: p.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeItemFromPlaylist(playlistId, itemId) {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const filtered = p.items.filter((i) => i.id !== itemId);
            return {
              ...p,
              items: filtered.map((item, idx) => ({ ...item, order: idx })),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      reorderItems(playlistId, items) {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  items: items.map((item, idx) => ({ ...item, order: idx })),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      // ── Shuffle Config ─────────────────────────────────────────────────────────

      updateShuffleConfig(playlistId, config) {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  shuffleConfig: { ...p.shuffleConfig, ...config },
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      // ── Sessions ───────────────────────────────────────────────────────────────

      startSession(playlistId) {
        const playlist = get().playlists.find((p) => p.id === playlistId);
        if (!playlist) throw new Error("Playlist nicht gefunden");

        const queue = generateQueue(playlist.items, playlist.shuffleConfig);
        const now = new Date().toISOString();
        const session: ShuffleSession = {
          id: nanoid(),
          playlistId,
          playlistName: playlist.name,
          queue,
          currentIndex: 0,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          sessions: [session, ...state.sessions.filter((s) => s.playlistId !== playlistId)],
          activeSessionId: session.id,
        }));

        return session;
      },

      endSession(sessionId) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, isActive: false } : s
          ),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      markWatched(sessionId, entryId) {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const queue = s.queue.map((entry) =>
              entry.id === entryId
                ? { ...entry, watched: true, watchedAt: new Date().toISOString() }
                : entry
            );
            // Automatisch zum nächsten unwatched springen
            const nextIndex = queue.findIndex(
              (e, i) => i > s.currentIndex && !e.watched
            );
            return {
              ...s,
              queue,
              currentIndex: nextIndex >= 0 ? nextIndex : s.currentIndex,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      goToIndex(sessionId, index) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, currentIndex: index, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      getSession(sessionId) {
        return get().sessions.find((s) => s.id === sessionId);
      },

      regenerateQueue(sessionId) {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return;
        const playlist = get().playlists.find((p) => p.id === session.playlistId);
        if (!playlist) return;

        const queue = generateQueue(playlist.items, playlist.shuffleConfig);
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, queue, currentIndex: 0, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      // ── Plattformen ────────────────────────────────────────────────────────────

      addCustomPlatform(platform) {
        const newPlatform: PlatformConfig = { ...platform, isCustom: true };
        set((state) => ({
          customPlatforms: [...state.customPlatforms, newPlatform],
        }));
      },

      removeCustomPlatform(id) {
        set((state) => ({
          customPlatforms: state.customPlatforms.filter((p) => p.id !== id),
        }));
      },

      getAllPlatforms() {
        return [...DEFAULT_PLATFORMS, ...get().customPlatforms];
      },
    }),
    {
      name: "shuffle-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
