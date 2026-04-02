"use client";

import RadialGauge from "../ui/RadialGauge";

export default function OverallScore({ score = 0, grade = "—" }) {
  return (
    <div className="flex flex-col items-center gap-2 animate-score-reveal">
      <RadialGauge
        value={score}
        max={100}
        size={140}
        strokeWidth={10}
        color="auto"
        showGrade={true}
        label="Overall Drive Score"
      />
    </div>
  );
}
