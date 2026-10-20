import { SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { useId, useState } from "react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CatalogFilters, type CatalogPatch } from "@/features/home/catalog-filters"
import { CatalogSortSelect } from "@/features/home/catalog-toolbar"
import type { CatalogSearch } from "@/lib/catalog-search"
import type { CategoryId, NetworkId } from "@/types/domain"

interface MobileCatalogControlsProps {
  search: CatalogSearch
  facets: { categories: Partial<Record<CategoryId, number>>; networks: Partial<Record<NetworkId, number>> }
  onChange: (patch: CatalogPatch) => void
  onReset: () => void
}

/** Barra de busca + botão de filtros do mobile (Figma: Mobile / Início › Search Bar). */
export function MobileCatalogControls({ search, facets, onChange, onReset }: MobileCatalogControlsProps) {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const activeFilters = search.categories.length + search.networks.length + (search.min !== undefined || search.max !== undefined ? 1 : 0)

  return (
    <div className="flex gap-2">
      <form
        role="search"
        className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface px-3 focus-within:outline-2 focus-within:outline-brand-text"
        onSubmit={(event) => {
          event.preventDefault()
          const term = new FormData(event.currentTarget).get("q")?.toString().trim()
          onChange({ q: term || undefined })
        }}
      >
        <SearchIcon className="size-[22px] shrink-0 text-taupe" aria-hidden="true" />
        <label htmlFor={inputId} className="sr-only">
          Buscar NFTs
        </label>
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          name="q"
          key={search.q ?? ""}
          defaultValue={search.q ?? ""}
          placeholder="Explorar coleções"
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-cream outline-none placeholder:text-taupe"
        />
      </form>

      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex size-[45px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] bg-[linear-gradient(137deg,rgb(210_138_76/0.45)_25%,#d28a4c_100%)] text-ink"
          aria-label={activeFilters ? `Filtros (${activeFilters} ativos)` : "Filtros"}
          aria-haspopup="dialog"
        >
          <SlidersHorizontalIcon className="size-[22px]" aria-hidden="true" />
          {activeFilters ? (
            <span aria-hidden="true" className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-ink bg-cream text-[9px] font-bold text-ink box-content">
              {activeFilters}
            </span>
          ) : null}
        </button>
        <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-[31px] border-t-0 pb-6">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription className="text-sand">Refine o catálogo por coleção, preço e rede.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-2">
            <CatalogSortSelect value={search.sort} onChange={(sort) => onChange({ sort })} />
          </div>
          <CatalogFilters search={search} facets={facets} onChange={onChange} onReset={onReset} className="bg-transparent px-6" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
