/**
 * Servidor Socket.IO simulado com MSW (`ws.link`) + `@mswjs/socket.io-binding`.
 *
 * Transporte: apenas WebSocket — o cliente usa `transports: ["websocket"]`, pois o long-polling
 * do Socket.IO seriam requisições HTTP que este servidor não emula.
 * Limitações do binding: sem namespaces/rooms/acks; o handshake é respondido automaticamente
 * pelo binding e o heartbeat (ping) é enviado manualmente aqui.
 */
import { toSocketIo } from "@mswjs/socket.io-binding"
import { ws } from "msw"

import type { NftUpdatedEvent, Order, OrderUpdatedEvent, RealtimeEvent } from "@/api/contracts"
import { REALTIME_WS_URL } from "@/realtime/endpoint"
import type { Nft } from "@/types/domain"

import { getMockConfig } from "./config"
import { getDb, nextId, nowIso } from "./db"

/** O MSW remove o prefixo "/socket.io/" do caminho: o link escuta a raiz do host de tempo real. */
export const realtimeLink = ws.link(REALTIME_WS_URL)

const PING_INTERVAL_MS = 20_000

interface ConnectedClient {
  id: string
  userId: string | null
  socket: ReturnType<typeof toSocketIo>
  close: () => void
}

const clients = new Map<string, ConnectedClient>()
let lastEvent: { event: RealtimeEvent<string, unknown>; target: string | null } | null = null

async function userIdFromToken(token: unknown) {
  if (typeof token !== "string") return null
  const db = await getDb()
  const session = db.sessions.find((item) => item.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  return session.userId
}

export const realtimeHandler = realtimeLink.addEventListener("connection", (connection) => {
  // Servidor fora do ar: recusa a conexão (o cliente tenta reconectar com backoff).
  if (getMockConfig().realtime === "offline") {
    connection.client.close(1011, "Servidor de tempo real indisponível")
    return
  }

  const socket = toSocketIo(connection)
  const client: ConnectedClient = {
    id: connection.client.id,
    userId: null,
    socket,
    close: () => connection.client.close(1012, "Conexão encerrada pelo servidor"),
  }
  clients.set(client.id, client)

  // O pacote CONNECT do cliente ("40{...auth}") traz o token da sessão.
  connection.client.addEventListener("message", (event) => {
    if (typeof event.data !== "string" || !event.data.startsWith("40")) return
    try {
      const auth = JSON.parse(event.data.slice(2) || "{}") as { token?: string }
      void userIdFromToken(auth.token).then((userId) => {
        client.userId = userId
      })
    } catch {
      client.userId = null
    }
  })

  const ping = setInterval(() => connection.client.send("2"), PING_INTERVAL_MS)
  connection.client.addEventListener("close", () => {
    clearInterval(ping)
    clients.delete(client.id)
  })
})

function deliver(event: RealtimeEvent<string, unknown>, target: string | null) {
  for (const client of clients.values()) {
    if (target === null || client.userId === target) client.socket.client.emit(event.type, event)
  }
}

function envelope<TType extends string, TData>(
  type: TType,
  resource: RealtimeEvent<TType, TData>["resource"],
  version: number,
  data: TData,
  userId?: string
): RealtimeEvent<TType, TData> {
  return { id: nextId("evt"), type, resource, version, occurredAt: nowIso(), ...(userId ? { userId } : {}), data }
}

/** nft.updated é público: preço e disponibilidade valem para todos. */
export function publishNftUpdated(nft: Nft) {
  const event: NftUpdatedEvent = envelope("nft.updated", { type: "nft", id: nft.id }, nft.version, structuredClone(nft))
  lastEvent = { event, target: null }
  deliver(event, null)
  return event
}

/** order.updated é privado: só as conexões do dono do pedido recebem. */
export function publishOrderUpdated(userId: string, order: Order) {
  const event: OrderUpdatedEvent = envelope("order.updated", { type: "order", id: order.id }, order.version, structuredClone(order), userId)
  lastEvent = { event, target: userId }
  deliver(event, userId)
  return event
}

/** Cenário: reenvia o último evento com o mesmo id (o cliente deve ignorar a duplicata). */
export function redeliverLastEvent() {
  if (!lastEvent) return null
  deliver(lastEvent.event, lastEvent.target)
  return lastEvent.event
}

/** Cenário: envia um nft.updated com versão antiga e preço diferente (deve ser descartado). */
export function publishStaleNftEvent(nft: Nft) {
  const stale: Nft = { ...structuredClone(nft), price: "0.01", version: Math.max(0, nft.version - 1) }
  const event: NftUpdatedEvent = envelope("nft.updated", { type: "nft", id: nft.id }, stale.version, stale)
  deliver(event, null)
  return event
}

/** Cenário: derruba todas as conexões (o cliente reconecta e reconcilia com a REST). */
export function dropAllConnections() {
  const count = clients.size
  for (const client of clients.values()) client.close()
  return count
}

export function connectedClients() {
  return [...clients.values()].map((client) => ({ id: client.id, userId: client.userId }))
}
