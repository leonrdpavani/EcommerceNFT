import { setupWorker } from "msw/browser"

import { recoverMocks, setMocksRecovery } from "@/api/mocks-gate"

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
  keepWorkerAttached()
  // Pedidos pendentes de antes do refresh voltam a ser processados.
  await resumePendingOrders()
  // Sinal de prontidão (usado pelos testes antes de controlar a simulação).
  document.documentElement.dataset.mocks = "ready"
}

/**
 * O navegador encerra service workers ociosos (ex.: aba muito tempo em segundo plano). Ao
 * reiniciar, o worker do MSW perde a lista de abas ativas (fica só em memória) e passa a
 * deixar /api ir para a rede — que, numa SPA hospedada, devolve o index.html.
 *
 * `MOCK_ACTIVATE` é a mesma mensagem que o `worker.start()` envia: idempotente, apenas
 * registra esta aba de novo. A interceptação de WebSocket (Socket.IO) não passa pelo
 * service worker e não é afetada.
 */
function reattachWorker() {
  const serviceWorker = navigator.serviceWorker?.controller
  if (!serviceWorker) return Promise.resolve(false)

  return new Promise<boolean>((resolve) => {
    const done = (attached: boolean) => {
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener("message", onMessage)
      resolve(attached)
    }
    const onMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "MOCKING_ENABLED") done(true)
    }
    const timeout = window.setTimeout(done, 3000, false)
    navigator.serviceWorker.addEventListener("message", onMessage)
    serviceWorker.postMessage("MOCK_ACTIVATE")
  })
}

function keepWorkerAttached() {
  // Sob demanda: o Axios pede a recuperação ao receber uma resposta que não veio dos mocks.
  setMocksRecovery(reattachWorker)
  // Preventivo: ao voltar para a aba. As requisições disparadas enquanto isso aguardam a
  // confirmação do worker (whenMocksReady), para não escaparem antes do novo registro.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void recoverMocks()
  })
}
