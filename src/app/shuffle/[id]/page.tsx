"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shuffle } from "lucide-react";
import { useShuffleStore } from "@/store/useShuffleStore";
import { ShufflePlayer } from "@/components/shuffle/ShufflePlayer";

export default function ShuffleSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { sessions, markWatched, goToIndex, endSession, regenerateQueue } =
    useShuffleStore();

  const session = sessions.find((s) => s.id === params.id);

  const handleEnd = () => {
    endSession(params.id);
    router.push("/dashboard");
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Shuffle className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50 mb-4">Session nicht gefunden</p>
        <Link href="/dashboard" className="btn-primary">
          Zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/playlist/${session.playlistId}`}
          className="btn-ghost -ml-2 text-white/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Playlist
        </Link>
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Shuffle className="w-4 h-4 text-accent" />
          <span className="font-medium text-white">{session.playlistName}</span>
        </div>
        <button onClick={handleEnd} className="btn-ghost text-white/40 text-sm">
          Beenden
        </button>
      </div>

      {/* Player */}
      <ShufflePlayer
        session={session}
        onMarkWatched={(entryId) => markWatched(params.id, entryId)}
        onGoToIndex={(index) => goToIndex(params.id, index)}
        onRegenerate={() => regenerateQueue(params.id)}
        onEnd={handleEnd}
      />
    </div>
  );
}
