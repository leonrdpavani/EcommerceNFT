import Decimal from "decimal.js"
import { HttpResponse } from "msw"

import type { ApiErrorBody, ApiErrorCode, Cart, Quote, QuoteIssue, QuoteLine } from "@/api/contracts"

import { COUPON_FIXTURES, NETWORK_FEE } from "./fixtures/users"
import { getDb, nextId, nowIso, persist, type Db, type DbCart, type DbUser } from "./db"

export const API = "/api"

export function apiError(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string>): Response {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } }
  return HttpResponse.json(body, { status }) as Response
}

export function validationError(fields: Record<string, string>, message = "Revise os campos destacados.") {
  return apiError(422, "VALIDATION_ERROR", message, fields)
}

type AuthResult = { db: Db; user: DbUser } | { db: Db; user: null; reason: "missing" | "expired" | "invalid" }

/** Resolve o usuário a partir do header Authorization: Bearer <token>. */
export async function readAuth(request: Request): Promise<AuthResult> {
  const db = await getDb()
  const header = request.headers.get("authorization")
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return { db, user: null, reason: "missing" }

  const session = db.sessions.find((item) => item.token === token)
  if (!session) return { db, user: null, reason: "invalid" }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    db.sessions = db.sessions.filter((item) => item.token !== token)
    persist()
    return { db, user: null, reason: "expired" }
  }
  const user = db.users.find((item) => item.id === session.userId)
  return user ? { db, user } : { db, user: null, reason: "invalid" }
}

/** Exige sessão válida; devolve uma resposta 401 quando ausente ou expirada. */
export async function requireAuth(request: Request) {
  const auth = await readAuth(request)
  if (auth.user) return { db: auth.db, user: auth.user }
  return unauthorized(auth.reason)
}

function unauthorized(reason: "missing" | "expired" | "invalid") {
  return reason === "expired"
    ? apiError(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente para continuar.")
    : apiError(401, "UNAUTHENTICATED", "Entre na sua conta para continuar.")
}

// ---------------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------------

export function findOrCreateCart(db: Db, ownerId: string | null, visitorCartId: string | null): DbCart {
  if (ownerId) {
    const owned = db.carts.find((cart) => cart.ownerId === ownerId)
    if (owned) return owned
  } else if (visitorCartId) {
    const visitor = db.carts.find((cart) => cart.id === visitorCartId && cart.ownerId === null)
    if (visitor) return visitor
  }
  const cart: DbCart = { id: nextId("cart"), ownerId, items: [], version: 1, updatedAt: nowIso() }
  db.carts.push(cart)
  persist()
  return cart
}

/**
 * Carrinho do usuário autenticado ou do visitante (X-Cart-Id). Um token enviado mas
 * expirado/inválido responde 401 — nunca cai silenciosamente num carrinho de visitante.
 */
export async function resolveCart(request: Request) {
  const auth = await readAuth(request)
  if (!auth.user && auth.reason !== "missing") return unauthorized(auth.reason)
  const cart = findOrCreateCart(auth.db, auth.user?.id ?? null, request.headers.get("x-cart-id"))
  return { db: auth.db, user: auth.user, cart }
}

export function touchCart(cart: DbCart) {
  cart.version += 1
  cart.updatedAt = nowIso()
}

export function findEdition(db: Db, nftId: string, editionId: string) {
  const nft = db.nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : null
}

export const MAX_PER_LINE = 10

export function toCartDto(db: Db, cart: DbCart): Cart {
  const items = cart.items.flatMap((item) => {
    const found = findEdition(db, item.nftId, item.editionId)
    if (!found) return []
    const { nft, edition } = found
    return [
      {
        id: item.id,
        nftId: nft.id,
        editionId: edition.id,
        editionLabel: edition.label,
        name: nft.name,
        tokenId: nft.tokenId,
        artwork: nft.artwork,
        quantity: item.quantity,
        unitPrice: nft.price,
        lineTotal: new Decimal(nft.price).times(item.quantity).toFixed(),
        available: edition.available,
        nftVersion: nft.version,
      },
    ]
  })
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total.plus(item.lineTotal), new Decimal(0)).toFixed(),
    version: cart.version,
    updatedAt: cart.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Cotação
// ---------------------------------------------------------------------------

export const QUOTE_TTL_MS = 5 * 60 * 1000

type CouponResult = { ok: true; coupon: Quote["coupon"]; discount: Decimal } | { ok: false; response: Response }

export function applyCoupon(code: string | undefined, subtotal: Decimal): CouponResult {
  if (!code) return { ok: true, coupon: null, discount: new Decimal(0) }
  const normalized = code.trim().toUpperCase()
  const coupon = COUPON_FIXTURES[normalized]
  if (!coupon) {
    return {
      ok: false,
      response: apiError(422, "COUPON_INVALID", `O cupom ${normalized} não existe.`, { couponCode: "Cupom inválido." }),
    }
  }
  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    return {
      ok: false,
      response: apiError(422, "COUPON_EXPIRED", `O cupom ${normalized} expirou.`, { couponCode: "Cupom expirado." }),
    }
  }
  if (coupon.minSubtotal && subtotal.lessThan(coupon.minSubtotal)) {
    return {
      ok: false,
      response: apiError(422, "COUPON_INVALID", `O cupom ${normalized} exige subtotal mínimo de ${coupon.minSubtotal} ETH.`, {
        couponCode: `Subtotal mínimo de ${coupon.minSubtotal} ETH.`,
      }),
    }
  }
  const raw = coupon.kind === "percent" ? subtotal.times(coupon.value).dividedBy(100) : new Decimal(coupon.value)
  const discount = Decimal.min(raw, subtotal).toDecimalPlaces(6, Decimal.ROUND_DOWN)
  return { ok: true, coupon: { code: normalized, description: coupon.description }, discount }
}

/** Calcula a cotação do carrinho com os preços e a disponibilidade atuais. */
export function computeQuote(
  db: Db,
  cart: DbCart,
  couponCode?: string
): { ok: true; quote: Quote } | { ok: false; response: Response } {
  const issues: QuoteIssue[] = []
  const items: QuoteLine[] = cart.items.flatMap((item) => {
    const found = findEdition(db, item.nftId, item.editionId)
    if (!found) return []
    const { nft, edition } = found
    if (item.quantity > edition.available) {
      issues.push({
        type: "INSUFFICIENT_AVAILABILITY",
        nftId: nft.id,
        editionId: edition.id,
        requested: item.quantity,
        available: edition.available,
      })
    }
    return [
      {
        nftId: nft.id,
        editionId: edition.id,
        editionLabel: edition.label,
        name: nft.name,
        tokenId: nft.tokenId,
        artwork: nft.artwork,
        quantity: item.quantity,
        unitPrice: nft.price,
        lineTotal: new Decimal(nft.price).times(item.quantity).toFixed(),
      },
    ]
  })

  const subtotal = items.reduce((total, item) => total.plus(item.lineTotal), new Decimal(0))
  const couponResult = applyCoupon(couponCode, subtotal)
  if (!couponResult.ok) return couponResult

  const networkFee = items.length > 0 ? new Decimal(NETWORK_FEE) : new Decimal(0)
  const createdAt = new Date()
  const quote: Quote = {
    id: nextId("qte"),
    cartId: cart.id,
    cartVersion: cart.version,
    items,
    coupon: couponResult.coupon,
    subtotal: subtotal.toFixed(),
    discount: couponResult.discount.toFixed(),
    networkFee: networkFee.toFixed(),
    total: subtotal.minus(couponResult.discount).plus(networkFee).toFixed(),
    currency: "ETH",
    issues,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + QUOTE_TTL_MS).toISOString(),
  }
  return { ok: true, quote }
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}
