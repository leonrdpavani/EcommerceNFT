import { delay, http, HttpResponse } from "msw"

import type { CreateOrderRequest, Order, WalletConnection, WalletConnectRequest } from "@/api/contracts"

import { getMockConfig } from "../config"
import { nextId, nowIso, persist, type DbOrder } from "../db"
import { API, apiError, computeQuote, readJson, requireAuth } from "../http-utils"
import { scheduleSettlement, settleOrder, toOrderDto } from "../orders-service"

const WALLET_TYPES = ["walletconnect", "metamask", "coinbase"]
const NETWORKS = ["ethereum", "polygon", "solana"]
const ADDRESS = /^0x[a-fA-F0-9]{40}$/

/** Atraso usado no cenário "timeout no pedido": maior que o timeout do cliente. */
const ORDER_TIMEOUT_DELAY_MS = 15_000

/** Sessões de carteira simuladas (em memória: some ao recarregar, como uma extensão real). */
const walletSessions = new Map<string, { userId: string; connection: WalletConnection; disconnected: boolean }>()

export const orderHandlers = [
  // Simulação da extensão da carteira: conectar / recusar / desconectar.
  http.post(`${API}/wallet/connect`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const body = await readJson<WalletConnectRequest>(request)
    if (!WALLET_TYPES.includes(body.walletType ?? "") || !NETWORKS.includes(body.network ?? "") || !ADDRESS.test(body.address ?? "")) {
      return apiError(422, "VALIDATION_ERROR", "Informe carteira, rede e um endereço 0x válido.")
    }
    const config = getMockConfig()
    if (config.wallet === "refuse") {
      return apiError(403, "WALLET_REJECTED", "A conexão foi recusada na carteira. Nenhum dado foi compartilhado.")
    }
    const connection: WalletConnection = {
      sessionId: nextId("wsess"),
      walletType: body.walletType!,
      network: body.network!,
      address: body.address!,
      connectedAt: nowIso(),
    }
    walletSessions.set(connection.sessionId, { userId: auth.user.id, connection, disconnected: config.wallet === "disconnect" })
    return HttpResponse.json<WalletConnection>(connection, { status: 201 })
  }),

  http.post(`${API}/orders`, async ({ request }) => {
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
      return HttpResponse.json<Order>(toOrderDto(existing), { status: 200 })
    }

    if (
      !body.quoteId ||
      !body.collector ||
      !body.walletSessionId ||
      !WALLET_TYPES.includes(body.walletType ?? "") ||
      !NETWORKS.includes(body.network ?? "")
    ) {
      return apiError(422, "VALIDATION_ERROR", "Dados do pedido incompletos.")
    }

    const walletSession = walletSessions.get(body.walletSessionId)
    if (!walletSession || walletSession.userId !== user.id || walletSession.disconnected) {
      walletSessions.delete(body.walletSessionId)
      return apiError(409, "WALLET_DISCONNECTED", "Sua carteira desconectou. Conecte novamente para enviar o pedido.")
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
      return apiError(409, "QUOTE_OUTDATED", "Preço, disponibilidade ou taxas mudaram. Revise os novos valores e confirme novamente.")
    }

    const config = getMockConfig()
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
      walletSessionId: body.walletSessionId,
      fingerprint,
      settleAt: new Date(Date.now() + config.settleMs).toISOString(),
      outcome: config.payment === "decline" ? "declined" : "confirmed",
    }
    db.orders[order.id] = order
    db.idempotency[key] = order.id
    persist()
    scheduleSettlement(order)

    // Cenário: o pedido já existe no servidor, mas a resposta chega tarde demais.
    if (config.orderTimeout) await delay(ORDER_TIMEOUT_DELAY_MS)

    return HttpResponse.json<Order>(toOrderDto(order), { status: 201 })
  }),

  http.get(`${API}/orders/:id`, async ({ request, params }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const order = auth.db.orders[params.id as string]
    if (!order) return apiError(404, "NOT_FOUND", "Pedido não encontrado.")
    if (order.userId !== auth.user.id) return apiError(403, "FORBIDDEN", "Você não tem permissão para ver este pedido.")
    settleOrder(auth.db, order)
    return HttpResponse.json<Order>(toOrderDto(order))
  }),
]
