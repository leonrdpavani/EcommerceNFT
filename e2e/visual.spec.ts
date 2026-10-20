import type { Page } from "@playwright/test"

import { addToCartFromDetail, expect, login, test, USERS } from "./fixtures"

/**
 * Regressão visual das telas principais. Dados estáveis: seed do MSW, rede sem latência,
 * animações desligadas e todas as imagens/fontes carregadas antes da captura.
 * Baselines versionadas em e2e/__screenshots__ (geradas no Chromium do Playwright).
 * Atualizar: npm run test:visual:update
 */
async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    for (const image of Array.from(document.images)) image.loading = "eager"
    await Promise.all(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true })
              image.addEventListener("error", () => resolve(), { once: true })
            })
        )
    )
    await document.fonts.ready
  })
  await page.waitForLoadState("networkidle")
}

async function settle(page: Page) {
  await waitForImages(page)
  // A captura de página inteira muda a área visível; o navegador pode escolher outra
  // resolução do srcset. Uma captura de aquecimento estabiliza as imagens antes da comparação.
  await page.screenshot({ fullPage: true, animations: "disabled" })
  await waitForImages(page)
  await page.evaluate(() => window.scrollTo(0, 0))
}

const screenshotOptions = (page: Page) => ({
  fullPage: true,
  animations: "disabled" as const,
  caret: "hide" as const,
  maxDiffPixelRatio: 0.01,
  // Capturas de página inteira são lentas com vários workers em paralelo.
  timeout: 20_000,
  mask: [page.locator("[data-sonner-toaster]")],
})

test.describe("Regressão visual", () => {
  test("início", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article")).toHaveCount(9)
    await settle(page)
    await expect(page).toHaveScreenshot("inicio.png", screenshotOptions(page))
  })

  test("detalhe do NFT", async ({ page }) => {
    await page.goto("/nft/emerald-ape-042")
    await expect(page.getByRole("heading", { level: 1, name: "Emerald Ape #042" })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot("detalhe.png", screenshotOptions(page))
  })

  test("carrinho", async ({ page, isMobile }) => {
    await addToCartFromDetail(page, "emerald-ape-042", { isMobile })
    await addToCartFromDetail(page, "ivory-baron-088", { isMobile })
    await page.goto("/carrinho")
    await expect(page.getByText("2.996 ETH").first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot("carrinho.png", screenshotOptions(page))
  })

  test("pagamento", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "emerald-ape-042", { isMobile })
    await page.goto("/pagamento")
    await expect(page.getByLabel(/Endereço da carteira/)).not.toHaveValue("")
    await expect(page.getByText("1.206 ETH").first()).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot("pagamento.png", screenshotOptions(page))
  })
})
