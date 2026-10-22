import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Paginação de um trilho horizontal com scroll-snap (CSS): número de páginas, página atual
 * (atualizada ao rolar/arrastar) e navegação programática para os indicadores.
 */
export function useSnapPager<T extends HTMLElement>() {
  const trackRef = useRef<T>(null)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(0)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const pages = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth - 0.05))
    setPageCount(pages)
    setPage(Math.min(pages - 1, Math.round(track.scrollLeft / track.clientWidth)))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    track.addEventListener("scroll", measure, { passive: true })
    return () => {
      observer.disconnect()
      track.removeEventListener("scroll", measure)
    }
  }, [measure])

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" })
  }, [])

  return { trackRef, page, pageCount, goTo }
}
