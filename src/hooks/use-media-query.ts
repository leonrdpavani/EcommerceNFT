import { useSyncExternalStore } from "react"

/** Breakpoint a partir do qual o layout desktop do Figma é usado (Tailwind `lg`). */
export const DESKTOP_QUERY = "(min-width: 64rem)"

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY)
}
