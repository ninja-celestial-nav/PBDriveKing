"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Hook for communicating with the YOLOv11 Python backend.
 * Sends video frames to the server and receives pose landmarks.
 */
export function useYoloBackend(
  serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  /**
   * Check if the backend server is running.
   */
  const checkServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setReady(true);
        setLoading(false);
        return true;
      }
      throw new Error("Server not healthy");
    } catch (err) {
      setError("YOLOv11 backend not reachable. Run: python backend/server.py");
      setReady(false);
      setLoading(false);
      return false;
    }
  }, [serverUrl]);

  /**
   * Send a full video file to the server for batch analysis.
   * Returns landmarks for all frames via SSE/streaming.
   */
  const analyzeVideo = useCallback(
    async (videoFile, onProgress, rotation = 0) => {
      const formData = new FormData();
      formData.append("video", videoFile);

      abortRef.current = new AbortController();

      try {
        const res = await fetch(`${serverUrl}/api/analyze-video?rotation=${rotation}`, {
          method: "POST",
          body: formData,
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const allFrames = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "progress") {
                  onProgress?.({
                    frame: data.frame,
                    totalFrames: data.total_frames,
                    progress: (data.frame / data.total_frames) * 100,
                  });
                }

                if (data.type === "frame") {
                  allFrames.push({
                    frame: data.frame,
                    landmarks: data.landmarks,
                    timestamp: data.timestamp,
                  });
                }

                if (data.type === "complete") {
                  return {
                    success: true,
                    frames: allFrames,
                    totalFrames: data.total_frames,
                    fps: data.fps,
                  };
                }

                if (data.type === "error") {
                  throw new Error(data.message);
                }
              } catch (parseErr) {
                // Skip unparseable lines
              }
            }
          }
        }

        return { success: true, frames: allFrames };
      } catch (err) {
        if (err.name === "AbortError") {
          return { success: false, error: "Analysis cancelled" };
        }
        throw err;
      }
    },
    [serverUrl]
  );

  /**
   * Detect pose on a single frame (base64 image).
   */
  const detectFrame = useCallback(
    async (base64Image) => {
      try {
        const res = await fetch(`${serverUrl}/api/detect-pose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn("[YOLOv11] Frame detection error:", err);
        return null;
      }
    },
    [serverUrl]
  );

  /**
   * Cancel ongoing analysis.
   */
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return {
    ready,
    loading,
    error,
    checkServer,
    analyzeVideo,
    detectFrame,
    cancel,
  };
}
