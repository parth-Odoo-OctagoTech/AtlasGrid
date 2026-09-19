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
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded border border-[#293742] bg-[#182026]/95 px-4 py-1.5 shadow-2xl backdrop-blur-md text-[#f5f8fa] text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-[#293742]">
        <Clock className="h-3.5 w-3.5 text-[#d9822b]" />
        <span className="font-mono font-bold text-[#d9822b] tracking-wider text-xs">{timeString}</span>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={() => setReplayPlaying(!isReplayPlaying)}
        className="flex h-6 w-6 items-center justify-center rounded bg-[#202b33] text-[#d9822b] hover:bg-[#293742] transition-colors border border-[#293742]"
        title={isReplayPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isReplayPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3 translate-x-0.5" />
        )}
      </button>

      {/* Timeline Slider */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-[#8a9ba8]">00:00</span>
        <input
          type="range"
          min="0"
          max="23.9"
          step="0.1"
          value={replayHour}
          onChange={(e) => setReplayHour(parseFloat(e.target.value))}
          className="h-1 w-48 sm:w-64 accent-[#d9822b] bg-[#101418] rounded cursor-pointer appearance-none shadow-inner"
        />
        <span className="font-mono text-[9px] text-[#8a9ba8]">23:59</span>
      </div>

      {/* Solar Noon Reset */}
      <button
        onClick={() => setReplayHour(12)}
        title="Reset to 12:00 UTC (Peak Solar)"
        className="flex h-6 w-6 items-center justify-center rounded text-[#8a9ba8] hover:text-[#f5f8fa] hover:bg-[#202b33] border border-[#293742] transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </div>
  );
}
