import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "cn"

type StepperSize = "lg" | "md" | "circle"

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max: number
  size?: StepperSize
  /** Nome do item, usado nos rótulos acessíveis ("Aumentar quantidade de …"). */
  itemName?: string
  className?: string
}

const buttonStyles: Record<StepperSize, string> = {
  lg: "h-[49.5px] w-[33px] rounded-full border border-ink bg-brand text-ink shadow-button [&_svg]:size-6",
  md: "h-[30px] w-5 rounded-full border border-ink bg-brand text-ink shadow-button [&_svg]:size-3.5",
  circle: "size-6 rounded-full border border-line bg-surface-raised text-cream [&_svg]:size-3.5",
}

const valueStyles: Record<StepperSize, string> = {
  lg: "min-w-6 text-xl leading-7",
  md: "min-w-5 text-[17px] leading-6",
  circle: "min-w-5 text-base leading-[22px]",
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  itemName,
  className,
}: QuantityStepperProps) {
  const suffix = itemName ? ` de ${itemName}` : ""
  return (
    <div className={cn("flex items-center gap-3", className)} role="group" aria-label={`Quantidade${suffix}`}>
      <button
        type="button"
        className={cn(
          "flex cursor-pointer items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
          buttonStyles[size],
          size === "circle" && "bg-transparent"
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Diminuir quantidade${suffix}`}
      >
        <MinusIcon strokeWidth={2.5} aria-hidden="true" />
      </button>
      <output className={cn("text-center text-cream tabular-nums", valueStyles[size])} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={cn(
          "flex cursor-pointer items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
          buttonStyles[size]
        )}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Aumentar quantidade${suffix}`}
      >
        <PlusIcon strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}
