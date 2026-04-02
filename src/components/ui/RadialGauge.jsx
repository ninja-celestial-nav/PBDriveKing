"use client";

import { useEffect, useRef } from "react";

export default function RadialGauge({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label = "",
  color = "#39FF14",
  showGrade = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const animatedValue = useRef(0);
  const animationRef = useRef(null);

  const getGrade = (val) => {
    if (val >= 95) return "A+";
    if (val >= 90) return "A";
    if (val >= 85) return "B+";
    if (val >= 80) return "B";
    if (val >= 70) return "C+";
    if (val >= 60) return "C";
    return "D";
  };

  const getColor = (val) => {
    if (val >= 80) return "#39FF14";
    if (val >= 60) return "#FFD700";
    return "#FF4444";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - strokeWidth - 4;
    const startAngle = Math.PI * 0.75;
    const totalAngle = Math.PI * 1.5;
    const targetValue = Math.min(value, max);

    const animate = () => {
      const diff = targetValue - animatedValue.current;
      animatedValue.current += diff * 0.08;

      if (Math.abs(diff) < 0.1) {
        animatedValue.current = targetValue;
      }

      ctx.clearRect(0, 0, size, size);

      // Background arc
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + totalAngle);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      // Value arc
      const progress = animatedValue.current / max;
      const activeColor = color === "auto" ? getColor(animatedValue.current) : color;
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + totalAngle * progress);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center text
      if (showGrade) {
        const grade = getGrade(animatedValue.current);
        ctx.fillStyle = activeColor;
        ctx.font = `bold ${size * 0.25}px var(--font-outfit), system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(grade, center, center - 4);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${size * 0.12}px var(--font-outfit), system-ui`;
        ctx.fillText(Math.round(animatedValue.current) + "/" + max, center, center + size * 0.16);
      } else {
        ctx.fillStyle = activeColor;
        ctx.font = `bold ${size * 0.22}px var(--font-mono), monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(animatedValue.current) + "°", center, center);
      }

      if (Math.abs(diff) > 0.1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, max, size, strokeWidth, color, showGrade]);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="drop-shadow-lg"
      />
      {label && (
        <span className="text-xs text-white/50 font-medium tracking-wide uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
