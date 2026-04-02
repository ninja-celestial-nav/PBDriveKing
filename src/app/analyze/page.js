"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import AnalysisProgress from "@/components/dashboard/AnalysisProgress";
import ResultsSummary from "@/components/dashboard/ResultsSummary";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import { useYoloBackend } from "@/hooks/useYoloBackend";
import { getUploadedFiles, getAnalysisOptions } from "@/app/page";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hand = searchParams.get("hand") || "right";
  const syncMode = searchParams.get("sync") || "independent";
  const engine = searchParams.get("engine") || "mediapipe";
  const rearRot = parseInt(searchParams.get("rearRot") || "0");
  const sideRot = parseInt(searchParams.get("sideRot") || "0");

  const [rearFile, setRearFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Hidden video elements for processing
  const rearVideoRef = useRef(null);
  const sideVideoRef = useRef(null);
  const reportRef = useRef(null);

  // Analysis hook
  const {
    scoring,
    coaching,
    progress,
    stage,
    currentFrame,
    totalFrames,
    batchAnalyze,
    batchAnalyzeFromLandmarks,
    cancelAnalysis,
    resetAnalysis,
    updateProgress,
    setStage,
  } = useAnalysis(hand);

  // MediaPipe hook
  const {
    ready: mpReady,
    loading: mpLoading,
    initialize: mpInitialize,
    detect: mpDetect,
  } = useMediaPipe();

  // YOLOv11 hook
  const {
    ready: yoloReady,
    error: yoloError,
    checkServer: yoloCheckServer,
    analyzeVideo: yoloAnalyzeVideo,
    cancel: yoloCancel,
  } = useYoloBackend();

  // Load files from global store
  useEffect(() => {
    setMounted(true);
    const files = getUploadedFiles();
    if (files.rearFile) setRearFile(files.rearFile);
    if (files.sideFile) setSideFile(files.sideFile);
  }, []);

  // Auto-start analysis once mounted + engine ready
  useEffect(() => {
    if (!mounted || stage !== "idle") return;
    if (!rearFile && !sideFile) return;

    startAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, rearFile, sideFile]);

  /**
   * Main analysis orchestrator.
   */
  const startAnalysis = useCallback(async () => {
    setAnalysisError(null);
    console.log("[Analyze] Starting analysis engine:", engine);

    if (engine === "yolov11") {
      // --- YOLOv11 Backend Path ---
      setStage("initializing");

      console.log("[YOLO] Checking backend health...");
      const serverOk = await yoloCheckServer();
      if (!serverOk) {
        setAnalysisError(
          "Cannot reach YOLOv11 backend. Please run: python backend/server.py"
        );
        return;
      }

      try {
        let rearFrames = null;
        let sideFrames = null;

        if (rearFile) {
          console.log("[YOLO] Uploading/Analyzing Rear video:", rearFile.name);
          updateProgress({ stage: "uploading", frame: 0, total: 100, pct: 0 });
          
          const result = await yoloAnalyzeVideo(rearFile, (p) => {
            if (p.frame === 0) setStage("processing_rear");
            updateProgress({
              frame: p.frame,
              total: p.totalFrames,
              pct: p.progress * 0.5, // 0-50% for rear
            });
          }, rearRot);
          if (result.success) {
            rearFrames = result.frames;
            console.log("[YOLO] Rear analysis complete:", rearFrames.length, "frames");
          }
        }

        if (sideFile) {
          console.log("[YOLO] Uploading/Analyzing Side video:", sideFile.name);
          updateProgress({ stage: "uploading", frame: 0, total: 100, pct: 50 });
          
          const result = await yoloAnalyzeVideo(sideFile, (p) => {
            if (p.frame === 0) setStage("processing_side");
            updateProgress({
              frame: p.frame,
              total: p.totalFrames,
              pct: 50 + p.progress * 0.4, // 50-90% for side
            });
          }, sideRot);
          if (result.success) {
            sideFrames = result.frames;
            console.log("[YOLO] Side analysis complete:", sideFrames.length, "frames");
          }
        }

        console.log("[YOLO] Scoring composite analysis...");
        updateProgress({ stage: "scoring", pct: 95 });
        batchAnalyzeFromLandmarks(rearFrames, sideFrames);
      } catch (err) {
        console.error("[YOLO] Analysis error:", err);
        setAnalysisError(err.message);
      }
    } else {
      // --- MediaPipe Browser Path ---
      await mpInitialize();

      // Wait for MediaPipe to be ready
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          // The initialize() call resolves when ready, so we just proceed
          clearInterval(interval);
          resolve();
        }, 100);
      });

      // Create hidden video elements for processing
      const rearEl = rearVideoRef.current;
      const sideEl = sideVideoRef.current;

      // Wait for videos to load
      if (rearFile && rearEl) {
        rearEl.src = URL.createObjectURL(rearFile);
        await new Promise((resolve) => {
          rearEl.onloadeddata = resolve;
          rearEl.load();
        });
      }

      if (sideFile && sideEl) {
        sideEl.src = URL.createObjectURL(sideFile);
        await new Promise((resolve) => {
          sideEl.onloadeddata = resolve;
          sideEl.load();
        });
      }

      try {
        await batchAnalyze({
          rearVideoEl: rearFile ? rearEl : null,
          sideVideoEl: sideFile ? sideEl : null,
          detectFn: mpDetect,
          frameSkip: 3,
          rearRotation: rearRot,
          sideRotation: sideRot,
        });
      } catch (err) {
        setAnalysisError(err.message);
      }
    }
  }, [
    engine,
    rearFile,
    sideFile,
    mpInitialize,
    mpDetect,
    yoloCheckServer,
    yoloAnalyzeVideo,
    batchAnalyze,
    batchAnalyzeFromLandmarks,
  ]);

  /**
   * Cancel analysis.
   */
  const handleCancel = useCallback(() => {
    cancelAnalysis();
    if (engine === "yolov11") yoloCancel();
    router.push("/");
  }, [cancelAnalysis, yoloCancel, engine, router]);

  /**
   * Restart (go back to upload).
   */
  const handleRestart = useCallback(() => {
    resetAnalysis();
    router.push("/");
  }, [resetAnalysis, router]);

  /**
   * Download report as PNG.
   * Includes color-conversion patch for Tailwind v4 oklch/oklab compatibility.
   */
  const handleDownloadReport = useCallback(async () => {
    if (!reportRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#0a0e17",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          console.log("[Report] Running Global CSS Cleanse...");
          
          /**
           * html2canvas crashes on any modern CSS colors (oklch/oklab/color-mix).
           * Defining a "Safe Hex" stylesheet specifically for the report.
           */
          const safeCSS = `
            :root {
              --neon-primary: #39FF14 !important;
              --neon-secondary: #00FF87 !important;
              --neon-accent: #00E5FF !important;
              --neon-warning: #FFD700 !important;
              --neon-danger: #FF4444 !important;
              --background: #0a0e17 !important;
              --foreground: #e8edf5 !important;
              --surface: rgba(255,255,255,0.05) !important;
              --glass-bg: rgba(10,14,23,0.9) !important;
              --glass-border: rgba(57,255,20,0.3) !important;
            }
            body, * {
              background-color: var(--background);
              color: var(--foreground);
              -webkit-print-color-adjust: exact !important;
            }
            .glass-card { background: var(--glass-bg) !important; border: 1px solid var(--glass-border) !important; }
            .neon-text { color: var(--neon-primary) !important; filter: none !important; text-shadow: none !important; }
            .radial-gauge-circle { stroke: var(--neon-primary) !important; }
          `;

          // 1. REMOVE all existing stylesheets and style tags (This is the critical step)
          for (const sheet of clonedDoc.styleSheets) {
            sheet.disabled = true;
          }
          const allStyleTags = Array.from(clonedDoc.getElementsByTagName("style"));
          const allLinks = Array.from(clonedDoc.getElementsByTagName("link"));
          allStyleTags.forEach(t => t.parentNode.removeChild(t));
          allLinks.forEach(l => {
              if (l.rel === 'stylesheet') l.parentNode.removeChild(l);
          });

          // 2. Inject our "Sanitized Hex-only" style tag
          const cleanStyle = clonedDoc.createElement("style");
          cleanStyle.innerHTML = safeCSS;
          clonedDoc.head.appendChild(cleanStyle);

          // 3. Bruteforce strip any remaining oklch strings from inline attributes
          const elements = clonedDoc.getElementsByTagName("*");
          const oklchRe = /oklch\([^)]+\)/gi;
          const oklabRe = /oklab\([^)]+\)/gi;
          for (const el of elements) {
            const s = el.getAttribute("style");
            if (s && (s.includes("oklch") || s.includes("oklab"))) {
              el.setAttribute("style", s.replace(oklchRe, "#39FF14").replace(oklabRe, "#39FF14"));
            }
          }
          console.log("[Report] Cleanse complete.");
        }
      });

      // 4. Force Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas data generation failed");
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `PBDriveKing_Analysis_${new Date().toISOString().slice(0, 10)}.png`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }, "image/png");

      console.log("[Report] Download triggered successfully.");
    } catch (err) {
      console.error("Report download failed:", err);
      // Fallback: just take screenshot of viewport
      alert("Report download failed. Please ensure the local backend server is running and try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  if (!mounted) return null;

  // No files → redirect back
  if (!rearFile && !sideFile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <h3 className="text-lg font-semibold text-white/40 mb-4">
            No Videos Uploaded
          </h3>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-neon text-background font-semibold rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Stage: Processing → show progress
  if (stage !== "complete" && stage !== "idle") {
    return (
      <div className="min-h-screen bg-background grid-bg">
        {/* Hidden video elements for processing */}
        <video ref={rearVideoRef} className="hidden" muted playsInline preload="auto" />
        <video ref={sideVideoRef} className="hidden" muted playsInline preload="auto" />

        <AnalysisProgress
          progress={progress}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          stage={stage === "error" ? "error" : stage}
          error={analysisError}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Stage: Complete → show results
  if (stage === "complete") {
    return (
      <ResultsSummary
        scoring={scoring}
        coaching={coaching}
        onRestart={handleRestart}
        onDownloadReport={handleDownloadReport}
        reportRef={reportRef}
        isDownloading={isDownloading}
      />
    );
  }

  // Stage: Idle (just loaded, waiting for analysis to start)
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
      <video ref={rearVideoRef} className="hidden" muted playsInline preload="auto" />
      <video ref={sideVideoRef} className="hidden" muted playsInline preload="auto" />
      <AnalysisProgress
        progress={0}
        stage="initializing"
        currentFrame={0}
        totalFrames={0}
      />
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-neon animate-pulse text-lg">Loading…</div>
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
