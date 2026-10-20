/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" desativa os mocks (MSW). Padrão: ativos, inclusive no build de demonstração. */
  readonly VITE_ENABLE_MOCKS?: string
  /** Timeout das requisições REST em ms (padrão 10000). */
  readonly VITE_REQUEST_TIMEOUT_MS?: string
  /** URL do servidor Socket.IO (padrão: a própria origem, interceptada pelo MSW). */
  readonly VITE_REALTIME_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
