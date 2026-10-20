import { http, HttpResponse } from "msw"

import type { AddCartItemRequest, Cart, Quote, QuoteRequest, UpdateCartItemRequest } from "@/api/contracts"

import { nextId, persist } from "../db"
import { API, apiError, computeQuote, findEdition, MAX_PER_LINE, readJson, resolveCart, toCartDto, touchCart } from "../http-utils"

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
}

export const cartHandlers = [
  http.get(`${API}/cart`, async ({ request }) => {
    const { db, cart } = await resolveCart(request)
    return HttpResponse.json<Cart>(toCartDto(db, cart))
  }),

  http.post(`${API}/cart/items`, async ({ request }) => {
    const body = await readJson<AddCartItemRequest>(request)
    const { db, cart } = await resolveCart(request)
    if (!body.nftId || !body.editionId || !isPositiveInt(body.quantity)) {
      return apiError(422, "VALIDATION_ERROR", "Informe NFT, edição e uma quantidade inteira positiva.")
    }
    const found = findEdition(db, body.nftId, body.editionId)
    if (!found) return apiError(404, "NOT_FOUND", "NFT ou edição não encontrada.")

    const existing = cart.items.find((item) => item.nftId === body.nftId && item.editionId === body.editionId)
    const nextQuantity = (existing?.quantity ?? 0) + body.quantity
    const limit = Math.min(MAX_PER_LINE, found.edition.available)
    if (found.edition.available === 0) {
      return apiError(409, "AVAILABILITY_CONFLICT", `A edição ${found.edition.label} de ${found.nft.name} está esgotada.`)
    }
    if (nextQuantity > limit) {
      return apiError(409, "AVAILABILITY_CONFLICT", `Só é possível ter até ${limit} unidade(s) desta edição no carrinho.`)
    }

    if (existing) existing.quantity = nextQuantity
    else cart.items.push({ id: nextId("ci"), nftId: body.nftId, editionId: body.editionId, quantity: body.quantity })
    touchCart(cart)
    persist()
    return HttpResponse.json<Cart>(toCartDto(db, cart), { status: 201 })
  }),

  http.patch(`${API}/cart/items/:itemId`, async ({ request, params }) => {
    const body = await readJson<UpdateCartItemRequest>(request)
    const { db, cart } = await resolveCart(request)
    const item = cart.items.find((entry) => entry.id === params.itemId)
    if (!item) return apiError(404, "NOT_FOUND", "Item não encontrado no carrinho.")
    if (!isPositiveInt(body.quantity)) return apiError(422, "VALIDATION_ERROR", "A quantidade deve ser um inteiro positivo.")
    const found = findEdition(db, item.nftId, item.editionId)
    const limit = Math.min(MAX_PER_LINE, found?.edition.available ?? 0)
    if (body.quantity > limit) {
      return apiError(409, "AVAILABILITY_CONFLICT", `Só há ${found?.edition.available ?? 0} unidade(s) disponível(is) desta edição.`)
    }
    item.quantity = body.quantity
    touchCart(cart)
    persist()
    return HttpResponse.json<Cart>(toCartDto(db, cart))
  }),

  http.delete(`${API}/cart/items/:itemId`, async ({ request, params }) => {
    const { db, cart } = await resolveCart(request)
    if (!cart.items.some((entry) => entry.id === params.itemId)) {
      return apiError(404, "NOT_FOUND", "Item não encontrado no carrinho.")
    }
    cart.items = cart.items.filter((entry) => entry.id !== params.itemId)
    touchCart(cart)
    persist()
    return HttpResponse.json<Cart>(toCartDto(db, cart))
  }),

  http.post(`${API}/quotes`, async ({ request }) => {
    const body = await readJson<QuoteRequest>(request)
    const { db, cart } = await resolveCart(request)
    const result = computeQuote(db, cart, body.couponCode || undefined)
    if (!result.ok) return result.response
    db.quotes[result.quote.id] = result.quote
    persist()
    return HttpResponse.json<Quote>(result.quote, { status: 201 })
  }),
]
