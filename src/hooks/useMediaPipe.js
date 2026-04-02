"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { initPoseLandmarker, detectPose, isEngineReady, destroyEngine } from "@/lib/mediapipe/pose-engine";

/**
 * Hook to manage MediaPipe PoseLandmarker lifecycle and detection.
 */
export function useMediaPipe() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastTimestamp = useRef(-1);

  // Initialize the engine
  const initialize = useCallback(async () => {
    if (isEngineReady()) {
      setReady(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await initPoseLandmarker();
      setReady(true);
    } catch (err) {
      setError(err.message || "Failed to initialize MediaPipe");
      console.error("[useMediaPipe]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Detect pose on a video element
  const detect = useCallback(
    async (videoElement, timestampMs) => {
      if (!ready || !videoElement) return null;

      // Avoid duplicate detections for the same timestamp
      if (timestampMs === lastTimestamp.current) return null;
      lastTimestamp.current = timestampMs;

      return detectPose(videoElement, timestampMs);
    },
    [ready]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy — singleton should persist across page navigations
    };
  }, []);

  return { ready, loading, error, initialize, detect };
}
