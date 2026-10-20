import { http, HttpResponse } from "msw"

import type { CreateOrderRequest, Order } from "@/api/contracts"

import { getMockConfig, networkDelay } from "../config"
import { nextId, nowIso, persist, type Db, type DbOrder } from "../db"
import { API, apiError, computeQuote, findEdition, readJson, requireAuth, touchCart } from "../http-utils"

const WALLET_TYPES = ["walletconnect", "metamask", "coinbase"]
const NETWORKS = ["ethereum", "polygon", "solana"]

function toOrderDto(order: DbOrder): Order {
  const { userId: _u, quoteId: _q, cartId: _c, fingerprint: _f, settleAt: _s, outcome: _o, ...dto } = order
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
 */
export function settleOrder(db: Db, order: DbOrder) {
  if (order.status !== "pending" || new Date(order.settleAt).getTime() > Date.now()) return false

  if (order.outcome === "confirmed") {
    for (const line of order.items) {
      const found = findEdition(db, line.nftId, line.editionId)
      if (found) {
        found.edition.available = Math.max(0, found.edition.available - line.quantity)
        found.nft.version += 1
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
    order.failureReason = "A carteira recusou a transação. Nenhum valor foi cobrado."
  }
  order.version += 1
  order.updatedAt = nowIso()
  return true
}

export const orderHandlers = [
  http.post(`${API}/orders`, async ({ request }) => {
    await networkDelay()
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const { db, user } = auth

    const key = request.headers.get("idempotency-key")
    if (!key) return apiError(400, "VALIDATION_ERROR", "O header Idempotency-Key é obrigatório.")

    const body = await readJson<CreateOrderRequest>(request)
    const fingerprint = JSON.stringify({ userId: user.id, ...body })

    // Mesma tentativa → mesmo pedido. Mesma chave com conteúdo diferente → conflito.
    const existingId = db.idempotency[key]
    if (existingId) {
      const existing = db.orders[existingId]
      if (existing.fingerprint !== fingerprint) {
        return apiError(409, "IDEMPOTENCY_CONFLICT", "Esta tentativa de compra já foi usada com outros dados.")
      }
      settleOrder(db, existing)
      persist()
      return HttpResponse.json<Order>(toOrderDto(existing), { status: 200 })
    }

    if (!body.quoteId || !body.collector || !WALLET_TYPES.includes(body.walletType ?? "") || !NETWORKS.includes(body.network ?? "")) {
      return apiError(422, "VALIDATION_ERROR", "Dados do pedido incompletos.")
    }

    const quote = db.quotes[body.quoteId]
    const cart = db.carts.find((item) => item.ownerId === user.id)
    if (!quote || !cart || quote.cartId !== cart.id) return apiError(404, "NOT_FOUND", "Cotação não encontrada.")
    if (cart.items.length === 0) return apiError(409, "CONFLICT", "O carrinho está vazio.")

    // Revalida preço, disponibilidade, cupom e taxas antes de confirmar.
    const fresh = computeQuote(db, cart, quote.coupon?.code)
    if (!fresh.ok) return fresh.response
    const outdated =
      new Date(quote.expiresAt).getTime() < Date.now() ||
      quote.cartVersion !== cart.version ||
      fresh.quote.total !== quote.total ||
      fresh.quote.issues.length > 0
    if (outdated) {
      return apiError(409, "QUOTE_OUTDATED", "Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.")
    }

    const createdAt = nowIso()
    const order: DbOrder = {
      id: nextId("ord"),
      status: "pending",
      version: 1,
      idempotencyKey: key,
      items: quote.items,
      coupon: quote.coupon,
      subtotal: quote.subtotal,
      discount: quote.discount,
      networkFee: quote.networkFee,
      total: quote.total,
      network: body.network!,
      walletType: body.walletType!,
      transactionHash: null,
      explorerUrl: null,
      failureReason: null,
      createdAt,
      updatedAt: createdAt,
      userId: user.id,
      quoteId: quote.id,
      cartId: cart.id,
      fingerprint,
      settleAt: new Date(Date.now() + getMockConfig().settleMs).toISOString(),
      outcome: "confirmed",
    }
    db.orders[order.id] = order
    db.idempotency[key] = order.id
    persist()
    return HttpResponse.json<Order>(toOrderDto(order), { status: 201 })
  }),

  http.get(`${API}/orders/:id`, async ({ request, params }) => {
    await networkDelay()
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const order = auth.db.orders[params.id as string]
    if (!order) return apiError(404, "NOT_FOUND", "Pedido não encontrado.")
    if (order.userId !== auth.user.id) return apiError(403, "FORBIDDEN", "Você não tem permissão para ver este pedido.")
    if (settleOrder(auth.db, order)) persist()
    return HttpResponse.json<Order>(toOrderDto(order))
  }),
]
