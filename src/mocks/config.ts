/**
 * Configuração dos cenários da simulação. Fica no localStorage (`kurio:mock-config`)
 * para ser controlável pelo painel de cenários, por URL (`?cenario=`) e pelos testes.
 * Todos os cenários são determinísticos: não dependem de sorteio.
 */
export interface MockConfig {
  /**
   * Latência da rede:
   * - none: instantânea (testes)
   * - normal: 150–400 ms
   * - slow: ~2,5 s (exercita skeletons)
   * - variable: sequência fixa de atrasos diferentes — gera respostas fora de ordem
   */
  latency: "none" | "normal" | "slow" | "variable"
  /**
   * Falhas aplicadas às rotas de negócio:
   * - none
   * - offline: falha de conexão em todas as requisições
   * - server-error: HTTP 500 em todas as requisições
   * - transient: a 1ª tentativa de cada rota falha com 503; a seguinte funciona
   * - catalog-error: HTTP 500 apenas no catálogo
   */
  failure: "none" | "offline" | "server-error" | "transient" | "catalog-error"
  /** Resultado do pagamento na simulação. */
  payment: "approve" | "decline"
  /** Comportamento da carteira: conecta, recusa a conexão ou desconecta antes do envio. */
  wallet: "connect" | "refuse" | "disconnect"
  /** O pedido é criado, mas a resposta chega depois do timeout do cliente (1ª tentativa). */
  orderTimeout: boolean
  /** Servidor de tempo real disponível ou fora do ar (recusa conexões). */
  realtime: "online" | "offline"
  /** Duração da sessão em minutos. */
  sessionMinutes: number
  /** Tempo até a simulação concluir o pagamento, em ms. */
  settleMs: number
}

export const CONFIG_KEY = "kurio:mock-config"

export const DEFAULT_CONFIG: MockConfig = {
  latency: "normal",
  failure: "none",
  payment: "approve",
  wallet: "connect",
  orderTimeout: false,
  realtime: "online",
  sessionMinutes: 60 * 24,
  settleMs: 4000,
}

/** Cenários prontos selecionáveis pelo painel ou por `?cenario=<id>`. */
export const PRESETS: Record<string, { label: string; description: string; config: Partial<MockConfig> }> = {
  padrao: { label: "Padrão", description: "Rede normal, pagamento aprovado.", config: {} },
  lento: { label: "Rede lenta", description: "Respostas em ~2,5 s — skeletons visíveis.", config: { latency: "slow" } },
  "fora-de-ordem": {
    label: "Latência variável",
    description: "Atrasos diferentes por requisição — respostas chegam fora de ordem.",
    config: { latency: "variable" },
  },
  offline: { label: "Sem conexão", description: "Todas as requisições falham por rede.", config: { failure: "offline" } },
  "erro-servidor": { label: "Erro 500", description: "O servidor responde 500 em tudo.", config: { failure: "server-error" } },
  instavel: { label: "Falha transitória", description: "1ª tentativa falha com 503; a seguinte funciona.", config: { failure: "transient" } },
  "catalogo-erro": { label: "Catálogo indisponível", description: "Só o catálogo responde 500.", config: { failure: "catalog-error" } },
  "pagamento-recusado": { label: "Pagamento recusado", description: "A carteira recusa a transação.", config: { payment: "decline" } },
  "carteira-recusa": { label: "Carteira recusa conexão", description: "O usuário recusa conectar a carteira.", config: { wallet: "refuse" } },
  "carteira-desconecta": {
    label: "Carteira desconecta",
    description: "A carteira desconecta antes do envio do pedido.",
    config: { wallet: "disconnect" },
  },
  "timeout-pedido": {
    label: "Timeout no pedido",
    description: "O pedido é criado, mas a resposta excede o timeout; a nova tentativa recupera o mesmo pedido.",
    config: { orderTimeout: true },
  },
  "tempo-real-offline": {
    label: "Tempo real fora do ar",
    description: "O servidor Socket.IO recusa conexões; o cliente tenta reconectar.",
    config: { realtime: "offline" },
  },
  "sessao-curta": { label: "Sessão curta", description: "Sessões expiram em 1 minuto.", config: { sessionMinutes: 1 } },
}

export function getMockConfig(): MockConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    return stored ? { ...DEFAULT_CONFIG, ...(JSON.parse(stored) as Partial<MockConfig>) } : DEFAULT_CONFIG
  } catch {
    return DEFAULT_CONFIG
  }
}

export function setMockConfig(patch: Partial<MockConfig>) {
  const next = { ...getMockConfig(), ...patch }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
  return next
}

export function resetMockConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG))
  return DEFAULT_CONFIG
}

/** Aplica `?cenario=<id>` da URL (útil para demonstração e links de reprodução). */
export function applyPresetFromUrl() {
  const preset = new URL(window.location.href).searchParams.get("cenario")
  if (preset && PRESETS[preset]) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...DEFAULT_CONFIG, ...PRESETS[preset].config }))
  }
}

const VARIABLE_DELAYS = [900, 120, 650, 60, 1300, 300, 450, 80]
let variableIndex = 0

/** Atraso da requisição conforme o cenário de latência. */
export function latencyMs(config = getMockConfig()) {
  switch (config.latency) {
    case "none":
      return 0
    case "slow":
      return 2500
    case "variable":
      variableIndex = (variableIndex + 1) % VARIABLE_DELAYS.length
      return VARIABLE_DELAYS[variableIndex]
    default:
      return 150 + ((variableIndex++ * 97) % 250)
  }
}
