import { http, HttpResponse } from "msw"

import type { LoginRequest, SessionResponse, SignupRequest } from "@/api/contracts"

import { getMockConfig } from "../config"
import { hashPassword, nextId, nowIso, persist, publicUser, type Db, type DbUser } from "../db"
import { API, apiError, findOrCreateCart, MAX_PER_LINE, readAuth, readJson, requireAuth, touchCart, validationError } from "../http-utils"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-z0-9_.]{3,20}$/i

function createSession(db: Db, user: DbUser): SessionResponse {
  const token = `tok_${crypto.randomUUID()}`
  const expiresAt = new Date(Date.now() + getMockConfig().sessionMinutes * 60_000).toISOString()
  db.sessions.push({ token, userId: user.id, expiresAt })
  return { user: publicUser(user), token, expiresAt }
}

/** Ao autenticar, os itens do carrinho de visitante são preservados no carrinho do usuário. */
function mergeVisitorCart(db: Db, userId: string, visitorCartId: string | null) {
  if (!visitorCartId) return
  const visitor = db.carts.find((cart) => cart.id === visitorCartId && cart.ownerId === null)
  if (!visitor || visitor.items.length === 0) return
  const target = findOrCreateCart(db, userId, null)
  for (const item of visitor.items) {
    const nft = db.nfts.find((entry) => entry.id === item.nftId)
    const available = nft?.editions.find((edition) => edition.id === item.editionId)?.available ?? 0
    const existing = target.items.find((entry) => entry.nftId === item.nftId && entry.editionId === item.editionId)
    const limit = Math.min(MAX_PER_LINE, Math.max(available, 1))
    if (existing) existing.quantity = Math.min(limit, existing.quantity + item.quantity)
    else target.items.push({ ...item, id: nextId("ci"), quantity: Math.min(limit, item.quantity) })
  }
  touchCart(target)
  db.carts = db.carts.filter((cart) => cart.id !== visitor.id)
}

export const sessionHandlers = [
  http.post(`${API}/session`, async ({ request }) => {
    const body = await readJson<LoginRequest>(request)
    const { db } = await readAuth(request)
    const email = body.email?.trim().toLowerCase() ?? ""
    const user = db.users.find((item) => item.email === email)
    const valid = user && (await hashPassword(body.password ?? "", user.salt)) === user.passwordHash
    if (!user || !valid) return apiError(401, "UNAUTHENTICATED", "E-mail ou senha incorretos.")
    mergeVisitorCart(db, user.id, request.headers.get("x-cart-id"))
    const session = createSession(db, user)
    persist()
    return HttpResponse.json<SessionResponse>(session)
  }),

  http.get(`${API}/session`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const token = request.headers.get("authorization")!.slice(7)
    const session = auth.db.sessions.find((item) => item.token === token)!
    return HttpResponse.json<SessionResponse>({ user: publicUser(auth.user), token, expiresAt: session.expiresAt })
  }),

  http.delete(`${API}/session`, async ({ request }) => {
    const { db } = await readAuth(request)
    const token = request.headers.get("authorization")?.slice(7)
    db.sessions = db.sessions.filter((item) => item.token !== token)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API}/accounts`, async ({ request }) => {
    const body = await readJson<SignupRequest>(request)
    const { db } = await readAuth(request)
    const username = body.username?.trim() ?? ""
    const email = body.email?.trim().toLowerCase() ?? ""
    const password = body.password ?? ""

    const fields: Record<string, string> = {}
    if (!USERNAME.test(username)) fields.username = "Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado."
    if (!EMAIL.test(email)) fields.email = "Informe um e-mail válido."
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fields.password = "A senha precisa ter 8 caracteres, com letras e números."
    }
    if (Object.keys(fields).length) return validationError(fields)

    const conflicts: Record<string, string> = {}
    if (db.users.some((item) => item.email === email)) conflicts.email = "Este e-mail já está cadastrado."
    if (db.users.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
      conflicts.username = "Este nome de usuário já está em uso."
    }
    if (Object.keys(conflicts).length) {
      return apiError(409, "CONFLICT", "Já existe uma conta com estes dados.", conflicts)
    }

    const salt = crypto.randomUUID()
    const user: DbUser = {
      id: nextId("usr"),
      email,
      username,
      displayName: username,
      ensName: "",
      walletNickname: "",
      avatarUrl: null,
      salt,
      passwordHash: await hashPassword(password, salt),
    }
    db.users.push(user)
    db.favorites[user.id] = []
    db.wallets[user.id] = []
    mergeVisitorCart(db, user.id, request.headers.get("x-cart-id"))
    const session = createSession(db, user)
    persist()
    return HttpResponse.json<SessionResponse>(session, { status: 201, headers: { "x-created-at": nowIso() } })
  }),
]
