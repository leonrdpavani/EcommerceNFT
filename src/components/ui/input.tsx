import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xs border border-line bg-transparent px-3 text-[15px] text-cream transition-colors outline-none placeholder:text-sm placeholder:text-taupe hover:border-line-soft focus-visible:border-brand focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-coral",
        className
      )}
      {...props}
    />
  )
}

export { Input }
