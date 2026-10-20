import Decimal from "decimal.js"

import type { EthAmount } from "@/types/domain"

/** Formata um valor ETH preservando a precisão da string decimal (mínimo de 2 casas). */
export function formatEth(value: EthAmount | Decimal, { suffix = true } = {}) {
  const amount = value instanceof Decimal ? value : new Decimal(value)
  const decimals = Math.max(2, amount.decimalPlaces())
  const formatted = amount.toFixed(decimals)
  return suffix ? `${formatted} ETH` : formatted
}

export function multiplyEth(price: EthAmount, quantity: number) {
  return new Decimal(price).times(quantity)
}

export function sumEth(values: (EthAmount | Decimal)[]) {
  return values.reduce<Decimal>((total, value) => total.plus(value), new Decimal(0))
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

/** Encurta endereços longos: 0xA91F…E82C */
export function shortenAddress(address: string) {
  if (!address.startsWith("0x") || address.length <= 13) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
