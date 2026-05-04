# Shuffle

**Shuffle** ist eine Web-App + Chrome-Extension zum zufälligen Abspielen von Serien und Filmen aus deinen Streaming-Watchlists.

## Features

- 🎲 Zufällige Wiedergabe aus eigenen Playlists
- 📋 Watchlist-Import von Netflix, Disney+, Amazon Prime Video, Crunchyroll
- 🪟 Companion-Fenster öffnet die Folge direkt auf der Streaming-Plattform
- ▶️ Autoplay + automatischer Play-Button-Klick via Browser-Extension
- ⏸️ Shuffle-Session pausieren / fortsetzen
- ✅ Folgen als gesehen markieren mit Fortschrittsanzeige
- 🔍 TMDB-Suche zum manuellen Hinzufügen von Inhalten

## Tech Stack

| Teil | Technologie |
|------|-------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Browser-Extension | Chrome Manifest V3 |
| Metadaten | TMDB API |

## Voraussetzungen

- Node.js 18+
- Chrome-Browser (für die Extension)
- TMDB API Key (optional, für Cover-Bilder und Suche)

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Port 3002)
npm run dev
```

App läuft dann unter [http://localhost:3002](http://localhost:3002).

## Chrome-Extension laden

1. `chrome://extensions` öffnen
2. **Entwicklermodus** aktivieren (oben rechts)
3. **"Entpackte Erweiterung laden"** → Ordner `extension/` auswählen
4. Extension ist aktiv — auf einer Streaming-Seite die Watchlist öffnen und auf das Extension-Icon klicken

## Unterstützte Plattformen

| Plattform | Scraping | Companion-Window | Autoplay |
|-----------|----------|-----------------|----------|
| Netflix | ✅ | ✅ | ✅ |
| Disney+ | ✅ | ✅ | ✅ |
| Amazon Prime Video | ✅ | ✅ | ✅ |
| Crunchyroll | ✅ | ✅ | — |
| YouTube | — | ✅ (Embed) | ✅ |
| ARD Mediathek | — | ✅ (Embed) | ✅ |

## Projektstruktur

```
src/
  app/          # Next.js App Router (Seiten)
  components/   # React-Komponenten
  lib/          # Hilfsfunktionen, TMDB-Client, Plattform-Config
  store/        # Zustand-Store (Playlists, Sessions)
  types/        # TypeScript-Typen
extension/
  manifest.json
  popup/        # Extension-Popup (Watchlist-Scraper)
  content/      # Content Scripts (Autoplay, Platform-Scraper)
  background.js
```

## Build

```bash
npm run build
npm run start
```
