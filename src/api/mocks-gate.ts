/**
 * Portão de prontidão dos mocks. A interface renderiza imediatamente; apenas as chamadas
 * à API (Axios) e a conexão Socket.IO aguardam o MSW assumir a rede. Sem mocks, resolve na hora.
 */
let gate: Promise<void> = Promise.resolve()

export function setMocksGate(promise: Promise<unknown>) {
  // Se o MSW falhar ao iniciar, as requisições seguem (e falham de forma visível) em vez de travar.
  gate = promise.then(
    () => undefined,
    (error: unknown) => console.error("[mocks] falha ao iniciar o MSW", error)
  )
}

export function whenMocksReady() {
  return gate
}
