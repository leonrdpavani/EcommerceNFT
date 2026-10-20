import { http, HttpResponse } from "msw"

import type {
  AvatarUpdateRequest,
  FavoritesResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  User,
  Wallet,
  WalletInput,
  WalletsResponse,
} from "@/api/contracts"

import { hashPassword, nowIso, persist, publicUser } from "../db"
import { API, apiError, readJson, requireAuth, validationError } from "../http-utils"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-z0-9_.]{3,20}$/i
const ADDRESS = /^0x[a-fA-F0-9]{40}$/
const ENS = /^[a-z0-9-]{3,32}$/i
const MAX_AVATAR_LENGTH = 3_000_000

export const accountHandlers = [
  // Favoritos -------------------------------------------------------------
  http.get(`${API}/favorites`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json<FavoritesResponse>({ nftIds: auth.db.favorites[auth.user.id] ?? [] })
  }),

  http.put(`${API}/favorites/:nftId`, async ({ request, params }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const nftId = params.nftId as string
    if (!auth.db.nfts.some((nft) => nft.id === nftId)) return apiError(404, "NOT_FOUND", "NFT não encontrado.")
    const list = new Set(auth.db.favorites[auth.user.id] ?? [])
    list.add(nftId)
    auth.db.favorites[auth.user.id] = [...list]
    persist()
    return HttpResponse.json<FavoritesResponse>({ nftIds: auth.db.favorites[auth.user.id] })
  }),

  http.delete(`${API}/favorites/:nftId`, async ({ request, params }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    auth.db.favorites[auth.user.id] = (auth.db.favorites[auth.user.id] ?? []).filter((id) => id !== params.nftId)
    persist()
    return HttpResponse.json<FavoritesResponse>({ nftIds: auth.db.favorites[auth.user.id] })
  }),

  // Perfil ------------------------------------------------------------------
  http.get(`${API}/profile`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json<User>(publicUser(auth.user))
  }),

  http.patch(`${API}/profile`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const body = await readJson<ProfileUpdateRequest>(request)
    const email = body.email?.trim().toLowerCase() ?? ""
    const username = body.username?.trim() ?? ""

    const fields: Record<string, string> = {}
    if (!body.displayName?.trim()) fields.displayName = "Informe o nome de exibição."
    if (!USERNAME.test(username)) fields.username = "Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado."
    if (!EMAIL.test(email)) fields.email = "Informe um e-mail válido."
    if (!ENS.test(body.ensName ?? "")) fields.ensName = "Use de 3 a 32 letras, números ou hífen."
    if (!body.walletNickname?.trim()) fields.walletNickname = "Informe o apelido da carteira."
    if (Object.keys(fields).length) return validationError(fields)

    const others = auth.db.users.filter((user) => user.id !== auth.user.id)
    const conflicts: Record<string, string> = {}
    if (others.some((user) => user.email === email)) conflicts.email = "Este e-mail já está em uso."
    if (others.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      conflicts.username = "Este nome de usuário já está em uso."
    }
    if (Object.keys(conflicts).length) return apiError(409, "CONFLICT", "Estes dados já pertencem a outra conta.", conflicts)

    Object.assign(auth.user, {
      displayName: body.displayName!.trim(),
      username,
      email,
      ensName: body.ensName!.trim(),
      walletNickname: body.walletNickname!.trim(),
    })
    persist()
    return HttpResponse.json<User>(publicUser(auth.user))
  }),

  http.post(`${API}/profile/password`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const body = await readJson<PasswordChangeRequest>(request)
    const current = await hashPassword(body.currentPassword ?? "", auth.user.salt)
    if (current !== auth.user.passwordHash) return validationError({ currentPassword: "A senha atual está incorreta." })
    const next = body.newPassword ?? ""
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      return validationError({ newPassword: "A senha precisa ter 8 caracteres, com letras e números." })
    }
    auth.user.salt = crypto.randomUUID()
    auth.user.passwordHash = await hashPassword(next, auth.user.salt)
    persist()
    return new HttpResponse(null, { status: 204 })
  }),

  http.put(`${API}/profile/avatar`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const body = await readJson<AvatarUpdateRequest>(request)
    const dataUrl = body.dataUrl ?? null
    if (dataUrl !== null && (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl) || dataUrl.length > MAX_AVATAR_LENGTH)) {
      return validationError({ avatar: "Envie uma imagem PNG, JPG ou WebP de até 2 MB." })
    }
    auth.user.avatarUrl = dataUrl
    persist()
    return HttpResponse.json<User>(publicUser(auth.user))
  }),

  // Carteiras ---------------------------------------------------------------
  http.get(`${API}/wallets`, async ({ request }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json<WalletsResponse>({ items: auth.db.wallets[auth.user.id] ?? [] })
  }),

  http.put(`${API}/wallets/:slot`, async ({ request, params }) => {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const slot = params.slot
    if (slot !== "primary" && slot !== "secondary") return apiError(404, "NOT_FOUND", "Carteira não encontrada.")
    const body = await readJson<WalletInput>(request)

    const fields: Record<string, string> = {}
    if (!body.displayName?.trim()) fields.displayName = "Informe o nome de exibição."
    if (!body.walletNickname?.trim()) fields.walletNickname = "Informe o apelido da carteira."
    if (!["ethereum", "polygon", "solana"].includes(body.network ?? "")) fields.network = "Selecione uma rede."
    if (!body.profileName?.trim()) fields.profileName = "Informe o nome do perfil."
    if (!ADDRESS.test(body.address ?? "")) fields.address = "Informe um endereço 0x válido com 40 caracteres hexadecimais."
    if (!["walletconnect", "metamask", "coinbase"].includes(body.walletType ?? "")) fields.walletType = "Selecione o tipo de carteira."
    if (!body.referralCode?.trim()) fields.referralCode = "Informe o código de indicação."
    if (!EMAIL.test(body.email ?? "")) fields.email = "Informe um e-mail válido."
    if (!ENS.test(body.ensName ?? "")) fields.ensName = "Use de 3 a 32 letras, números ou hífen."
    if (Object.keys(fields).length) return validationError(fields)

    const wallets = auth.db.wallets[auth.user.id] ?? []
    const wallet: Wallet = { ...(body as WalletInput), slot, updatedAt: nowIso() }
    auth.db.wallets[auth.user.id] = [...wallets.filter((item) => item.slot !== slot), wallet].sort((a) =>
      a.slot === "primary" ? -1 : 1
    )
    persist()
    return HttpResponse.json<Wallet>(wallet)
  }),
]
