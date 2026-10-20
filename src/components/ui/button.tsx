import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-transparent font-bold whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-text",
        outline: "border-brand bg-transparent font-medium text-brand-text hover:bg-brand/10",
        cta: "bg-gradient-cta text-primary-foreground hover:brightness-110",
        secondary: "border-line bg-surface-raised font-medium text-cream hover:border-line-soft hover:bg-surface-dark",
        ghost: "font-medium text-cream hover:bg-surface-raised",
        destructive: "bg-coral/15 text-coral hover:bg-coral/25",
        link: "h-auto border-0 p-0 font-normal text-brand-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-md px-4 text-sm",
        sm: "h-8 rounded-md px-3 text-sm",
        lg: "h-[45px] rounded-sm px-6 text-base",
        xl: "h-[60px] rounded-4xl px-8 text-base",
        icon: "size-10 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-round": "size-[35px] rounded-full",
      },
    },
    compoundVariants: [{ variant: "link", class: "h-auto px-0" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
