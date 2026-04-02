"use client";

import { useRef, useEffect, useCallback } from "react";
import { LANDMARKS } from "@/lib/mediapipe/landmark-utils";

// Skeleton connections for drawing
const POSE_CONNECTIONS = [
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_ELBOW],
  [LANDMARKS.LEFT_ELBOW, LANDMARKS.LEFT_WRIST],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_ELBOW],
  [LANDMARKS.RIGHT_ELBOW, LANDMARKS.RIGHT_WRIST],
  [LANDMARKS.LEFT_SHOULDER, LANDMARKS.LEFT_HIP],
  [LANDMARKS.RIGHT_SHOULDER, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP],
  [LANDMARKS.LEFT_HIP, LANDMARKS.LEFT_KNEE],
  [LANDMARKS.LEFT_KNEE, LANDMARKS.LEFT_ANKLE],
  [LANDMARKS.RIGHT_HIP, LANDMARKS.RIGHT_KNEE],
  [LANDMARKS.RIGHT_KNEE, LANDMARKS.RIGHT_ANKLE],
];

/**
 * Draws pose skeleton on a canvas overlay.
 */
export default function SkeletonOverlay({
  landmarks,
  width,
  height,
  metricSeverities = {},
  visible = true,
}) {
  const canvasRef = useRef(null);

  const getJointColor = useCallback(
    (index) => {
      // Map landmark indices to metric severities for color coding
      const mapping = {
        [LANDMARKS.LEFT_SHOULDER]: metricSeverities.unitTurn,
        [LANDMARKS.RIGHT_SHOULDER]: metricSeverities.unitTurn,
        [LANDMARKS.LEFT_WRIST]: metricSeverities.contactPoint || metricSeverities.backswing,
        [LANDMARKS.RIGHT_WRIST]: metricSeverities.contactPoint || metricSeverities.backswing,
        [LANDMARKS.LEFT_KNEE]: metricSeverities.kneeBend,
        [LANDMARKS.RIGHT_KNEE]: metricSeverities.kneeBend,
        [LANDMARKS.LEFT_HIP]: metricSeverities.weightTransfer,
        [LANDMARKS.RIGHT_HIP]: metricSeverities.weightTransfer,
      };

      const severity = mapping[index];
      if (severity === "optimal") return "#39FF14";
      if (severity === "warning") return "#FFD700";
      if (severity === "critical") return "#FF4444";
      return "#00E5FF"; // Default: cyan
    },
    [metricSeverities]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks || !visible) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    ctx.lineWidth = 2.5;
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (!start || !end) return;
      if ((start.visibility || 0) < 0.3 || (end.visibility || 0) < 0.3) return;

      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
      ctx.shadowColor = "rgba(0, 229, 255, 0.4)";
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw joints
    landmarks.forEach((lm, index) => {
      if (!lm || (lm.visibility || 0) < 0.3) return;
      // Only draw major joints
      if (index > 32 || (index >= 1 && index <= 10)) return;

      const x = lm.x * width;
      const y = lm.y * height;
      const color = getJointColor(index);
      const radius = index === LANDMARKS.NOSE ? 5 : 4;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [landmarks, width, height, visible, getJointColor]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
}
