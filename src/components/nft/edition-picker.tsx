import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { cn } from "cn"

import type { Edition } from "@/types/domain"

interface EditionPickerProps {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
  className?: string
}

export function EditionPicker({ editions, value, onChange, className }: EditionPickerProps) {
  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="mb-3 text-[15px] leading-4 font-bold text-cream">Edição:</legend>
      <RadioGroupPrimitive.Root
        value={value}
        onValueChange={onChange}
        className="flex flex-wrap items-center gap-1.5 max-lg:gap-3"
        aria-label="Edição"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroupPrimitive.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              aria-label={soldOut ? `${edition.label} (esgotada)` : edition.label}
              className={cn(
                "inline-flex h-7 min-w-9 cursor-pointer items-center justify-center rounded-full border border-line-soft px-1.5 text-sm leading-4 text-sand transition-colors outline-none hover:border-brand/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text",
                "data-[state=checked]:border-brand data-[state=checked]:font-medium data-[state=checked]:text-brand-text",
                "disabled:cursor-not-allowed disabled:border-line disabled:text-taupe/60 disabled:line-through",
                edition.supply === null && "px-2"
              )}
            >
              {edition.label}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
    </fieldset>
  )
}
