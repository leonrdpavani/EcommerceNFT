/**
 * Estado do servidor simulado. Persistido no localStorage para sustentar refresh;
 * `resetDb()` restaura integralmente o cenário conhecido (seed).
 */
import type { Order, Quote, User, Wallet } from "@/api/contracts"
import type { Nft } from "@/types/domain"

import { NFT_FIXTURES } from "./fixtures/nfts"
import { SEED_PASSWORD, USER_FIXTURES } from "./fixtures/users"

export interface DbUser extends User {
  passwordHash: string
  salt: string
}

export interface DbSession {
  token: string
  userId: string
  expiresAt: string
}

export interface DbCartItem {
  id: string
  nftId: string
  editionId: string
  quantity: number
}

export interface DbCart {
  id: string
  ownerId: string | null
  items: DbCartItem[]
  version: number
  updatedAt: string
}

export interface DbOrder extends Order {
  userId: string
  quoteId: string
  cartId: string
  /** Hash do conteúdo da requisição — detecta reuso da chave com conteúdo diferente. */
  fingerprint: string
  /** Momento em que a simulação de pagamento conclui o pedido. */
  settleAt: string
  outcome: "confirmed" | "declined"
}

export interface Db {
  schema: 1
  seq: number
  nfts: Nft[]
  users: DbUser[]
  sessions: DbSession[]
  carts: DbCart[]
  favorites: Record<string, string[]>
  wallets: Record<string, Wallet[]>
  quotes: Record<string, Quote>
  orders: Record<string, DbOrder>
  idempotency: Record<string, string>
}

const STORAGE_KEY = "kurio:mock-db"

let db: Db | null = null

export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function seed(): Promise<Db> {
  const users: DbUser[] = await Promise.all(
    USER_FIXTURES.map(async ({ favorites: _favorites, wallets: _wallets, ...user }) => {
      const salt = `seed-${user.id}`
      return { ...user, salt, passwordHash: await hashPassword(SEED_PASSWORD, salt) }
    })
  )

  return {
    schema: 1,
    seq: 1000,
    nfts: structuredClone(NFT_FIXTURES),
    users,
    sessions: [],
    carts: [],
    favorites: Object.fromEntries(USER_FIXTURES.map((user) => [user.id, [...user.favorites]])),
    wallets: Object.fromEntries(USER_FIXTURES.map((user) => [user.id, structuredClone([...user.wallets])])),
    quotes: {},
    orders: {},
    idempotency: {},
  }
}

export async function getDb(): Promise<Db> {
  if (db) return db
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Db
      if (parsed.schema === 1) {
        db = parsed
        return db
      }
    }
  } catch {
    // Estado corrompido: volta ao seed.
  }
  db = await seed()
  persist()
  return db
}

export function persist() {
  if (!db) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem localStorage (modo privado): o estado vive só em memória.
  }
}

export async function resetDb() {
  db = await seed()
  persist()
  return db
}

export function nextId(prefix: string) {
  if (!db) throw new Error("db não inicializado")
  db.seq += 1
  return `${prefix}_${db.seq.toString(36)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function publicUser(user: DbUser): User {
  const { passwordHash: _hash, salt: _salt, ...rest } = user
  return rest
}
