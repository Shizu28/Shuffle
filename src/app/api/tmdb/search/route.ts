import { NextRequest, NextResponse } from "next/server";
import { searchMulti, searchMovies, searchTV } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") ?? "all";
  const page = searchParams.get("page") ?? "1";

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Suchbegriff muss mindestens 2 Zeichen haben" },
      { status: 400 }
    );
  }

  try {
    let results;
    if (type === "movie") {
      results = await searchMovies(query, Number(page));
    } else if (type === "tv") {
      results = await searchTV(query, Number(page));
    } else {
      results = await searchMulti(query, Number(page));
    }
    return NextResponse.json(results);
  } catch (error) {
    console.error("TMDB Suche fehlgeschlagen:", error);
    return NextResponse.json(
      { error: "TMDB API nicht erreichbar. API-Key prüfen." },
      { status: 500 }
    );
  }
}
