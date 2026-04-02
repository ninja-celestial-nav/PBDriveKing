const severityStyles = {
  optimal: "bg-[rgba(57,255,20,0.15)] text-[#39FF14] border-[rgba(57,255,20,0.3)]",
  warning: "bg-[rgba(255,215,0,0.15)] text-[#FFD700] border-[rgba(255,215,0,0.3)]",
  critical: "bg-[rgba(255,68,68,0.15)] text-[#FF4444] border-[rgba(255,68,68,0.3)]",
  info: "bg-[rgba(0,229,255,0.15)] text-[#00E5FF] border-[rgba(0,229,255,0.3)]",
};

export default function NeonBadge({ severity = "info", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${severityStyles[severity]} ${className}`}
    >
      {children}
    </span>
  );
}
