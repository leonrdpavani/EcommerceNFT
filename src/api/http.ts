import axios, { AxiosError } from "axios"

import type { ApiErrorBody, ApiErrorCode } from "@/api/contracts"
import { clientStorage } from "@/api/client-storage"
import { whenMocksReady } from "@/api/mocks-gate"

/** Erro normalizado da API — toda falha de transporte vira um ApiError com código estável. */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode | "NETWORK_ERROR" | "TIMEOUT" | "CANCELED"
  readonly fields?: Record<string, string>

  constructor(status: number, code: ApiError["code"], message: string, fields?: Record<string, string>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fields = fields
  }

  /** Falhas que podem ser repetidas com segurança (rede, timeout, 5xx). */
  get isTransient() {
    return this.code === "NETWORK_ERROR" || this.code === "TIMEOUT" || this.code === "TRANSIENT" || this.status >= 500
  }

  get isAuthError() {
    return this.code === "UNAUTHENTICATED" || this.code === "SESSION_EXPIRED"
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS) || 10_000

export const http = axios.create({
  baseURL: "/api",
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
})

http.interceptors.request.use(async (config) => {
  await whenMocksReady()
  const session = clientStorage.getSession()
  if (session) config.headers.set("Authorization", `Bearer ${session.token}`)
  const cartId = clientStorage.getCartId()
  if (cartId) config.headers.set("X-Cart-Id", cartId)
  return config
})

type SessionListener = (reason: "expired" | "unauthenticated") => void
const sessionListeners = new Set<SessionListener>()

/** Notifica a camada de sessão quando a API rejeita o token (expiração durante a navegação). */
export function onSessionRejected(listener: SessionListener) {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(new ApiError(0, "CANCELED", "Requisição cancelada."))
    if (!(error instanceof AxiosError)) return Promise.reject(error)

    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return Promise.reject(new ApiError(0, "TIMEOUT", "A requisição demorou demais para responder."))
    }
    if (!error.response) {
      return Promise.reject(new ApiError(0, "NETWORK_ERROR", "Sem conexão com o servidor. Verifique sua internet."))
    }

    const { status, data, config } = error.response
    const body = data as Partial<ApiErrorBody> | undefined
    const apiError = new ApiError(
      status,
      body?.error?.code ?? (status >= 500 ? "INTERNAL" : "VALIDATION_ERROR"),
      body?.error?.message ?? "Algo deu errado. Tente novamente.",
      body?.error?.fields
    )

    const sentToken = Boolean(config.headers?.Authorization)
    if (apiError.isAuthError && sentToken) {
      sessionListeners.forEach((listener) => listener(apiError.code === "SESSION_EXPIRED" ? "expired" : "unauthenticated"))
    }
    return Promise.reject(apiError)
  }
)
