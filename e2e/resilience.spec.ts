import type { Page } from "@playwright/test"

import { expect, login, mockAction, setMockConfig, submitLogin, test, USERS, addToCartFromDetail, waitForMocks } from "./fixtures"

test.describe("Falhas, carregamento e sessão", () => {
  test.describe("rede lenta", () => {
    test.use({ mockConfig: { latency: "slow" } })

    test("skeletons durante carregamento lento do catálogo e do detalhe", async ({ page }) => {
      await page.goto("/")
      await expect(page.locator(".animate-shimmer").first()).toBeVisible()
      await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first()).toBeVisible({
        timeout: 10_000,
      })

      await page.goto("/nft/golden-beat-207")
      await expect(page.getByRole("status", { name: "Carregando NFT" })).toBeVisible()
      await expect(page.getByRole("heading", { level: 1, name: "Golden Beat #207" })).toBeVisible({ timeout: 10_000 })
    })

    test("skeleton respeita a preferência por movimento reduzido", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto("/")
      const skeleton = page.locator(".animate-shimmer").first()
      await expect(skeleton).toBeVisible()
      const duration = await skeleton.evaluate((element) => parseFloat(getComputedStyle(element).animationDuration))
      expect(duration).toBeLessThan(0.01)
    })
  })

  test("falha do catálogo mostra erro e recupera com nova tentativa", async ({ page }) => {
    await page.goto("/")
    await setMockConfig(page, { failure: "catalog-error" })
    await page.goto("/?page=2")
    await expect(page.getByRole("alert").filter({ hasText: "O catálogo está indisponível no momento." })).toBeVisible({
      timeout: 10_000,
    })
    await setMockConfig(page, { failure: "none" })
    await page.getByRole("button", { name: "Tentar novamente" }).click()
    await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first()).toBeVisible()
  })

  test("falha transitória é recuperada automaticamente pelo retry das consultas", async ({ page }) => {
    await page.goto("/nft/emerald-ape-042")
    await setMockConfig(page, { failure: "transient" })
    await page.goto("/nft/ivory-baron-088")
    await expect(page.getByRole("heading", { level: 1, name: "Ivory Baron #088" })).toBeVisible({ timeout: 10_000 })
  })

  test.describe("latência variável", () => {
    test.use({ mockConfig: { latency: "variable" } })

    test("respostas fora de ordem não sobrescrevem a busca mais recente", async ({ page, isMobile }) => {
      test.skip(isMobile, "Filtros laterais do desktop.")
      await page.goto("/")
      const filters = page.getByRole("complementary", { name: "Filtros do catálogo" })
      await expect(filters.getByRole("button", { name: /^Música/ })).toBeVisible({ timeout: 10_000 })
      await filters.getByRole("button", { name: /^Música/ }).click()
      await filters.getByRole("button", { name: /^Fotografia/ }).click()
      await filters.getByRole("button", { name: /^Música/ }).click()
      // Estado final: só Fotografia.
      await expect(page).toHaveURL(/fotografia/)
      await expect(page).not.toHaveURL(/musica/)
      const catalog = page.getByRole("region", { name: "Catálogo de NFTs" })
      await expect(catalog.getByRole("article")).toHaveCount(4, { timeout: 10_000 })
      await expect(catalog.getByRole("heading", { name: "Ivory Baron #088" })).toBeVisible()
    })
  })

  test("sessão expira durante o checkout e o preenchimento é retomado após o login", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await page.goto("/pagamento")
    if (isMobile) await page.getByText("Dados do colecionador").click()
    const note = page.getByLabel("Observação do colecionador (opcional)")
    await expect(page.getByLabel(/Endereço da carteira/)).not.toHaveValue("")
    await note.fill("Entregar na carteira principal, por favor.")

    await mockAction(page, "expire-sessions")
    await page.getByRole("button", { name: "Confirmar compra" }).click()
    await page.getByRole("dialog", { name: "Revise seu pedido" }).getByRole("button", { name: "Conectar carteira" }).click()

    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fpagamento/)
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Sua sessão expirou. Entre novamente para continuar." })
    ).toBeVisible()
    await submitLogin(page, USERS.ana)
    await expect(page).toHaveURL(/\/pagamento/)
    if (isMobile) await page.getByText("Dados do colecionador").click()
    await expect(page.getByLabel("Observação do colecionador (opcional)")).toHaveValue(
      "Entregar na carteira principal, por favor."
    )
  })

  test("troca de usuário não expõe dados privados do usuário anterior", async ({ page, isMobile }) => {
    test.skip(isMobile, "Fluxo de conta validado no desktop.")
    await login(page, USERS.ana)
    await page.goto("/favoritos")
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible()

    await page.goto("/conta/perfil")
    await page.getByRole("button", { name: /^Sair/ }).click()
    await expect(page).toHaveURL("/")

    await login(page, USERS.bruno)
    await page.goto("/favoritos")
    await expect(page.getByRole("heading", { name: "Nenhum favorito por aqui" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toHaveCount(0)
    await page.goto("/conta/carteiras")
    await expect(page.getByLabel(/Endereço da carteira/).first()).toHaveValue("")
  })

  test.describe("service worker do MSW encerrado pelo navegador", () => {
    // Aba aberta por muito tempo (ou em segundo plano): o Chrome encerra o service worker ocioso e,
    // ao reiniciar, ele esquece a aba. Sem recuperação, /api ia para a rede e voltava o index.html.
    async function stopServiceWorker(page: Page) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("ServiceWorker.enable")
      await cdp.send("ServiceWorker.stopAllWorkers")
      await cdp.detach()
    }

    test("navegação continua funcionando depois que o worker reinicia", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Controle do service worker via CDP.")
      await page.goto("/")
      await waitForMocks(page)
      const catalog = page.getByRole("region", { name: "Catálogo de NFTs" })
      await expect(catalog.getByRole("article").first()).toBeVisible()

      await stopServiceWorker(page)
      await catalog.getByRole("link", { name: "Sage Nomad #009" }).first().click()
      await expect(page.getByRole("heading", { level: 1, name: "Sage Nomad #009" })).toBeVisible()
      await expect(page.getByText("Something went wrong!")).toHaveCount(0)
    })

    test("aba volta a ficar visível: os mocks são reativados antes da próxima requisição", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Controle do service worker via CDP.")
      const fromNetwork: string[] = []
      page.on("response", (response) => {
        if (new URL(response.url()).pathname.startsWith("/api/") && !response.fromServiceWorker())
          fromNetwork.push(response.url())
      })
      await page.goto("/")
      await waitForMocks(page)
      await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first()).toBeVisible()

      await stopServiceWorker(page)
      // Simula a volta para a aba (visibilitychange).
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")))
      await page.waitForTimeout(300)
      await page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("link", { name: "Golden Beat #207" }).first().click()
      await expect(page.getByRole("heading", { level: 1, name: "Golden Beat #207" })).toBeVisible()
      expect(fromNetwork).toEqual([])
    })
  })
})
