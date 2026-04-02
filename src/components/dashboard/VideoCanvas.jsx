"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import SkeletonOverlay from "./SkeletonOverlay";

/**
 * Single video view with canvas overlay for skeleton rendering.
 */
const VideoCanvas = forwardRef(function VideoCanvas(
  {
    label = "Video",
    onLoadedData,
    onTimeUpdate,
    poseResult = null,
    metricSeverities = {},
    showSkeleton = true,
  },
  ref
) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 360 });
  const [videoSrc, setVideoSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Expose video ref to parent
  useImperativeHandle(ref, () => videoRef.current);

  // Handle video file
  const setVideoFile = useCallback((file) => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setIsLoaded(false);
  }, [videoSrc]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
    if (onLoadedData) onLoadedData();
  }, [onLoadedData]);

  const landmarks = poseResult?.landmarks?.[0] || null;

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-neon/70">
          {label}
        </span>
        {isLoaded && (
          <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
        )}
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black/40 rounded-xl overflow-hidden neon-border"
      >
        {videoSrc ? (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              playsInline
              muted
              preload="auto"
              onLoadedData={handleLoadedData}
              onTimeUpdate={onTimeUpdate}
            />
            {showSkeleton && landmarks && (
              <SkeletonOverlay
                landmarks={landmarks}
                width={dimensions.width}
                height={dimensions.height}
                metricSeverities={metricSeverities}
                visible={showSkeleton}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-sm">
            No video loaded
          </div>
        )}

        {/* Overlay Label */}
        {videoSrc && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neon/80">
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

// Attach setVideoFile via ref pattern
VideoCanvas.displayName = "VideoCanvas";

export default VideoCanvas;
export { VideoCanvas };
