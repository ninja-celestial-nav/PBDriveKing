"use client";

import { useState } from "react";
import {
  Trophy,
  AlertTriangle,
  Crosshair,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  RotateCw,
  Download,
  Zap,
  Target,
  TrendingUp,
  Activity,
  CheckCircle,
  BarChart3,
  Waves,
  RefreshCw,
} from "lucide-react";
import RadialGauge from "../ui/RadialGauge";
import NeonBadge from "../ui/NeonBadge";
import NeonButton from "../ui/NeonButton";
import GlassCard from "../ui/GlassCard";
import MetricCard from "./MetricCard";

export default function ResultsSummary({
  scoring,
  coaching,
  onRestart,
  onDownloadReport,
  reportRef,
  isDownloading = false,
}) {
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  if (!scoring || !coaching) return null;

  // Sort coaching by priority: critical first, then warning, then optimal
  const sortedCoaching = [...coaching].sort((a, b) => {
    const order = { critical: 0, warning: 1, optimal: 2, info: 3 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  // Top 3 priorities (non-optimal)
  const priorities = sortedCoaching.filter(
    (c) => c.severity === "critical" || c.severity === "warning"
  ).slice(0, 3);

  // Stats
  const optimalCount = coaching.filter((c) => c.severity === "optimal").length;
  const warningCount = coaching.filter((c) => c.severity === "warning").length;
  const criticalCount = coaching.filter((c) => c.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <NeonButton variant="ghost" size="sm" onClick={onRestart}>
            <ArrowLeft size={16} />
          </NeonButton>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neon/10 flex items-center justify-center">
              <Zap size={14} className="text-neon" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              <span className="neon-text">PB</span>
              <span className="text-white">DriveKing</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NeonButton 
            variant="secondary" 
            size="sm" 
            onClick={onDownloadReport}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {isDownloading ? "Generating..." : "Download Report"}
          </NeonButton>
          <NeonButton variant="ghost" size="sm" onClick={onRestart}>
            <RotateCw size={14} />
            New Analysis
          </NeonButton>
        </div>
      </header>

      {/* Report Content (captured for PDF) */}
      <div ref={reportRef} className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/5 border border-neon/15">
            <Trophy size={14} className="text-neon" />
            <span className="text-[11px] text-neon/70 font-medium tracking-wide">
              Analysis Complete
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Your Drive Analysis Report
          </h1>
        </div>

        {/* Overall Results Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quality Score */}
          <GlassCard className="flex flex-col items-center py-8" glow>
            <RadialGauge
              value={scoring.composite}
              max={100}
              size={180}
              strokeWidth={12}
              color="auto"
              showGrade={true}
            />
            <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-wider">
              Overall Drive Quality
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14]" />
                <span className="text-xs text-white/50">
                  {optimalCount} Optimal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
                <span className="text-xs text-white/50">
                  {warningCount} Adjust
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4444]" />
                <span className="text-xs text-white/50">
                  {criticalCount} Critical
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Session Consistency */}
          <GlassCard className="flex flex-col items-center py-8" glow>
            <div className="relative">
              <RadialGauge
                value={scoring.consistency || 0}
                max={100}
                size={180}
                strokeWidth={12}
                color="#00E5FF"
                showGrade={false}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-white">{scoring.swingsCount || 1}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Swings</span>
              </div>
            </div>
            
            <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-wider">
              Technique Consistency
            </p>

            <div className="mt-6 pt-4 border-t border-white/5 w-full px-8 text-center">
              <div className="flex items-center justify-center gap-2 text-neon-accent">
                <BarChart3 size={14} />
                <span className="text-xs font-semibold">
                  {scoring.consistency >= 90 ? "Master Level" : 
                   scoring.consistency >= 75 ? "Highly Repeatable" : 
                   scoring.consistency >= 50 ? "Developing Pattern" : "Inconsistent"}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* View Specific Grades (if both present) */}
        {scoring.rearScore && scoring.sideScore && (
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 flex items-center justify-between border-neon/20">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-1">Rear View Grade</p>
                <p className="text-xl font-bold text-white uppercase">{scoring.rearScore >= 85 ? 'Optimal' : scoring.rearScore >= 50 ? 'Developing' : 'Critical'}</p>
              </div>
              <div className="text-2xl font-black neon-text opacity-50">{scoring.rearScore}%</div>
            </div>
            <div className="glass-card p-4 flex items-center justify-between border-neon-secondary/20">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-1">Side View Grade</p>
                <p className="text-xl font-bold text-white uppercase">{scoring.sideScore >= 85 ? 'Optimal' : scoring.sideScore >= 50 ? 'Developing' : 'Critical'}</p>
              </div>
              <div className="text-2xl font-black text-neon-secondary opacity-50">{scoring.sideScore}%</div>
            </div>
          </div>
        )}

        {/* View Specific Breakdown */}
        <div className="space-y-8">
          {/* REAR VIEW SECTION */}
          {coaching.some(c => c.view === 'rear') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neon/5 border border-neon/10 w-fit">
                <RotateCw size={14} className="text-neon/70" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white/70">
                  View 1: Rear Camera Analysis
                </h2>
              </div>
              <div className="grid gap-3">
                {coaching.filter(c => c.view === 'rear').map((card, i) => (
                  <GlassCard key={card.metric} className="flex gap-4 p-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                        <NeonBadge severity={card.severity}>{card.value}</NeonBadge>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed italic border-l-2 border-neon/30 pl-3">"{card.feedback}"</p>
                      {card.cue && (
                        <p className="mt-2 text-[11px] text-neon/60 font-medium">Coach's Cue: {card.cue}</p>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* SIDE VIEW SECTION */}
          {coaching.some(c => c.view === 'side') && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neon-secondary/5 border border-neon-secondary/10 w-fit">
                <Target size={14} className="text-neon-secondary/70" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white/70">
                  View 2: Side Camera Analysis
                </h2>
              </div>
              <div className="grid gap-3">
                {coaching.filter(c => c.view === 'side').map((card, i) => (
                  <GlassCard key={card.metric} className="flex gap-4 p-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                        <NeonBadge severity={card.severity}>{card.value}</NeonBadge>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed italic border-l-2 border-neon-secondary/30 pl-3">"{card.feedback}"</p>
                      {card.drill && (
                        <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                           <p className="text-[10px] uppercase tracking-wider text-neon-accent/50 mb-1 font-semibold">Recommended Drill</p>
                           <p className="text-[11px] text-white/40">{card.drill}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* All Metrics (optional) */}
        {optimalCount > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-neon" />
              <h2 className="text-lg font-bold text-white">
                What You&apos;re Doing Well
              </h2>
            </div>
            <div className="grid gap-2">
              {sortedCoaching
                .filter((c) => c.severity === "optimal")
                .map((card) => (
                  <div
                    key={card.metric}
                    className="flex items-center gap-3 glass-card px-4 py-3"
                  >
                    <CheckCircle size={16} className="text-neon flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white/70">
                        {card.label}
                      </span>
                      <span className="text-xs text-white/30 ml-2">
                        — {card.title}
                      </span>
                    </div>
                    <NeonBadge severity="optimal">{card.value}</NeonBadge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Full Metric Breakdown (expandable) */}
        <div className="space-y-4">
          <button
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <Activity size={16} />
            <span className="text-sm font-bold">Full Metric Breakdown</span>
            {showAllMetrics ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>

          {showAllMetrics && (
            <div className="space-y-3">
              {sortedCoaching.map((card, index) => (
                <MetricCard
                  key={card.metric}
                  card={card}
                  score={scoring?.scores?.[card.metric] ?? null}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Coach's Summary */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Waves size={16} className="text-neon" />
            <h2 className="text-lg font-bold text-white">
              Coach&apos;s Session Verdict
            </h2>
          </div>
          <div className="space-y-4 text-sm text-white/60 leading-relaxed">
            <p className="text-white/80 font-medium">
              After watching all {scoring.swingsCount} swings in your session, here is my takeaway:
            </p>
            {scoring.composite >= 85 ? (
              <p>
                <span className="text-neon font-semibold">Excellent form!</span>{" "}
                Your drive mechanics are solid. Focus on consistency and minor
                refinements to take your game to the next level.
              </p>
            ) : scoring.composite >= 70 ? (
              <p>
                <span className="text-neon-warning font-semibold">
                  Good foundation!
                </span>{" "}
                You have solid basics but there are {priorities.length} key area
                {priorities.length !== 1 ? "s" : ""} to improve. Focus on the
                priority drills above — they&apos;ll give you the biggest
                performance boost.
              </p>
            ) : scoring.composite >= 50 ? (
              <p>
                <span className="text-neon-warning font-semibold">
                  Room for growth!
                </span>{" "}
                Several mechanics need attention. Start with the #1 priority
                above and practice that drill for a week before moving to the
                next.
              </p>
            ) : (
              <p>
                <span className="text-neon-danger font-semibold">
                  Back to basics.
                </span>{" "}
                Focus on fundamentals. Work on one drill at a time, starting
                with contact point and knee bend. Record yourself again after a
                week of practice.
              </p>
            )}
            <p className="text-white/30 text-xs italic">
              Tip: Re-record your drive after practicing the recommended drills
              and analyze again to track your improvement.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
