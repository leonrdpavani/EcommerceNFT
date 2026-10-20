import { cn } from "cn"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATALOG_TABS, SORT_OPTIONS } from "@/lib/catalog"
import type { CatalogSort, CatalogTab } from "@/types/domain"

export function CatalogTabs({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: CatalogTab
  onChange: (tab: CatalogTab) => void
  size?: "md" | "sm"
  className?: string
}) {
  return (
    <div role="group" aria-label="Seleção do catálogo" className={cn("flex items-start overflow-x-auto scrollbar-none", size === "md" ? "gap-5" : "gap-4", className)}>
      {CATALOG_TABS.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={cn(
              "relative shrink-0 cursor-pointer pb-2 leading-4 whitespace-nowrap transition-colors hover:text-brand-text",
              size === "md" ? "text-[15px] font-medium" : "text-sm",
              active
                ? "text-brand-text after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                : "text-cream",
              active && size === "sm" && "font-bold"
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function CatalogSortSelect({
  value,
  onChange,
  className,
}: {
  value: CatalogSort
  onChange: (sort: CatalogSort) => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1 text-[15px] text-cream", className)}>
      <span id="sort-label">Ordenar por:</span>
      <Select value={value} onValueChange={(next) => onChange(next as CatalogSort)}>
        <SelectTrigger
          aria-labelledby="sort-label"
          className="h-auto w-auto gap-1 border-0 p-0 pl-1 text-[15px] hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand-text"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
