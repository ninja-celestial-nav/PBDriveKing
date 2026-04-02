"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Target,
  RotateCw,
  Undo2,
  Accessibility,
  ArrowRight,
  MoveRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Crosshair,
} from "lucide-react";
import NeonBadge from "../ui/NeonBadge";

const ICON_MAP = {
  Target,
  RotateCw,
  Undo2,
  Accessibility,
  ArrowRight,
  MoveRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Crosshair,
};

const SEVERITY_CONFIG = {
  optimal: {
    border: "border-[rgba(57,255,20,0.3)]",
    bg: "bg-[rgba(57,255,20,0.04)]",
    iconColor: "text-[#39FF14]",
    barColor: "bg-[#39FF14]",
  },
  warning: {
    border: "border-[rgba(255,215,0,0.3)]",
    bg: "bg-[rgba(255,215,0,0.04)]",
    iconColor: "text-[#FFD700]",
    barColor: "bg-[#FFD700]",
  },
  critical: {
    border: "border-[rgba(255,68,68,0.3)]",
    bg: "bg-[rgba(255,68,68,0.04)]",
    iconColor: "text-[#FF4444]",
    barColor: "bg-[#FF4444]",
  },
  info: {
    border: "border-[rgba(0,229,255,0.2)]",
    bg: "bg-[rgba(0,229,255,0.04)]",
    iconColor: "text-[#00E5FF]",
    barColor: "bg-[#00E5FF]",
  },
};

export default function MetricCard({ card, score, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const severity = card?.severity || "info";
  const config = SEVERITY_CONFIG[severity];
  const IconComponent = ICON_MAP[card?.icon] || Info;

  const animDelay = `${index * 100}ms`;

  return (
    <div
      className={`rounded-xl border ${config.border} ${config.bg} transition-all duration-300 hover:scale-[1.01] animate-slide-in-up`}
      style={{ animationDelay: animDelay }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.bg} ${config.iconColor}`}
        >
          <IconComponent size={18} />
        </div>

        {/* Title & Value */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-white truncate">
              {card?.title || card?.label}
            </h4>
            <NeonBadge severity={severity}>
              {severity === "optimal"
                ? "✓ Good"
                : severity === "warning"
                ? "⚠ Adjust"
                : severity === "critical"
                ? "✗ Fix"
                : "—"}
            </NeonBadge>
          </div>
          <p className="text-[11px] text-white/40">{card?.label}</p>
        </div>

        {/* Value */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-bold ${config.iconColor}`}>
            {card?.value || "—"}
          </span>

          {/* Score mini-bar */}
          {score !== null && score !== undefined && (
            <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${config.barColor} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          )}

          {/* Expand toggle */}
          <span className="text-white/30">
            {expanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Feedback */}
          <p className="text-sm text-white/70 leading-relaxed">
            {card?.feedback}
          </p>

          {/* Drill */}
          {card?.drill && (
            <div className="flex gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <Crosshair
                size={14}
                className="flex-shrink-0 mt-0.5 text-neon-accent"
              />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neon-accent/70 mb-1 font-semibold">
                  Recommended Drill
                </p>
                <p className="text-xs text-white/60 leading-relaxed">
                  {card.drill}
                </p>
              </div>
            </div>
          )}

          {/* Cue */}
          {card?.cue && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                Cue:
              </span>
              <span className="text-xs text-white/50 italic">
                &ldquo;{card?.cue}&rdquo;
              </span>
            </div>
          )}

          {/* View indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-white/20">
              Measured from
            </span>
            <span className="text-[9px] uppercase tracking-wider text-neon/50 font-semibold">
              {card?.view} camera
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
