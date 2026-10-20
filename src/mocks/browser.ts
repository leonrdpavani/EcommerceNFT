import { setupWorker } from "msw/browser"

import { getDb } from "./db"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers)

/** Inicia o Service Worker do MSW. Requisições fora de /api seguem para a rede normalmente. */
export async function startMocking() {
  await getDb()
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
