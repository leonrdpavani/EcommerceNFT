import { QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { setMocksGate } from "./api/mocks-gate"
import { RouteError } from "./components/feedback/route-error"
import { createQueryClient } from "./api/query-client"
import { routeTree } from "./routeTree.gen"

const queryClient = createQueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: "intent",
  // O TanStack Query controla o cache; o router sempre consulta o loader.
  defaultPreloadStaleTime: 0,
  // Erro inesperado de renderização: mensagem amigável com nova tentativa (não a tela técnica).
  defaultErrorComponent: RouteError,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

/** Mocks ativados por configuração (VITE_ENABLE_MOCKS) — inclusive no build de demonstração. */
async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS === "false") return
  const { startMocking } = await import("./mocks/browser")
  await startMocking()
}

// O MSW (~170 KB) inicia depois da primeira pintura, em tempo ocioso: a interface aparece
// sem esperar por ele; chamadas à API e o Socket.IO aguardam o portão de prontidão.
setMocksGate(
  new Promise<void>((resolve, reject) => {
    const start = () => void enableMocks().then(resolve, reject)
    if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 300 })
    else setTimeout(start, 50)
  })
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
