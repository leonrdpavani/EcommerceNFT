import { delay } from "msw"

/**
 * Configuração da simulação de rede. Lida do localStorage (`kurio:mock-config`) para
 * ser controlável pela UI de cenários e pelos testes. A etapa de cenários amplia este módulo.
 */
export interface MockConfig {
  /** "none" para testes determinísticos; "normal" simula latência realista. */
  latency: "none" | "normal" | "slow"
  /** Duração da sessão em minutos. */
  sessionMinutes: number
  /** Tempo até a simulação concluir o pagamento, em ms. */
  settleMs: number
}

const CONFIG_KEY = "kurio:mock-config"

const DEFAULTS: MockConfig = { latency: "normal", sessionMinutes: 60 * 24, settleMs: 2500 }

export function getMockConfig(): MockConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    return stored ? { ...DEFAULTS, ...(JSON.parse(stored) as Partial<MockConfig>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function setMockConfig(patch: Partial<MockConfig>) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...getMockConfig(), ...patch }))
}

export async function networkDelay() {
  const { latency } = getMockConfig()
  if (latency === "none") return
  if (latency === "slow") return delay(1800 + Math.random() * 700)
  return delay(150 + Math.random() * 250)
}
