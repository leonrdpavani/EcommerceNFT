import Decimal from "decimal.js"
import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import { formatEth } from "@/lib/format"
import type { EthAmount } from "@/types/domain"

type Amount = EthAmount | Decimal

export interface SummaryValues {
  subtotal: Amount
  discount: Amount
  networkFee: Amount
  total: Amount
}

/** Linhas de subtotal, desconto, taxa e total — compartilhadas entre carrinho e pagamento. */
export function SummaryLines({
  values,
  couponCode,
  size = "lg",
  feeNoteAlign = "end",
  className,
}: {
  values: SummaryValues
  couponCode?: string | null
  size?: "lg" | "md"
  feeNoteAlign?: "end" | "center"
  className?: string
}) {
  const valueSize = size === "lg" ? "text-lg leading-4" : "text-base leading-4"
  const discount = new Decimal(values.discount)
  return (
    <dl className={cn("flex flex-col gap-3 text-[15px] text-cream", className)}>
      <div className="flex items-start justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className={valueSize}>{formatEth(values.subtotal)}</dd>
      </div>
      <div className="flex items-start justify-between gap-4">
        <dt>
          Desconto do lançamento
          {couponCode ? <span className="ml-1 text-xs text-brand-text">({couponCode})</span> : null}
        </dt>
        <dd>
          {discount.isZero() ? (
            "(-) 00.00"
          ) : (
            <>
              <span className="sr-only">menos </span>(-) {formatEth(discount)}
            </>
          )}
        </dd>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3">
        <dt>Taxa de rede</dt>
        <dd className={valueSize}>{formatEth(values.networkFee)}</dd>
        <dd className={cn("col-span-2 text-xs leading-4 text-brand-text", feeNoteAlign === "end" ? "text-right" : "text-center")}>
          Taxa estimada
        </dd>
      </div>
    </dl>
  )
}

export function SummaryTotal({ total, className }: { total: Amount; className?: string }) {
  return (
    <p className={cn("flex items-start justify-between gap-4 leading-4 font-bold", className)}>
      <span className="text-base text-cream">Total</span>
      <span className="text-lg text-brand-text" aria-live="polite">
        {formatEth(total)}
      </span>
    </p>
  )
}

/** Skeleton do resumo com a mesma altura das linhas reais. */
export function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Calculando valores">
      <Skeleton className="h-[18px] w-full" />
      <Skeleton className="h-[18px] w-full" />
      <Skeleton className="h-[18px] w-full" />
      <Skeleton className="ml-auto h-3 w-20" />
      <Skeleton className="mt-3 h-[18px] w-full" />
    </div>
  )
}
