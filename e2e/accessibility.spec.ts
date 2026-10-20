import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"

import { addToCartFromDetail, expect, login, openReviewAndConnect, test, USERS } from "./fixtures"

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

async function expectNoViolations(page: Page, context: string) {
  // Aguarda animações de entrada (dialogs, toasts) terminarem antes de auditar.
  await page.waitForTimeout(400)
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    // Toasts são transitórios e auditados pela própria biblioteca (sonner).
    .exclude("[data-sonner-toaster]")
    .analyze()
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 3).map((node) => node.target.join(" ")),
  }))
  // O relatório completo fica anexado ao teste (relatório HTML do Playwright).
  await test.info().attach(`axe-${context}`, {
    body: JSON.stringify({ context, viewport: page.viewportSize()?.width, violations: results.violations }, null, 2),
    contentType: "application/json",
  })
  if (process.env.A11Y_REPORT) {
    const fs = await import("node:fs")
    fs.appendFileSync(process.env.A11Y_REPORT, `${JSON.stringify({ context, viewport: page.viewportSize()?.width, summary })}\n`)
  }
  expect.soft(summary, `Violações de acessibilidade em ${context}`).toEqual([])
}

test.describe("Acessibilidade (axe, WCAG 2.2 AA)", () => {
  test("páginas públicas", async ({ page }) => {
    // Cinco páginas auditadas em sequência; costuma ser o primeiro teste, com o dev server ainda frio.
    test.setTimeout(60_000)
    await page.goto("/")
    await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first()).toBeVisible()
    await expectNoViolations(page, "início")

    await page.goto("/nft/emerald-ape-042")
    await expect(page.getByRole("heading", { level: 1, name: "Emerald Ape #042" })).toBeVisible()
    await expectNoViolations(page, "detalhe")

    await page.goto("/entrar")
    await expect(page.getByPlaceholder("contato@email.com")).toBeVisible()
    await expectNoViolations(page, "login")

    await page.goto("/cadastro")
    await expect(page.getByPlaceholder("Confirmar senha")).toBeVisible()
    await expectNoViolations(page, "cadastro")

    await page.goto("/pagina-inexistente")
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
    await expectNoViolations(page, "404")
  })

  test("fluxo de compra e conta", async ({ page, isMobile }) => {
    test.setTimeout(60_000)
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })

    await page.goto("/carrinho")
    await expect(page.getByRole("button", { name: "Conectar e finalizar" })).toBeEnabled()
    await expectNoViolations(page, "carrinho")

    await page.goto("/pagamento")
    await expect(page.getByLabel(/Endereço da carteira/)).not.toHaveValue("")
    await expectNoViolations(page, "pagamento")

    const dialog = await openReviewAndConnect(page)
    await expectNoViolations(page, "revisão do pedido")
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible()
    await expectNoViolations(page, "recibo")

    await page.goto("/conta/perfil")
    await expect(page.getByLabel(/Nome de exibição/)).toHaveValue(USERS.ana.name)
    await expectNoViolations(page, "perfil")

    await page.goto("/conta/carteiras")
    await expect(page.getByRole("heading", { name: "Carteira principal" })).toBeVisible()
    await expectNoViolations(page, "carteiras")

    await page.goto("/favoritos")
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible()
    await expectNoViolations(page, "favoritos")
  })
})
