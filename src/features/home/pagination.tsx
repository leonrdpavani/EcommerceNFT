import { Link } from "@tanstack/react-router"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "cn"

interface PaginationProps {
  page: number
  pageCount: number
  className?: string
}

function visiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, index) => index + 1)
  const start = Math.min(Math.max(1, page - 2), pageCount - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
}

const itemClass =
  "flex size-[35px] items-center justify-center rounded-[4px] border border-line text-lg leading-4 text-cream transition-colors hover:border-brand hover:text-brand-text"

/** Paginação do catálogo — cada página é um link que preserva os demais parâmetros da URL. */
export function Pagination({ page, pageCount, className }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className={className}>
      <ul className="flex items-center gap-2">
        {page > 1 ? (
          <li>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: page - 1 })}
              hash="catalogo"
              className={cn(itemClass, "[&_svg]:size-[18px]")}
              aria-label="Página anterior"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Link>
          </li>
        ) : null}
        {visiblePages(page, pageCount).map((number) => {
          const current = number === page
          return (
            <li key={number}>
              <Link
                to="/"
                search={(prev) => ({ ...prev, page: number })}
                hash="catalogo"
                aria-current={current ? "page" : undefined}
                aria-label={`Página ${number}`}
                className={cn(itemClass, current && "border-brand bg-brand font-bold text-ink hover:text-ink")}
              >
                {number}
              </Link>
            </li>
          )
        })}
        {page < pageCount ? (
          <li>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: page + 1 })}
              hash="catalogo"
              className={cn(itemClass, "[&_svg]:size-[18px]")}
              aria-label="Próxima página"
            >
              <ChevronRightIcon aria-hidden="true" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
