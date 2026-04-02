"use client";

import { useState, useCallback, useRef } from "react";
import { extractMetrics, segmentSwings, getPeakMetricsPerSwing } from "@/lib/analysis/metrics";
import { scoreAllMetrics, calculateSessionStats } from "@/lib/analysis/scoring";
import { generateCoaching } from "@/lib/analysis/coach-logic";

/**
 * Hook that combines pose data → metrics → scoring → coaching.
 * Supports both single-frame and batch analysis with progress callback.
 */
export function useAnalysis(hand = "right") {
  const [metrics, setMetrics] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [coaching, setCoaching] = useState([]);
  const [session, setSession] = useState(null); // { progress, swingsCount, consistency, bestSwing }
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | initializing | uploading | processing_rear | processing_side | scoring | complete | error
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const prevSideWrist = useRef(null);
  const startHipCenter = useRef(null);
  const frameHistory = useRef([]);
  const cancelledRef = useRef(false);

  /**
   * Analyze a single frame from both camera views.
   */
  const analyzeFrame = useCallback(
    (rearResult, sideResult) => {
      const rearLandmarks = rearResult?.landmarks?.[0] || null;
      const sideLandmarks = sideResult?.landmarks?.[0] || null;

      let currentSideWrist = null;
      if (sideLandmarks && sideLandmarks.length >= 33) {
        const wristIdx = hand === "right" ? 16 : 15;
        currentSideWrist = sideLandmarks[wristIdx];
      }

      if (sideLandmarks && !startHipCenter.current) {
        const lHip = sideLandmarks[23];
        const rHip = sideLandmarks[24];
        startHipCenter.current = {
          x: (lHip.x + rHip.x) / 2,
          y: (lHip.y + rHip.y) / 2,
        };
      }

      const frameMetrics = extractMetrics({
        rearLandmarks,
        sideLandmarks,
        hand,
        prevSideWrist: prevSideWrist.current,
        startHipCenter: startHipCenter.current,
      });

      prevSideWrist.current = currentSideWrist;
      frameHistory.current.push(frameMetrics);

      return frameMetrics;
    },
    [hand]
  );

  /**
   * Batch analyze a video using MediaPipe (in-browser).
   * Processes every Nth frame and reports progress.
   */
  const batchAnalyze = useCallback(
    async ({
      rearVideoEl,
      sideVideoEl,
      detectFn,
      onProgress,
      frameSkip = 3, // Only analyze every Nth frame for speed
      rearRotation = 0,
      sideRotation = 0,
    }) => {
      cancelledRef.current = false;
      setIsAnalyzing(true);
      setProgress(0);
      frameHistory.current = [];
      prevSideWrist.current = null;
      startHipCenter.current = null;

      try {
        // --- Phase 1: Process REAR video ---
        if (rearVideoEl) {
          setStage("processing_rear");
          const rearDuration = rearVideoEl.duration;
          const fps = 30;
          const rearTotalFrames = Math.floor(rearDuration * fps);
          const framesToProcess = Math.ceil(rearTotalFrames / frameSkip);
          setTotalFrames(framesToProcess);

          for (let i = 0; i < framesToProcess; i++) {
            if (cancelledRef.current) break;

            const timeInSec = (i * frameSkip) / fps;
            rearVideoEl.currentTime = timeInSec;

            // Wait for seek to complete
            await new Promise((resolve) => {
              rearVideoEl.onseeked = resolve;
              // Fallback timeout
              setTimeout(resolve, 200);
            });

            const timestamp = performance.now() + i;
            const rearResult = await detectFn(rearVideoEl, timestamp);

            analyzeFrame(rearResult, null);

            const pct = ((i + 1) / framesToProcess) * 50; // Rear = 0-50%
            setProgress(pct);
            setCurrentFrame(i + 1);
            onProgress?.({
              stage: "processing_rear",
              frame: i + 1,
              totalFrames: framesToProcess,
              progress: pct,
            });

            // Yield to UI thread
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        // --- Phase 2: Process SIDE video ---
        if (sideVideoEl && !cancelledRef.current) {
          setStage("processing_side");
          prevSideWrist.current = null;
          startHipCenter.current = null;

          const sideDuration = sideVideoEl.duration;
          const fps = 30;
          const sideTotalFrames = Math.floor(sideDuration * fps);
          const framesToProcess = Math.ceil(sideTotalFrames / frameSkip);
          setTotalFrames(framesToProcess);

          const sideFrameMetrics = [];

          for (let i = 0; i < framesToProcess; i++) {
            if (cancelledRef.current) break;

            const timeInSec = (i * frameSkip) / fps;
            sideVideoEl.currentTime = timeInSec;

            await new Promise((resolve) => {
              sideVideoEl.onseeked = resolve;
              setTimeout(resolve, 200);
            });

            const timestamp = performance.now() + i + 100000;
            const sideResult = await detectFn(sideVideoEl, timestamp);

            analyzeFrame(null, sideResult);

            const pct = 50 + ((i + 1) / framesToProcess) * 40; // Side = 50-90%
            setProgress(pct);
            setCurrentFrame(i + 1);
            onProgress?.({
              stage: "processing_side",
              frame: i + 1,
              totalFrames: framesToProcess,
              progress: pct,
            });

            await new Promise((r) => setTimeout(r, 0));
          }
        }

        if (cancelledRef.current) {
          setStage("idle");
          setIsAnalyzing(false);
          return null;
        }

        // --- Phase 3: Compute aggregate scores ---
        // --- Phase 3: Segment Swings and Compute Session Stats ---
        setStage("scoring");
        setProgress(92);

        // 1. Identify discrete swings from the session history
        const swings = segmentSwings(frameHistory.current);
        
        // 2. Extract peak metrics for each swing
        const peaks = getPeakMetricsPerSwing(frameHistory.current, swings);
        
        // 3. Calculate session-wide aggregate stats
        const sessionStats = calculateSessionStats(peaks);
        
        // 4. Generate coaching based on averages (the "overall recommendation")
        const finalCoaching = generateCoaching(sessionStats.averages);

        setProgress(100);
        setMetrics(sessionStats.averages);
        setScoring(sessionStats);
        setCoaching(finalCoaching);
        setSession({
          swingsCount: sessionStats.swingsCount,
          consistency: sessionStats.consistency,
        });
        setStage("complete");
        setIsAnalyzing(false);

        return {
          metrics: sessionStats.averages,
          scoring: sessionStats,
          coaching: finalCoaching,
          session: sessionStats,
        };
      } catch (err) {
        console.error("[useAnalysis] Batch analysis error:", err);
        setStage("error");
        setIsAnalyzing(false);
        throw err;
      }
    },
    [analyzeFrame]
  );

  /**
   * Batch analyze using YOLOv11 backend results.
   * Receives pre-computed landmarks from the server.
   */
  const batchAnalyzeFromLandmarks = useCallback(
    (rearFrames, sideFrames) => {
      setIsAnalyzing(true);
      setStage("scoring");
      frameHistory.current = [];
      prevSideWrist.current = null;
      startHipCenter.current = null;

      // Process rear frames
      if (rearFrames) {
        for (const frame of rearFrames) {
          analyzeFrame({ landmarks: [frame.landmarks] }, null);
        }
      }

      // Reset refs for side
      prevSideWrist.current = null;
      startHipCenter.current = null;

      // Process side frames
      if (sideFrames) {
        for (const frame of sideFrames) {
          analyzeFrame(null, { landmarks: [frame.landmarks] });
        }
      }

      const swings = segmentSwings(frameHistory.current);
      const peaks = getPeakMetricsPerSwing(frameHistory.current, swings);
      const sessionStats = calculateSessionStats(peaks);
      const finalCoaching = generateCoaching(sessionStats.averages);

      setMetrics(sessionStats.averages);
      setScoring(sessionStats);
      setCoaching(finalCoaching);
      setSession({
        swingsCount: sessionStats.swingsCount,
        consistency: sessionStats.consistency,
      });
      setStage("complete");
      setIsAnalyzing(false);

      return { metrics: sessionStats.averages, scoring: sessionStats, coaching: finalCoaching, session: sessionStats };
    },
    [analyzeFrame]
  );

  /**
   * Cancel ongoing batch analysis.
   */
  const cancelAnalysis = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  /**
   * Reset analysis state.
   */
  const resetAnalysis = useCallback(() => {
    setMetrics(null);
    setScoring(null);
    setCoaching([]);
    setSession(null);
    setIsAnalyzing(false);
    setProgress(0);
    setStage("idle");
    setCurrentFrame(0);
    setTotalFrames(0);
    prevSideWrist.current = null;
    startHipCenter.current = null;
    frameHistory.current = [];
    cancelledRef.current = false;
  }, []);

  /**
   * Manually update progress state (used by external engines like YOLO).
   */
  const updateProgress = useCallback(({ frame, total, pct, stage: newStage }) => {
    if (frame !== undefined) setCurrentFrame(frame);
    if (total !== undefined) setTotalFrames(total);
    if (pct !== undefined) setProgress(pct);
    if (newStage !== undefined) setStage(newStage);
  }, []);

  return {
    metrics,
    scoring,
    coaching,
    session,
    isAnalyzing,
    progress,
    stage,
    currentFrame,
    totalFrames,
    analyzeFrame,
    batchAnalyze,
    batchAnalyzeFromLandmarks,
    cancelAnalysis,
    resetAnalysis,
    updateProgress,
    setStage,
    frameHistory: frameHistory.current,
  };
}

/**
 * Average metrics across all frames.
 * Takes the median of each numeric metric to reduce noise.
 */
function averageFrameMetrics(frames) {
  if (!frames.length) return {};

  const keys = [
    "unitTurn",
    "contactPoint",
    "backswing",
    "kneeBend",
    "weightTransfer",
    "swingPath",
  ];

  const result = {};

  for (const key of keys) {
    const values = frames
      .map((f) => f[key])
      .filter((v) => v !== null && v !== undefined && typeof v === "number");

    if (values.length > 0) {
      // Use median for robustness
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      result[key] =
        values.length % 2 !== 0
          ? Math.round(values[mid] * 10) / 10
          : Math.round(((values[mid - 1] + values[mid]) / 2) * 10) / 10;
    } else {
      result[key] = null;
    }
  }

  // Follow-through: majority vote
  const ftValues = frames
    .map((f) => f.followThrough)
    .filter((v) => v !== null && v !== undefined);

  if (ftValues.length > 0) {
    const crossedCount = ftValues.filter(
      (v) => typeof v === "object" && v.crossed
    ).length;
    const avgDist =
      ftValues
        .filter((v) => typeof v === "object")
        .reduce((sum, v) => sum + (v.distance || 0), 0) / ftValues.length;

    result.followThrough = {
      crossed: crossedCount > ftValues.length / 2,
      distance: Math.round(avgDist * 10) / 10,
    };
  } else {
    result.followThrough = null;
  }

  return result;
}
