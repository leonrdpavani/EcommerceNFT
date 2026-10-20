import { QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
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

void enableMocks().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
})
