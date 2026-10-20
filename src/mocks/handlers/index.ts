import { http, HttpResponse } from "msw"

import { getMockConfig, resetMockConfig, setMockConfig, type MockConfig } from "../config"
import { getDb, persist, resetDb } from "../db"
import { API, apiError, readJson } from "../http-utils"
import { clearSettlementTimers } from "../orders-service"
import { connectedClients, dropAllConnections, publishNftUpdated, publishStaleNftEvent, redeliverLastEvent } from "../realtime"
import { accountHandlers } from "./account"
import { cartHandlers } from "./cart"
import { catalogHandlers } from "./catalog"
import { networkConditions, resetNetworkAttempts } from "./network"
import { orderHandlers } from "./orders"
import { sessionHandlers } from "./session"

type ActionBody = { nftId?: string; editionId?: string; delta?: string }

/** Escolhe o NFT alvo das ações: o informado ou o primeiro item de algum carrinho. */
async function targetNft(body: ActionBody) {
  const db = await getDb()
  const fallbackId = db.carts.flatMap((cart) => cart.items)[0]?.nftId ?? db.nfts[0].id
  const nft = db.nfts.find((item) => item.id === (body.nftId ?? fallbackId))
  return { db, nft }
}

/**
 * Controle da simulação (painel de cenários e testes). Não fazem parte da API de negócio:
 * só existem com os mocks ativos e alteram o estado do servidor simulado, que então
 * reflete a mudança tanto nas respostas REST quanto nos eventos Socket.IO.
 */
const controlHandlers = [
  http.post(`${API}/__mock/reset`, async () => {
    clearSettlementTimers()
    resetNetworkAttempts()
    await resetDb()
    dropAllConnections()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/__mock/config`, () => HttpResponse.json(getMockConfig())),

  http.delete(`${API}/__mock/config`, () => {
    resetNetworkAttempts()
    return HttpResponse.json(resetMockConfig())
  }),

  http.put(`${API}/__mock/config`, async ({ request }) => {
    resetNetworkAttempts()
    return HttpResponse.json(setMockConfig((await readJson<MockConfig>(request)) as Partial<MockConfig>))
  }),

  http.get(`${API}/__mock/realtime/clients`, () => HttpResponse.json({ clients: connectedClients() })),

  http.post(`${API}/__mock/actions/:action`, async ({ request, params }) => {
    const body = await readJson<ActionBody>(request)
    switch (params.action) {
      case "price-change": {
        const { nft } = await targetNft(body)
        if (!nft) return apiError(404, "NOT_FOUND", "NFT não encontrado.")
        const delta = Number(body.delta ?? "0.25")
        nft.price = Math.max(0.01, Number(nft.price) + delta).toFixed(2)
        nft.version += 1
        persist()
        return HttpResponse.json({ event: publishNftUpdated(nft) })
      }
      case "sell-out": {
        const { db, nft } = await targetNft(body)
        if (!nft) return apiError(404, "NOT_FOUND", "NFT não encontrado.")
        const editionIds = body.editionId
          ? [body.editionId]
          : db.carts.flatMap((cart) => cart.items).filter((item) => item.nftId === nft.id).map((item) => item.editionId)
        for (const edition of nft.editions) {
          if (editionIds.length === 0 || editionIds.includes(edition.id)) edition.available = 0
        }
        nft.version += 1
        persist()
        return HttpResponse.json({ event: publishNftUpdated(nft) })
      }
      case "duplicate-event":
        return HttpResponse.json({ event: redeliverLastEvent() })
      case "stale-event": {
        const { nft } = await targetNft(body)
        if (!nft) return apiError(404, "NOT_FOUND", "NFT não encontrado.")
        return HttpResponse.json({ event: publishStaleNftEvent(nft) })
      }
      case "drop-connections":
        return HttpResponse.json({ dropped: dropAllConnections() })
      case "expire-sessions": {
        const db = await getDb()
        for (const session of db.sessions) session.expiresAt = new Date(Date.now() - 1000).toISOString()
        persist()
        return HttpResponse.json({ expired: db.sessions.length })
      }
      default:
        return apiError(404, "NOT_FOUND", `Ação desconhecida: ${String(params.action)}`)
    }
  }),
]

export const handlers = [
  ...controlHandlers,
  networkConditions,
  ...catalogHandlers,
  ...sessionHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...accountHandlers,
]
