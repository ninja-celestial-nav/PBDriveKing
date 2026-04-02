"use client";

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Gauge,
  Sliders,
} from "lucide-react";
import NeonButton from "../ui/NeonButton";

/**
 * Shared timeline controls for dual video sync.
 */
export default function TimelineSync({
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  playbackRate = 1,
  syncOffset = 0,
  onTogglePlay,
  onSeek,
  onStepForward,
  onStepBackward,
  onPlaybackRateChange,
  onSyncOffsetChange,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  const frameNumber = Math.round(currentTime * 30);
  const totalFrames = Math.round(duration * 30);

  const rates = [0.25, 0.5, 1];

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Timeline Slider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-white/40 w-16 text-right">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          className="neon-range flex-1"
          min={0}
          max={duration || 1}
          step={1 / 30}
          value={currentTime}
          onChange={(e) => onSeek?.(parseFloat(e.target.value))}
        />
        <span className="text-[11px] font-mono text-white/40 w-16">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <NeonButton
            variant="ghost"
            size="sm"
            onClick={onStepBackward}
            aria-label="Step backward"
          >
            <SkipBack size={16} />
          </NeonButton>

          <NeonButton
            variant="secondary"
            size="sm"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </NeonButton>

          <NeonButton
            variant="ghost"
            size="sm"
            onClick={onStepForward}
            aria-label="Step forward"
          >
            <SkipForward size={16} />
          </NeonButton>
        </div>

        {/* Frame Counter */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/40">
          <span>
            Frame{" "}
            <span className="text-neon font-semibold">{frameNumber}</span>
            /{totalFrames}
          </span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-1.5">
          <Gauge size={12} className="text-white/30" />
          {rates.map((rate) => (
            <button
              key={rate}
              onClick={() => onPlaybackRateChange?.(rate)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                playbackRate === rate
                  ? "bg-neon/20 text-neon border border-neon/30"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Sync Offset */}
        <div className="flex items-center gap-2">
          <Sliders size={12} className="text-white/30" />
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            Offset
          </span>
          <input
            type="range"
            className="neon-range w-20"
            min={-2}
            max={2}
            step={0.033}
            value={syncOffset}
            onChange={(e) => onSyncOffsetChange?.(parseFloat(e.target.value))}
          />
          <span className="text-[10px] font-mono text-white/40 w-12">
            {syncOffset > 0 ? "+" : ""}
            {syncOffset.toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  );
}
