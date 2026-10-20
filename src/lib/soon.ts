import { toast } from "sonner"

/**
 * Feedback para ações fora do escopo da entrega (editoriais, suporte, login social…).
 * Deixa claro que nada aconteceu, em vez de simular sucesso.
 */
export function notifyUnavailable(feature: string) {
  toast.info(`${feature} não está disponível nesta demonstração.`)
}
