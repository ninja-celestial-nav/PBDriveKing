"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Activity,
  Camera,
  Video,
  ChevronRight,
  Target,
  Eye,
  Brain,
  Link2,
  Unlink2,
  Cpu,
  Server,
} from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import GlassCard from "@/components/ui/GlassCard";
import UploadZone from "@/components/landing/UploadZone";

// Store files + options globally so they survive navigation
let _rearFile = null;
let _sideFile = null;
let _options = { hand: "right", syncMode: "independent", engine: "mediapipe", rearRot: 0, sideRot: 0 };

export function getUploadedFiles() {
  return { rearFile: _rearFile, sideFile: _sideFile };
}

export function getAnalysisOptions() {
  return _options;
}

export default function HomePage() {
  const router = useRouter();
  const [rearFile, setRearFile] = useState(null);
  const [sideFile, setSideFile] = useState(null);
  const [rearRot, setRearRot] = useState(0);
  const [sideRot, setSideRot] = useState(0);
  const [hand, setHand] = useState("right");
  const [syncMode, setSyncMode] = useState("independent"); // "independent" | "synchronized"
  const [engine, setEngine] = useState("mediapipe"); // "mediapipe" | "yolov11"

  const handleRearFile = useCallback((file, rot) => {
    setRearFile(file);
    setRearRot(rot);
    _rearFile = file;
  }, []);

  const handleSideFile = useCallback((file, rot) => {
    setSideFile(file);
    setSideRot(rot);
    _sideFile = file;
  }, []);

  const canAnalyze = rearFile || sideFile;

  const handleAnalyze = () => {
    _rearFile = rearFile;
    _sideFile = sideFile;
    _options = { hand, syncMode, engine, rearRot, sideRot };
    
    // Add warning if sync is selected but only 1 file
    if (syncMode === "synchronized" && (!rearFile || !sideFile)) {
      setSyncMode("independent");
    }
    
    router.push(`/analyze?hand=${hand}&sync=${syncMode}&engine=${engine}&rearRot=${rearRot}&sideRot=${sideRot}`);
  };

  const features = [
    {
      icon: Brain,
      title: "AI Pose Detection",
      desc: "MediaPipe + YOLOv11 dual engine",
    },
    {
      icon: Target,
      title: "7 Key Metrics",
      desc: "Contact point, unit turn, knee bend & more",
    },
    {
      icon: Activity,
      title: "Real-Time Analysis",
      desc: "Frame-by-frame processing with progress tracking",
    },
    {
      icon: Eye,
      title: "Dual Camera Views",
      desc: "Independent or synchronized analysis",
    },
  ];

  // Toggle button helper
  const ToggleButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-neon/15 text-neon"
          : "text-white/30 hover:text-white/50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full bg-neon/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[10%] w-[400px] h-[400px] rounded-full bg-neon-secondary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
            <Zap size={18} className="text-neon" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="neon-text">PB</span>
            <span className="text-white">DriveKing</span>
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold">
          AI Swing Analyzer
        </span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/5 border border-neon/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            <span className="text-[11px] text-neon/70 font-medium tracking-wide">
              Powered by MediaPipe + YOLOv11
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-white">Analyze Your</span>
            <br />
            <span className="neon-text animate-neon-flicker">
              Pickleball Drive
            </span>
          </h1>

          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            Upload rear and side camera footage. Our AI will track your body
            mechanics, score your technique, and give you{" "}
            <span className="text-neon/70">pro-level coaching tips</span>.
          </p>
        </div>

        {/* Upload Section */}
        <GlassCard className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Video size={16} className="text-neon" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Upload Your Footage
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <UploadZone
              label="Rear Camera View"
              onFileSelected={handleRearFile}
              icon={Camera}
            />
            <UploadZone
              label="Side Camera View"
              onFileSelected={handleSideFile}
              icon={Camera}
            />
          </div>

          {/* Options Row */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
            {/* Row 1: Hand + Sync Mode + Engine */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Dominant Hand */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  Hand
                </span>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <ToggleButton
                    active={hand === "right"}
                    onClick={() => setHand("right")}
                  >
                    Right
                  </ToggleButton>
                  <div className="w-px bg-white/10" />
                  <ToggleButton
                    active={hand === "left"}
                    onClick={() => setHand("left")}
                  >
                    Left
                  </ToggleButton>
                </div>
              </div>

              {/* Sync Mode */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  Video Mode
                </span>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <ToggleButton
                    active={syncMode === "independent"}
                    onClick={() => setSyncMode("independent")}
                  >
                    <span className="flex items-center gap-1">
                      <Unlink2 size={12} />
                      Independent
                    </span>
                  </ToggleButton>
                  <div className="w-px bg-white/10" />
                  <ToggleButton
                    active={syncMode === "synchronized"}
                    onClick={() => setSyncMode("synchronized")}
                  >
                    <span className="flex items-center gap-1">
                      <Link2 size={12} />
                      Synced
                    </span>
                  </ToggleButton>
                </div>
              </div>

              {/* Detection Engine */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  Engine
                </span>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <ToggleButton
                    active={engine === "mediapipe"}
                    onClick={() => setEngine("mediapipe")}
                  >
                    <span className="flex items-center gap-1">
                      <Cpu size={12} />
                      MediaPipe
                    </span>
                  </ToggleButton>
                  <div className="w-px bg-white/10" />
                  <ToggleButton
                    active={engine === "yolov11"}
                    onClick={() => setEngine("yolov11")}
                  >
                    <span className="flex items-center gap-1">
                      <Server size={12} />
                      YOLOv11
                    </span>
                  </ToggleButton>
                </div>
              </div>
            </div>

            {/* Engine Info */}
            {engine === "yolov11" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-accent/5 border border-neon-accent/15">
                <Server size={14} className="text-neon-accent/60" />
                <span className="text-[11px] text-neon-accent/60">
                  YOLOv11 requires the Python backend to be running on{" "}
                  <code className="text-neon-accent/80">localhost:8000</code>.
                  Run <code className="text-neon-accent/80">python backend/server.py</code>
                </span>
              </div>
            )}

            {/* Sync Info */}
            {syncMode === "independent" && rearFile && sideFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <Unlink2 size={14} className="text-white/30" />
                <span className="text-[11px] text-white/30">
                  Dual-Camera Mode Active. Analysis will review REAR then SIDE views sequentially.
                </span>
              </div>
            )}

            {/* Error/Warning for Sync Mode with 1 file */}
            {syncMode === "synchronized" && (!rearFile || !sideFile) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-warning/5 border border-neon-warning/15">
                <Link2 size={14} className="text-neon-warning/60" />
                <span className="text-[11px] text-neon-warning/60">
                   Sync mode requires both videos. Switch to Independent or upload a second video.
                </span>
              </div>
            )}
            
            {/* Accuracy Boost Info */}
            {rearFile && sideFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon/5 border border-neon/15">
                <Zap size={14} className="text-neon/70" />
                <span className="text-[11px] text-neon/70 font-medium">
                   Accuracy Boost: +30% Biomechanical Precision (Dual-View Data)
                </span>
              </div>
            )}

            {(rearFile && !sideFile) || (!rearFile && sideFile) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Camera size={14} className="text-white/40" />
                <span className="text-[11px] text-white/40">
                   Single-View Analysis Active. Upload a second view for full kinetic chain metrics.
                </span>
              </div>
            )}

            {/* CTA */}
            <div className="flex justify-end">
              <NeonButton
                size="lg"
                disabled={!canAnalyze}
                onClick={handleAnalyze}
              >
                <Activity size={18} />
                Analyze My Drive
                <ChevronRight size={16} />
              </NeonButton>
            </div>
          </div>
        </GlassCard>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass-card p-4 text-center animate-slide-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-neon/5 flex items-center justify-center mx-auto mb-3">
                <feature.icon size={18} className="text-neon/50" />
              </div>
              <h3 className="text-xs font-semibold text-white/70 mb-1">
                {feature.title}
              </h3>
              <p className="text-[10px] text-white/30 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-white/5">
        <p className="text-[10px] text-white/15">
          PBDriveKing © 2026 — Built with Next.js + MediaPipe + YOLOv11
        </p>
      </footer>
    </div>
  );
}
