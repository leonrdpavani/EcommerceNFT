import { cn } from "cn"

export function RareBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex h-8 items-center bg-brand px-3 text-[13px] font-medium tracking-wide text-ink uppercase lg:h-7 lg:px-3.5 lg:text-[15px]",
        className
      )}
    >
      Raro
    </span>
  )
}
