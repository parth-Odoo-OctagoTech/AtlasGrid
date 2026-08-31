"use client";

import { useGridStore } from "@/lib/store/useGridStore";
import { Play, Pause, RotateCcw, Clock, FastForward, Sparkles } from "lucide-react";

export function TimeScrubber() {
  const isReplayMode = useGridStore((s) => s.isReplayMode);
  const replayHour = useGridStore((s) => s.replayHour);
  const setReplayHour = useGridStore((s) => s.setReplayHour);
  const isReplayPlaying = useGridStore((s) => s.isReplayPlaying);
  const setReplayPlaying = useGridStore((s) => s.setReplayPlaying);

  if (!isReplayMode) return null;

  const hours = Math.floor(replayHour);
  const minutes = Math.floor((replayHour % 1) * 60);
  const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} UTC`;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3.5 rounded-full border border-amber-500/40 bg-slate-950/85 px-5 py-2 shadow-2xl backdrop-blur-xl text-white text-xs animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center gap-2 pr-3.5 border-r border-white/10">
        <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="font-mono font-bold text-amber-400 tracking-wide text-xs">{timeString}</span>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={() => setReplayPlaying(!isReplayPlaying)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/40 shadow-glow-sm hover:scale-105 active:scale-95"
        title={isReplayPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isReplayPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 translate-x-0.5" />
        )}
      </button>

      {/* Timeline Slider */}
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[10px] text-gray-400">00:00</span>
        <input
          type="range"
          min="0"
          max="23.9"
          step="0.1"
          value={replayHour}
          onChange={(e) => setReplayHour(parseFloat(e.target.value))}
          className="h-1.5 w-48 sm:w-72 accent-amber-400 bg-slate-800 rounded-lg cursor-pointer appearance-none shadow-inner"
        />
        <span className="font-mono text-[10px] text-gray-400">23:59</span>
      </div>

      {/* Solar Noon Reset */}
      <button
        onClick={() => setReplayHour(12)}
        title="Reset to 12:00 UTC (Peak Solar)"
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:text-amber-400 hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
