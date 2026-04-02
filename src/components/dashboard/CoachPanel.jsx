"use client";

import { Activity, Zap } from "lucide-react";
import OverallScore from "./OverallScore";
import MetricCard from "./MetricCard";

export default function CoachPanel({ scoring, coaching }) {
  const hasResults = coaching && coaching.length > 0;

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={18} className="text-neon" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Coach&apos;s Panel
          </h2>
        </div>
        <p className="text-[11px] text-white/30">
          AI-powered biomechanical feedback
        </p>
      </div>

      {/* Score */}
      {hasResults && (
        <div className="flex-shrink-0 py-5 border-b border-white/5 flex justify-center">
          <OverallScore
            score={scoring?.composite || 0}
            grade={scoring?.grade || "—"}
          />
        </div>
      )}

      {/* Metric Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasResults ? (
          coaching.map((card, index) => (
            <MetricCard
              key={card.metric}
              card={card}
              score={scoring?.scores?.[card.metric] ?? null}
              index={index}
            />
          ))
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Activity size={28} className="text-white/15" />
            </div>
            <h3 className="text-sm font-semibold text-white/30 mb-1">
              No Analysis Yet
            </h3>
            <p className="text-xs text-white/20 max-w-[200px] leading-relaxed">
              Upload videos and pause playback to analyze your swing mechanics.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {hasResults && (
        <div className="flex-shrink-0 p-3 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] text-white/20">
            <span>
              {coaching.filter((c) => c.severity === "optimal").length}/
              {coaching.length} metrics optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon" />
              Live Analysis
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
