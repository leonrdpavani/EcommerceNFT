import { test as base, expect, type Page } from "@playwright/test"

export const USERS = {
  ana: { email: "ana@kurio.dev", password: "Kurio2026", name: "Ana Colecionadora" },
  bruno: { email: "bruno@kurio.dev", password: "Kurio2026", name: "Bruno Criador" },
}

/** Subconjunto da configuração do MSW (src/mocks/config.ts) usado nos testes. */
export type MockConfig = Partial<{
  latency: "none" | "normal" | "slow" | "variable"
  failure: "none" | "offline" | "server-error" | "transient" | "catalog-error"
  payment: "approve" | "decline"
  wallet: "connect" | "refuse" | "disconnect"
  orderTimeout: boolean
  realtime: "online" | "offline"
  sessionMinutes: number
  settleMs: number
}>

/**
 * Cada teste começa com: banco simulado no seed (contexto novo = localStorage vazio)
 * e rede sem latência artificial, para resultados determinísticos.
 */
export const test = base.extend<{ mockConfig: MockConfig; isMobile: boolean }>({
  mockConfig: [{}, { option: true }],
  isMobile: async ({ viewport }, use) => {
    await use((viewport?.width ?? 1440) < 1024)
  },
  page: async ({ page, mockConfig }, use) => {
    await page.addInitScript((config) => {
      if (!sessionStorage.getItem("kurio:e2e-init")) {
        localStorage.setItem("kurio:mock-config", JSON.stringify({ latency: "none", settleMs: 800, ...config }))
        sessionStorage.setItem("kurio:e2e-init", "1")
        // A aba do painel de cenários é uma ferramenta de demonstração: oculta nos testes.
        sessionStorage.setItem("kurio:scenario-panel-hidden", "1")
      }
    }, mockConfig)
    await use(page)
  },
})

export { expect }

/** Altera o cenário do servidor simulado (passa pelo handler MSW de controle). */
/** Aguarda o MSW controlar a página (antes disso, fetch iria direto ao servidor de desenvolvimento). */
export async function waitForMocks(page: Page) {
  await page.locator("html[data-mocks=ready]").waitFor({ state: "attached" })
}

export async function setMockConfig(page: Page, patch: MockConfig) {
  await waitForMocks(page)
  await page.evaluate(async (body) => {
    await fetch("/api/__mock/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  }, patch)
}

/** Dispara uma ação do servidor simulado (eventos Socket.IO, expiração de sessão…). */
export async function mockAction(page: Page, action: string, body: Record<string, string> = {}) {
  await waitForMocks(page)
  return page.evaluate(
    async ({ action, body }) => {
      const response = await fetch(`/api/__mock/actions/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      return response.json()
    },
    { action, body }
  )
}

/** Aguarda o cliente Socket.IO estar conectado (e autenticado, se `userId`) ao servidor simulado. */
export async function waitForRealtime(page: Page, userId?: string) {
  await waitForMocks(page)
  await expect
    .poll(async () => {
      const { clients } = await page.evaluate(() => fetch("/api/__mock/realtime/clients").then((res) => res.json()))
      return (clients as { userId: string | null }[]).some((client) => (userId ? client.userId === userId : true))
    })
    .toBe(true)
}

/** Faz login pela interface (modal no desktop, tela no mobile). */
export async function login(page: Page, user = USERS.ana, redirect?: string) {
  await page.goto(redirect ? `/entrar?redirect=${encodeURIComponent(redirect)}` : "/entrar")
  await submitLogin(page, user)
  await expect(page.getByText(`Bem-vindo(a), ${user.name}!`)).toBeVisible()
}

export async function submitLogin(page: Page, user = USERS.ana) {
  await page.getByPlaceholder("contato@email.com").fill(user.email)
  await page.getByPlaceholder("Senha", { exact: true }).fill(user.password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
}

/** Adiciona um NFT ao carrinho a partir da página de detalhe. */
export async function addToCartFromDetail(page: Page, nftId: string, { isMobile }: { isMobile: boolean }) {
  await page.goto(`/nft/${nftId}`)
  if (isMobile) await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  else await page.getByRole("button", { name: "COMPRAR", exact: true }).click()
  await expect(page.getByText(/adicionado ao carrinho/).first()).toBeVisible()
}

/** Itens do carrinho: tabela no desktop, lista no mobile (ambas nomeadas "Itens no carrinho"). */
export function cartItems(page: Page) {
  return page.getByRole("table", { name: "Itens no carrinho" }).or(page.getByRole("list", { name: "Itens no carrinho" }))
}

/** Do pagamento (dados pré-preenchidos da Ana) até a revisão com a carteira conectada. */
export async function openReviewAndConnect(page: Page) {
  await page.goto("/pagamento")
  await expect(page.getByRole("button", { name: "Confirmar compra" })).toBeEnabled()
  await expect(page.getByLabel(/Endereço da carteira/)).not.toHaveValue("")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  const dialog = page.getByRole("dialog", { name: "Revise seu pedido" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(dialog.getByText("Carteira conectada")).toBeVisible()
  return dialog
}
