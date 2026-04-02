export default function GlassCard({ children, className = "", glow = false, ...props }) {
  return (
    <div
      className={`glass-card p-6 ${glow ? "animate-pulse-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
