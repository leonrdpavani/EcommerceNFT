import { lazy, Suspense, useState } from "react"

const SearchDialog = lazy(() => import("@/components/layout/search-dialog").then((module) => ({ default: module.SearchDialog })))

/**
 * Carrega o diálogo de busca só na primeira abertura (o Radix Dialog sai do bundle inicial).
 * Depois disso permanece montado, preservando a animação de saída e o retorno do foco.
 */
export function LazySearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [requested, setRequested] = useState(open)
  if (open && !requested) setRequested(true)
  if (!requested) return null
  return (
    <Suspense fallback={null}>
      <SearchDialog open={open} onOpenChange={onOpenChange} />
    </Suspense>
  )
}
