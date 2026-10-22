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

/** Prontidão dos mocks: espera a inicialização e, se houver, uma recuperação em andamento. */
export async function whenMocksReady() {
  await gate
  if (recovering) await recovering
}

let recovery: (() => Promise<boolean>) | null = null
let recovering: Promise<boolean> | null = null

/** Registrado pela camada de mocks: pede para ela reassumir a rede. */
export function setMocksRecovery(recover: () => Promise<boolean>) {
  recovery = recover
}

/**
 * Tenta devolver a rede aos mocks (ex.: o navegador reiniciou o service worker do MSW).
 * Chamadas simultâneas compartilham a mesma tentativa. Sem mocks, resolve `false`.
 */
export function recoverMocks() {
  if (!recovery) return Promise.resolve(false)
  recovering ??= recovery().finally(() => {
    recovering = null
  })
  return recovering
}
