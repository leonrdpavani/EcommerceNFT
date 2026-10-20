import { cn } from "cn"

import { formatEth } from "@/lib/format"
import type { EthAmount } from "@/types/domain"

interface PriceProps {
  value: EthAmount
  compareAt?: EthAmount
  className?: string
  compareClassName?: string
}

export function Price({ value, compareAt, className, compareClassName }: PriceProps) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 leading-4", className)}>
      <span className="font-bold text-brand-text">
        <span className="sr-only">Preço: </span>
        {formatEth(value)}
      </span>
      {compareAt ? (
        <span className={cn("font-normal text-taupe line-through decoration-taupe/70", compareClassName)}>
          <span className="sr-only">Preço anterior: </span>
          {formatEth(compareAt)}
        </span>
      ) : null}
    </p>
  )
}
