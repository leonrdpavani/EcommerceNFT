import { setupWorker } from "msw/browser"

import { applyPresetFromUrl } from "./config"
import { getDb } from "./db"
import { handlers } from "./handlers"
import { resumePendingOrders } from "./orders-service"
import { realtimeHandler } from "./realtime"

export const worker = setupWorker(...handlers, realtimeHandler)

/**
 * Inicia o MSW (REST via Service Worker + WebSocket via interceptação no navegador).
 * Requisições fora de /api seguem para a rede normalmente.
 */
export async function startMocking() {
  applyPresetFromUrl()
  await getDb()
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  // Pedidos pendentes de antes do refresh voltam a ser processados.
  await resumePendingOrders()
  // Sinal de prontidão (usado pelos testes antes de controlar a simulação).
  document.documentElement.dataset.mocks = "ready"
}
