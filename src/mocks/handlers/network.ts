import { delay, http, HttpResponse } from "msw"

import { getMockConfig, latencyMs } from "../config"
import { API, apiError } from "../http-utils"

const attempts = new Map<string, number>()

/**
 * Condições de rede aplicadas a todas as rotas de negócio, antes dos handlers de cada recurso.
 * Quando o resolver não retorna resposta, o MSW segue para o próximo handler correspondente.
 */
export const networkConditions = http.all(`${API}/*`, async ({ request }) => {
  const url = new URL(request.url)
  if (url.pathname.startsWith(`${API}/__mock`)) return

  const config = getMockConfig()
  const wait = latencyMs(config)
  if (wait > 0) await delay(wait)

  switch (config.failure) {
    case "offline":
      return HttpResponse.error()
    case "server-error":
      return apiError(500, "INTERNAL", "O servidor encontrou um erro inesperado. Tente novamente em instantes.")
    case "catalog-error":
      if (request.method === "GET" && url.pathname.startsWith(`${API}/nfts`)) {
        return apiError(500, "INTERNAL", "O catálogo está indisponível no momento.")
      }
      return
    case "transient": {
      const key = `${request.method} ${url.pathname}`
      const count = (attempts.get(key) ?? 0) + 1
      attempts.set(key, count)
      if (count % 2 === 1) return apiError(503, "TRANSIENT", "Instabilidade temporária. Tente novamente.")
      return
    }
    default:
      return
  }
})

export function resetNetworkAttempts() {
  attempts.clear()
}
