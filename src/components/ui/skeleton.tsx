import { cn } from "cn"

/** Skeleton com efeito shimmer; o movimento é desativado com prefers-reduced-motion. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--kurio-surface-card)_25%,var(--kurio-surface-dark)_50%,var(--kurio-surface-card)_75%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
