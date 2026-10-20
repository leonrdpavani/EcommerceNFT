import { useSyncExternalStore } from "react"

export type RealtimeStatus = "idle" | "connecting" | "connected" | "reconnecting" | "offline"

let status: RealtimeStatus = "idle"
const listeners = new Set<() => void>()

export function setRealtimeStatus(next: RealtimeStatus) {
  if (next === status) return
  status = next
  listeners.forEach((listener) => listener())
}

export function getRealtimeStatus() {
  return status
}

/** Estado da conexão em tempo real, para indicadores e fallback de consulta periódica. */
export function useRealtimeStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
    () => status
  )
}
