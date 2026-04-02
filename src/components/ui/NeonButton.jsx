export default function NeonButton({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#39FF14]/50 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#39FF14] text-[#0a0e17] hover:bg-[#45ff28] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] active:scale-95",
    secondary:
      "bg-transparent border border-[rgba(57,255,20,0.4)] text-[#39FF14] hover:bg-[rgba(57,255,20,0.08)] hover:border-[#39FF14] active:scale-95",
    ghost:
      "bg-transparent text-[#39FF14] hover:bg-[rgba(57,255,20,0.08)] active:scale-95",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-base gap-2",
    lg: "px-8 py-3.5 text-lg gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
