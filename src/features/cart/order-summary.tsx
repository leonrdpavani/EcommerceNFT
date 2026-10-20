import type Decimal from "decimal.js"
import { cn } from "cn"

import { formatEth } from "@/lib/format"

export interface SummaryValues {
  subtotal: Decimal
  discount: Decimal
  fee: Decimal
  total: Decimal
}

/** Linhas de subtotal, desconto, taxa e total — compartilhadas entre carrinho e pagamento. */
export function SummaryLines({
  values,
  size = "lg",
  feeNoteAlign = "end",
  className,
}: {
  values: SummaryValues
  size?: "lg" | "md"
  feeNoteAlign?: "end" | "center"
  className?: string
}) {
  const valueSize = size === "lg" ? "text-lg leading-4" : "text-base leading-4"
  return (
    <dl className={cn("flex flex-col gap-3 text-[15px] text-cream", className)}>
      <div className="flex items-start justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className={valueSize}>{formatEth(values.subtotal)}</dd>
      </div>
      <div className="flex items-start justify-between gap-4">
        <dt>Desconto do lançamento</dt>
        <dd>
          {values.discount.isZero() ? (
            "(-) 00.00"
          ) : (
            <>
              <span className="sr-only">menos </span>(-) {formatEth(values.discount)}
            </>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <dt>Taxa de rede</dt>
          <dd className={valueSize}>{formatEth(values.fee)}</dd>
        </div>
        <p className={cn("text-xs leading-4 text-brand-text", feeNoteAlign === "end" ? "text-right" : "text-center")}>
          Taxa estimada
        </p>
      </div>
    </dl>
  )
}

export function SummaryTotal({ total, className }: { total: Decimal; className?: string }) {
  return (
    <p className={cn("flex items-start justify-between gap-4 leading-4 font-bold", className)}>
      <span className="text-base text-cream">Total</span>
      <span className="text-lg text-brand-text">{formatEth(total)}</span>
    </p>
  )
}
