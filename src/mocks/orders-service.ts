import type { Order } from "@/api/contracts"

import { getDb, nowIso, persist, type Db, type DbOrder } from "./db"
import { findEdition, touchCart } from "./http-utils"
import { publishNftUpdated, publishOrderUpdated } from "./realtime"

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function toOrderDto(order: DbOrder): Order {
  const { userId: _u, quoteId: _q, cartId: _c, fingerprint: _f, settleAt: _s, outcome: _o, walletSessionId: _w, ...dto } = order
  return dto
}

function fakeHash(seed: string) {
  let hash = ""
  let value = Array.from(seed).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)
  while (hash.length < 64) {
    value = (value * 1103515245 + 12345) >>> 0
    hash += value.toString(16).padStart(8, "0")
  }
  return `0x${hash.slice(0, 64)}`
}

/**
 * Conclui a simulação do pagamento quando o prazo passa. Na confirmação, baixa a
 * disponibilidade e remove do carrinho apenas os itens e quantidades comprados.
 * Publica order.updated (dono) e nft.updated (todos) — REST e eventos ficam coerentes.
 */
export function settleOrder(db: Db, order: DbOrder) {
  if (order.status !== "pending" || new Date(order.settleAt).getTime() > Date.now()) return false
  const changedNfts = new Set<string>()

  if (order.outcome === "confirmed") {
    for (const line of order.items) {
      const found = findEdition(db, line.nftId, line.editionId)
      if (found) {
        found.edition.available = Math.max(0, found.edition.available - line.quantity)
        found.nft.version += 1
        changedNfts.add(found.nft.id)
      }
    }
    const cart = db.carts.find((item) => item.id === order.cartId)
    if (cart) {
      for (const line of order.items) {
        const item = cart.items.find((entry) => entry.nftId === line.nftId && entry.editionId === line.editionId)
        if (item) item.quantity -= line.quantity
      }
      cart.items = cart.items.filter((item) => item.quantity > 0)
      touchCart(cart)
    }
    order.status = "confirmed"
    order.transactionHash = fakeHash(order.id)
    order.explorerUrl = `https://etherscan.io/tx/${order.transactionHash}`
  } else {
    order.status = "declined"
    order.failureReason = "A carteira recusou a transação. Nenhum valor foi cobrado e seus itens continuam no carrinho."
  }
  order.version += 1
  order.updatedAt = nowIso()
  persist()

  publishOrderUpdated(order.userId, toOrderDto(order))
  for (const nftId of changedNfts) {
    const nft = db.nfts.find((item) => item.id === nftId)
    if (nft) publishNftUpdated(nft)
  }
  return true
}

/** Agenda a conclusão do pagamento (também reagendada ao recarregar a página). */
export function scheduleSettlement(order: DbOrder) {
  if (order.status !== "pending" || timers.has(order.id)) return
  const wait = Math.max(0, new Date(order.settleAt).getTime() - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      timers.delete(order.id)
      void getDb().then((db) => {
        const current = db.orders[order.id]
        if (current) settleOrder(db, current)
      })
    }, wait)
  )
}

export async function resumePendingOrders() {
  const db = await getDb()
  for (const order of Object.values(db.orders)) scheduleSettlement(order)
}

export function clearSettlementTimers() {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
}
