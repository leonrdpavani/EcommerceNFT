import { useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"

import type { CheckoutValues } from "@/features/checkout/checkout-schema"

const PREFIX = "kurio:checkout-draft:"

export function readCheckoutDraft(userId: string): Partial<CheckoutValues> | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${userId}`)
    return raw ? (JSON.parse(raw) as Partial<CheckoutValues>) : null
  } catch {
    return null
  }
}

export function clearCheckoutDraft(userId: string) {
  try {
    sessionStorage.removeItem(`${PREFIX}${userId}`)
  } catch {
    // sem sessionStorage
  }
}

/**
 * Guarda o preenchimento do checkout na aba atual. Se a sessão expirar no meio do
 * pagamento, o usuário entra de novo e retoma de onde parou. Limpo no logout.
 */
export function useCheckoutDraft(userId: string | null, form: UseFormReturn<CheckoutValues>) {
  useEffect(() => {
    if (!userId) return
    const subscription = form.watch((values) => {
      try {
        sessionStorage.setItem(`${PREFIX}${userId}`, JSON.stringify(values))
      } catch {
        // sem sessionStorage
      }
    })
    return () => subscription.unsubscribe()
  }, [userId, form])
}
