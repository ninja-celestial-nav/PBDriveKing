"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import VideoCanvas from "./VideoCanvas";
import TimelineSync from "./TimelineSync";
import { useDualVideoSync } from "@/hooks/useDualVideoSync";
import { useMediaPipe } from "@/hooks/useMediaPipe";

/**
 * Dual synchronized video player with pose detection.
 */
export default function DualVideoPlayer({
  rearFile,
  sideFile,
  onPoseResults,
  showSkeleton = true,
  metricSeverities = {},
}) {
  const rearVideoRef = useRef(null);
  const sideVideoRef = useRef(null);

  const [rearPose, setRearPose] = useState(null);
  const [sidePose, setSidePose] = useState(null);
  const [rearSrc, setRearSrc] = useState(null);
  const [sideSrc, setSideSrc] = useState(null);

  const { ready, loading, error, initialize, detect } = useMediaPipe();

  const {
    isPlaying,
    currentTime,
    duration,
    syncOffset,
    playbackRate,
    setSyncOffset,
    handleRearLoaded,
    handleSideLoaded,
    togglePlay,
    seekTo,
    stepForward,
    stepBackward,
    changePlaybackRate,
  } = useDualVideoSync();

  // Create object URLs for video files
  useEffect(() => {
    if (rearFile) {
      const url = URL.createObjectURL(rearFile);
      setRearSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [rearFile]);

  useEffect(() => {
    if (sideFile) {
      const url = URL.createObjectURL(sideFile);
      setSideSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [sideFile]);

  // Wire up video refs for sync hook
  useEffect(() => {
    const sync = useDualVideoSync;
  }, []);

  // Initialize MediaPipe on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Run pose detection when video is paused or on time update
  const runDetection = useCallback(async () => {
    if (!ready) return;

    const rearVideo = rearVideoRef.current;
    const sideVideo = sideVideoRef.current;

    const timestamp = performance.now();

    let rearResult = null;
    let sideResult = null;

    if (rearVideo && rearVideo.readyState >= 2) {
      rearResult = await detect(rearVideo, timestamp);
      setRearPose(rearResult);
    }

    if (sideVideo && sideVideo.readyState >= 2) {
      sideResult = await detect(sideVideo, timestamp + 1);
      setSidePose(sideResult);
    }

    if (onPoseResults) {
      onPoseResults(rearResult, sideResult);
    }
  }, [ready, detect, onPoseResults]);

  // Run detection on seek/pause
  const handleSeek = useCallback(
    (time) => {
      seekTo(time);
      // Small delay to let video seek complete
      setTimeout(runDetection, 100);
    },
    [seekTo, runDetection]
  );

  const handleStepForward = useCallback(() => {
    stepForward();
    setTimeout(runDetection, 100);
  }, [stepForward, runDetection]);

  const handleStepBackward = useCallback(() => {
    stepBackward();
    setTimeout(runDetection, 100);
  }, [stepBackward, runDetection]);

  const handleTogglePlay = useCallback(() => {
    togglePlay();
    if (isPlaying) {
      // Just paused — run detection on current frame
      setTimeout(runDetection, 100);
    }
  }, [togglePlay, isPlaying, runDetection]);

  // Handle metadata loaded
  const handleRearLoadedData = useCallback(() => {
    if (rearVideoRef.current) {
      const dur = rearVideoRef.current.duration;
      handleRearLoaded();
    }
  }, [handleRearLoaded]);

  const handleSideLoadedData = useCallback(() => {
    if (sideVideoRef.current) {
      handleSideLoaded();
    }
  }, [handleSideLoaded]);

  return (
    <div className="flex flex-col gap-4">
      {/* Status Bar */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              ready
                ? "bg-neon"
                : loading
                ? "bg-neon-warning animate-pulse"
                : "bg-white/20"
            }`}
          />
          <span className="text-white/40">
            {loading
              ? "Loading AI Model..."
              : ready
              ? "AI Ready"
              : error
              ? "AI Error"
              : "AI Standby"}
          </span>
        </div>
        {error && (
          <span className="text-neon-danger text-[10px]">{error}</span>
        )}
      </div>

      {/* Dual Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rear View */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-neon/70">
              Rear View
            </span>
            {rearSrc && (
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            )}
          </div>
          <div className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden neon-border">
            {rearSrc ? (
              <>
                <video
                  ref={rearVideoRef}
                  src={rearSrc}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  preload="auto"
                  onLoadedData={handleRearLoadedData}
                />
                {showSkeleton && rearPose?.landmarks?.[0] && (
                  <SkeletonOverlayInner
                    landmarks={rearPose.landmarks[0]}
                    metricSeverities={metricSeverities}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">
                No rear video loaded
              </div>
            )}
            {rearSrc && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neon/80">
                  Rear View
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side View */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-neon/70">
              Side View
            </span>
            {sideSrc && (
              <span className="w-2 h-2 rounded-full bg-neon-secondary animate-pulse" />
            )}
          </div>
          <div className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden neon-border">
            {sideSrc ? (
              <>
                <video
                  ref={sideVideoRef}
                  src={sideSrc}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  preload="auto"
                  onLoadedData={handleSideLoadedData}
                />
                {showSkeleton && sidePose?.landmarks?.[0] && (
                  <SkeletonOverlayInner
                    landmarks={sidePose.landmarks[0]}
                    metricSeverities={metricSeverities}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">
                No side video loaded
              </div>
            )}
            {sideSrc && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neon-secondary/80">
                  Side View
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <TimelineSync
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        syncOffset={syncOffset}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onPlaybackRateChange={changePlaybackRate}
        onSyncOffsetChange={setSyncOffset}
      />
    </div>
  );
}

/**
 * Inline skeleton overlay that uses the container dimensions.
 */
function SkeletonOverlayInner({ landmarks, metricSeverities = {} }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    }
  }, [landmarks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || dims.width === 0) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, dims.width, dims.height);

    const CONNECTIONS = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
      [24, 26], [26, 28],
    ];

    ctx.lineWidth = 2.5;
    CONNECTIONS.forEach(([s, e]) => {
      const start = landmarks[s];
      const end = landmarks[e];
      if (!start || !end) return;
      if ((start.visibility || 0) < 0.3 || (end.visibility || 0) < 0.3) return;

      ctx.beginPath();
      ctx.moveTo(start.x * dims.width, start.y * dims.height);
      ctx.lineTo(end.x * dims.width, end.y * dims.height);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
      ctx.shadowColor = "rgba(0, 229, 255, 0.4)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    landmarks.forEach((lm, i) => {
      if (!lm || (lm.visibility || 0) < 0.3) return;
      if (i >= 1 && i <= 10) return;
      if (i > 32) return;

      const x = lm.x * dims.width;
      const y = lm.y * dims.height;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#39FF14";
      ctx.shadowColor = "#39FF14";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [landmarks, dims]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: dims.width || "100%", height: dims.height || "100%" }}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
}
