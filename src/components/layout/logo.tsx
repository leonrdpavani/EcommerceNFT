import { Link } from "@tanstack/react-router"
import { cn } from "cn"

export function Logo({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  return (
    <Link
      to="/"
      className={cn(
        "inline-flex items-center font-bold text-cream uppercase",
        size === "sm" ? "text-sm tracking-[1.4px]" : "text-[32px] tracking-[3.2px]",
        className
      )}
      aria-label="Kurio — página inicial"
    >
      Kurio
    </Link>
  )
}
