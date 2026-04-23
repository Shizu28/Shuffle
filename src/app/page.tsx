import Link from "next/link";
import { Shuffle, Zap, ListMusic, Tv } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-hero-gradient flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="mb-6 relative">
          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center glow mx-auto animate-pulse-glow">
            <Shuffle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">Shuffle</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          Dein persönlicher Streaming-Mix. Erstelle Playlists aus mehreren Serien & Filmen –
          und lass sie in deinem eigenen Rhythmus ablaufen.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
            <Shuffle className="w-5 h-5" />
            Loslegen
          </Link>
          <Link href="/playlist/new" className="btn-secondary text-base px-8 py-3">
            Neue Playlist
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ListMusic,
              title: "Mehrere Serien mixen",
              desc: "Füge beliebig viele Serien und Filme aus verschiedenen Plattformen zusammen – Netflix, Prime, Crunchyroll und mehr.",
              color: "text-accent",
              bg: "bg-accent/10",
            },
            {
              icon: Zap,
              title: "Eigener Rhythmus",
              desc: "Bestimme selbst: 3× Breaking Bad, dann 2× Dark, dann 1× Film. Oder alles zufällig durchgemischt.",
              color: "text-cyan-accent",
              bg: "bg-cyan-accent/10",
            },
            {
              icon: Tv,
              title: "Episode Tracking",
              desc: "Shuffle merkt sich wo du gerade bist. Folge für Folge, Staffel für Staffel – automatisch.",
              color: "text-green-400",
              bg: "bg-green-400/10",
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card p-6 hover:border-white/10 transition-all">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Logos */}
      <section className="border-t border-white/5 py-10 px-4">
        <p className="text-center text-white/30 text-sm mb-6">
          Funktioniert mit allen Streaming-Plattformen
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-2xl opacity-50">
          {["🎬", "📦", "✨", "🍎", "📺", "🍥", "💜", "⛰️", "🇩🇪", "📡"].map((emoji, i) => (
            <span key={i} className="hover:opacity-100 transition-opacity">
              {emoji}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
