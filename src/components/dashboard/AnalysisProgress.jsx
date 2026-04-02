"use client";

import { Loader2, CheckCircle, XCircle, Zap, RefreshCw } from "lucide-react";
import NeonButton from "../ui/NeonButton";

/**
 * Analysis progress screen shown while processing video frames.
 */
export default function AnalysisProgress({
  progress = 0, // 0-100
  currentFrame = 0,
  totalFrames = 0,
  stage = "initializing", // "initializing" | "processing_rear" | "processing_side" | "scoring" | "complete" | "error"
  error = null,
  onCancel,
  currentThumbnail = null,
}) {
  const stageLabels = {
    initializing: "Initializing AI Engine…",
    uploading: "Uploading Video to AI…",
    processing_rear: "Reviewing Rear Footage (View 1)…",
    processing_side: "Reviewing Side Footage (View 2)…",
    scoring: "Synthesizing Session Results…",
    complete: "Analysis Complete!",
    error: "Analysis Failed",
  };

  const stageColors = {
    initializing: "text-neon-accent",
    uploading: "text-neon-accent",
    processing_rear: "text-neon",
    processing_side: "text-neon-secondary",
    scoring: "text-neon-warning",
    complete: "text-neon",
    error: "text-neon-danger",
  };

  const isComplete = stage === "complete";
  const isError = stage === "error";
  const isProcessing = !isComplete && !isError;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="glass-card p-10 w-full max-w-lg text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          {isProcessing && (
            <div className="w-20 h-20 rounded-full bg-neon/5 border border-neon/20 flex items-center justify-center animate-pulse-glow">
              <Loader2
                size={36}
                className="text-neon animate-spin"
                style={{ animationDuration: "1.5s" }}
              />
            </div>
          )}
          {isComplete && (
            <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center animate-score-reveal">
              <CheckCircle size={36} className="text-neon" />
            </div>
          )}
          {isError && (
            <div className="w-20 h-20 rounded-full bg-neon-danger/10 border border-neon-danger/30 flex items-center justify-center">
              <XCircle size={36} className="text-neon-danger" />
            </div>
          )}
        </div>

        {/* Stage Label */}
        <div>
          <h2 className={`text-xl font-bold ${stageColors[stage]}`}>
            {stageLabels[stage]}
          </h2>
          {isProcessing && (
            <p className="text-sm text-white/30 mt-2">
              Processing frame {currentFrame} of {totalFrames}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, #39FF14, #00FF87)`,
                  boxShadow: "0 0 15px rgba(57, 255, 20, 0.4)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neon/60">{Math.round(progress)}%</span>
              <span className="text-white/20">
                {totalFrames > 0
                  ? `ETA: ~${Math.max(1, Math.round(((totalFrames - currentFrame) * 0.05)))}s`
                  : "Calculating…"}
              </span>
            </div>
          </div>
        )}

        {/* Orientation Hint */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mx-auto">
             <RefreshCw size={12} className="text-neon-accent/60" />
             <span className="text-[10px] text-white/40 tracking-wide uppercase font-bold">
                Smart Orientation Correction Active
             </span>
          </div>
        )}

        {/* Live Skeleton Preview (thumbnail of current frame) */}
        {isProcessing && currentThumbnail && (
          <div className="relative w-48 h-28 mx-auto rounded-lg overflow-hidden border border-neon/15 bg-black">
            <img
              src={currentThumbnail}
              alt="Current frame"
              className="w-full h-full object-contain opacity-70"
            />
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-1">
              <span className="text-[9px] font-mono text-neon/60">
                Frame {currentFrame}
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {isError && error && (
          <div className="text-sm text-neon-danger/70 bg-neon-danger/5 border border-neon-danger/15 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Actions */}
        {isProcessing && onCancel && (
          <NeonButton variant="ghost" size="sm" onClick={onCancel}>
            Cancel Analysis
          </NeonButton>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="mt-8 flex items-center gap-2 text-[10px] text-white/15">
        <Zap size={10} />
        <span>PBDriveKing AI Engine</span>
      </div>
    </div>
  );
}
