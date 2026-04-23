"use client";

import { useState } from "react";
import { Plus, Trash2, Settings, Globe } from "lucide-react";
import { useShuffleStore } from "@/store/useShuffleStore";
import { DEFAULT_PLATFORMS, getPlatformColor } from "@/lib/platforms";
import { PlatformConfig } from "@/types";
import { cn } from "@/lib/utils";

const EMPTY_PLATFORM: Omit<PlatformConfig, "isCustom"> = {
  id: "",
  name: "",
  color: "#8b5cf6",
  logo: "🎬",
  searchTemplate: "https://www.{platform}.com/search?q={title}",
};

export default function SettingsPage() {
  const { customPlatforms, addCustomPlatform, removeCustomPlatform } =
    useShuffleStore();
  const [newPlatform, setNewPlatform] = useState({ ...EMPTY_PLATFORM });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    if (!newPlatform.id.trim() || !newPlatform.name.trim() || !newPlatform.searchTemplate.trim()) {
      setError("ID, Name und Such-URL sind Pflichtfelder");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(newPlatform.id)) {
      setError("ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten");
      return;
    }
    const all = [...DEFAULT_PLATFORMS, ...customPlatforms];
    if (all.some((p) => p.id === newPlatform.id)) {
      setError("Diese ID wird bereits verwendet");
      return;
    }
    addCustomPlatform(newPlatform);
    setNewPlatform({ ...EMPTY_PLATFORM });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Einstellungen</h1>
          <p className="text-white/50 text-sm">Plattformen und Konfiguration</p>
        </div>
      </div>

      {/* Default Platforms */}
      <div>
        <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent" />
          Standard-Plattformen
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DEFAULT_PLATFORMS.map((p) => (
            <div
              key={p.id}
              className="card p-3 flex items-center gap-3"
              style={{ borderColor: p.color + "30" }}
            >
              <span className="text-xl">{p.logo}</span>
              <div>
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-white/30">Integriert</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Platforms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            Eigene Plattformen
            {customPlatforms.length > 0 && (
              <span className="badge bg-accent/20 text-accent">
                {customPlatforms.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-sm"
          >
            <Plus className="w-4 h-4" />
            Plattform hinzufügen
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="card p-5 space-y-4 mb-4">
            <h3 className="font-bold text-white text-sm">Neue Plattform</h3>
            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ID *</label>
                <input
                  type="text"
                  value={newPlatform.id}
                  onChange={(e) =>
                    setNewPlatform({ ...newPlatform, id: e.target.value.toLowerCase() })
                  }
                  placeholder="z.B. sky-de"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={newPlatform.name}
                  onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
                  placeholder="z.B. Sky"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Emoji / Logo</label>
                <input
                  type="text"
                  value={newPlatform.logo}
                  onChange={(e) => setNewPlatform({ ...newPlatform, logo: e.target.value })}
                  placeholder="🎬"
                  className="input text-sm"
                  maxLength={4}
                />
              </div>
              <div>
                <label className="label">Farbe</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newPlatform.color}
                    onChange={(e) => setNewPlatform({ ...newPlatform, color: e.target.value })}
                    className="w-12 h-11 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newPlatform.color}
                    onChange={(e) => setNewPlatform({ ...newPlatform, color: e.target.value })}
                    placeholder="#8b5cf6"
                    className="input text-sm flex-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="label">
                Such-URL Template *{" "}
                <span className="text-white/30 font-normal">{"{title}"} wird durch den Titel ersetzt</span>
              </label>
              <input
                type="url"
                value={newPlatform.searchTemplate}
                onChange={(e) =>
                  setNewPlatform({ ...newPlatform, searchTemplate: e.target.value })
                }
                placeholder="https://www.sky.de/suche?q={title}"
                className="input text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleAdd} className="btn-primary text-sm">
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setNewPlatform({ ...EMPTY_PLATFORM });
                }}
                className="btn-ghost text-sm text-white/50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Custom List */}
        {customPlatforms.length === 0 && !showForm ? (
          <div className="card p-6 text-center text-white/30 text-sm">
            Noch keine eigenen Plattformen hinzugefügt
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customPlatforms.map((p) => (
              <div
                key={p.id}
                className="card p-3 flex items-center gap-3 group"
                style={{ borderColor: p.color + "30" }}
              >
                <span className="text-xl">{p.logo}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/30">{p.id}</p>
                </div>
                <button
                  onClick={() => removeCustomPlatform(p.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TMDB Hinweis */}
      <div className="card p-5 border-accent/20 bg-accent/5">
        <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
          🎬 TMDB API Key einrichten
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Für die Suche benötigst du einen kostenlosen TMDB API Key:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-white/50 text-sm">
          <li>
            Registriere dich kostenlos auf{" "}
            <a
              href="https://www.themoviedb.org/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              themoviedb.org
            </a>
          </li>
          <li>
            Erstelle einen API Key unter{" "}
            <span className="text-white/70">Einstellungen → API</span>
          </li>
          <li>
            Kopiere den Key in deine{" "}
            <span className="font-mono text-white/70 bg-bg-elevated px-1.5 py-0.5 rounded">
              .env.local
            </span>{" "}
            Datei:
          </li>
        </ol>
        <pre className="mt-3 bg-bg-primary rounded-lg p-3 text-xs text-green-400 font-mono overflow-x-auto">
          TMDB_API_KEY=dein_api_key_hier
        </pre>
      </div>
    </div>
  );
}
