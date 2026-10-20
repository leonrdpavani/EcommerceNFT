import { useState } from "react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CATEGORIES, NETWORKS, PRICE_BOUNDS } from "@/lib/catalog"
import type { CatalogSearch } from "@/lib/catalog-search"
import type { CategoryId, NetworkId } from "@/types/domain"

export type CatalogPatch = Partial<Omit<CatalogSearch, "page">>

interface CatalogFiltersProps {
  search: CatalogSearch
  facets: { categories: Partial<Record<CategoryId, number>>; networks: Partial<Record<NetworkId, number>> }
  onChange: (patch: CatalogPatch) => void
  onReset: () => void
  className?: string
}

const priceFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

/** Painel de filtros do catálogo (Figma: componente "Filters"). */
export function CatalogFilters({ search, facets, onChange, onReset, className }: CatalogFiltersProps) {
  const committed: [number, number] = [search.min ?? PRICE_BOUNDS.min, search.max ?? PRICE_BOUNDS.max]
  const [range, setRange] = useState<[number, number]>(committed)
  const [lastCommitted, setLastCommitted] = useState(committed)
  // Sincroniza o slider quando a URL muda (histórico, limpar filtros) sem efeito colateral.
  if (lastCommitted[0] !== committed[0] || lastCommitted[1] !== committed[1]) {
    setLastCommitted(committed)
    setRange(committed)
  }

  const hasFilters =
    search.categories.length > 0 || search.networks.length > 0 || search.min !== undefined || search.max !== undefined

  return (
    <div className={cn("flex flex-col gap-10 bg-surface p-5", className)}>
      <FilterGroup title="Coleções">
        {CATEGORIES.map((category) => (
          <FilterOption
            key={category.id}
            label={category.label}
            count={facets.categories[category.id] ?? 0}
            selected={search.categories.includes(category.id)}
            boldCount
            onClick={() => onChange({ categories: toggle(search.categories, category.id) })}
          />
        ))}
      </FilterGroup>

      <section aria-labelledby="filter-price" className="flex flex-col gap-3">
        <h3 id="filter-price" className="text-lg leading-4 font-bold text-cream">
          Faixa de preço
        </h3>
        <div className="flex flex-col gap-3 pl-3">
          <Slider
            min={PRICE_BOUNDS.min}
            max={PRICE_BOUNDS.max}
            step={0.01}
            minStepsBetweenThumbs={1}
            value={range}
            onValueChange={(value) => setRange([value[0], value[1]] as [number, number])}
            thumbLabels={["Preço mínimo", "Preço máximo"]}
            formatValueText={(value) => `${priceFormatter.format(value)} ETH`}
            className="py-2"
          />
          <p className="text-[15px] text-cream" aria-live="polite">
            Preço: {priceFormatter.format(range[0])} - {priceFormatter.format(range[1])} ETH
          </p>
          <Button
            size="sm"
            className="h-9 w-fit rounded-md px-3 text-base"
            onClick={() =>
              onChange({
                min: range[0] <= PRICE_BOUNDS.min ? undefined : Number(range[0].toFixed(2)),
                max: range[1] >= PRICE_BOUNDS.max ? undefined : Number(range[1].toFixed(2)),
              })
            }
          >
            Aplicar
          </Button>
        </div>
      </section>

      <FilterGroup title="Rede">
        {NETWORKS.map((network) => (
          <FilterOption
            key={network.id}
            label={network.label}
            count={facets.networks[network.id] ?? 0}
            selected={search.networks.includes(network.id)}
            onClick={() => onChange({ networks: toggle(search.networks, network.id) })}
          />
        ))}
      </FilterGroup>

      {hasFilters ? (
        <Button variant="link" className="-mt-4 w-fit text-sm" onClick={onReset}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `filter-${title.toLowerCase()}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-lg leading-4 font-bold text-cream">
        {title}
      </h3>
      <ul className="flex flex-col px-3">{children}</ul>
    </section>
  )
}

function FilterOption({
  label,
  count,
  selected,
  boldCount,
  onClick,
}: {
  label: string
  count: number
  selected: boolean
  boldCount?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          "relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-xs text-left text-[15px] leading-10 transition-colors hover:text-brand-text",
          selected ? "text-brand-text" : "text-sand"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 -left-3 size-1.5 -translate-y-1/2 rounded-full bg-brand-text transition-opacity",
            selected ? "opacity-100" : "opacity-0"
          )}
        />
        <span className={cn(selected && "underline decoration-brand/60 underline-offset-4")}>{label}</span>
        <span className={cn(boldCount && "font-bold")}>
          ({count})<span className="sr-only"> NFTs</span>
        </span>
      </button>
    </li>
  )
}
