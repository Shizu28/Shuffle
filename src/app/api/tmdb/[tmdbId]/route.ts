import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: { tmdbId: string } }
) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "movie" | "tv" | null;
  const id = Number(params.tmdbId);

  if (!type || !["movie", "tv"].includes(type)) {
    return NextResponse.json(
      { error: "type=movie oder type=tv erforderlich" },
      { status: 400 }
    );
  }

  if (isNaN(id)) {
    return NextResponse.json({ error: "Ungültige TMDB ID" }, { status: 400 });
  }

  try {
    const details =
      type === "movie" ? await getMovieDetails(id) : await getTVDetails(id);
    return NextResponse.json(details);
  } catch (error) {
    console.error("TMDB Details fehlgeschlagen:", error);
    return NextResponse.json(
      { error: "Details konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}
