"use client";

import { useState } from "react";
import { Shuffle, Zap, List, ChevronDown, ChevronUp, RotateCcw, Info } from "lucide-react";
import { ShuffleConfig, ShuffleMode } from "@/types";
import { cn } from "@/lib/utils";

interface ShuffleConfigPanelProps {
  config: ShuffleConfig;
  onChange: (config: Partial<ShuffleConfig>) => void;
}

const MODES: { value: ShuffleMode; label: string; desc: string; icon: React.ElementType }[] = [
  {
    value: "pattern",
    label: "Muster",
    desc: "X Folgen von Serie A, dann Y Folgen von Serie B – immer abwechselnd",
    icon: Shuffle,
  },
  {
    value: "random",
    label: "Zufall",
    desc: "Alle Folgen werden zufällig durchgemischt",
    icon: Zap,
  },
  {
    value: "sequential",
    label: "Nacheinander",
    desc: "Erst alle Folgen von Serie A, dann alle von Serie B",
    icon: List,
  },
];

const PRESET_CYCLES = [5, 10, 20, 50];

export function ShuffleConfigPanel({ config, onChange }: ShuffleConfigPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Shuffle className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-white text-base">Shuffle-Einstellungen</h3>
      </div>

      {/* Mode Auswahl */}
      <div className="space-y-2">
        <label className="label">Shuffle-Modus</label>
        <div className="grid gap-2">
          {MODES.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ mode: value })}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200",
                config.mode === value
                  ? "border-accent bg-accent/10 text-white"
                  : "border-white/10 bg-bg-elevated text-white/60 hover:border-white/20 hover:text-white"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  config.mode === value ? "bg-accent" : "bg-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-white/50 mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zyklen */}
      <div className="space-y-2">
        <label className="label flex items-center gap-1">
          Zyklen / Länge der Queue
          <span className="text-white/30 text-xs">(wie viele Runden generiert werden)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_CYCLES.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ cycles: c })}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                config.cycles === c
                  ? "bg-accent text-white"
                  : "bg-bg-elevated border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={200}
            value={config.cycles}
            onChange={(e) => onChange({ cycles: Math.max(1, Math.min(200, Number(e.target.value))) })}
            className="input w-20 text-sm py-2"
            placeholder="..."
          />
        </div>
      </div>

      {/* Advanced */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Erweiterte Einstellungen
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 border-t border-white/5">
          {/* Loop */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm font-medium text-white">Queue wiederholen</div>
              <div className="text-xs text-white/40">
                Nach dem Ende der Queue wieder von vorne starten
              </div>
            </div>
            <div
              onClick={() => onChange({ loop: !config.loop })}
              className={cn(
                "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5",
                config.loop ? "bg-accent" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                  config.loop ? "translate-x-5" : "translate-x-0"
                )}
              />
            </div>
          </label>

          {/* Randomize Order */}
          {config.mode === "pattern" && (
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-white">Reihenfolge zufällig</div>
                <div className="text-xs text-white/40">
                  In jedem Zyklus die Serien-Reihenfolge mischen
                </div>
              </div>
              <div
                onClick={() => onChange({ randomizeOrder: !config.randomizeOrder })}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5",
                  config.randomizeOrder ? "bg-accent" : "bg-white/20"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                    config.randomizeOrder ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </div>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
