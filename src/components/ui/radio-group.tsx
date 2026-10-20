import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer relative flex aspect-square size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.2px] border-brand bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-coral",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-full bg-brand"
      />
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
