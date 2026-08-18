export function Logo({ variant = "dark", className = "" }: { variant?: "dark" | "light"; className?: string }) {
  const color = variant === "light" ? "text-white" : "text-primary";
  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`font-display text-2xl font-semibold tracking-wide ${color}`}>
        EliteStay
      </span>
    </div>
  );
}
