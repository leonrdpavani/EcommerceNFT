import { expect, test } from "./fixtures"

test.describe("Catálogo", () => {
  test("filtros combinados e ordenação compõem a URL e sobrevivem ao refresh", async ({ page, isMobile }) => {
    test.skip(isMobile, "Os filtros do mobile ficam em uma gaveta; coberto no teste de mobile.")
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible()

    const filters = page.getByRole("complementary", { name: "Filtros do catálogo" })
    await filters.getByRole("button", { name: /^Música/ }).click()
    await expect(page).toHaveURL(/categories=%5B%22musica%22%5D|categories=.*musica/)
    await filters.getByRole("button", { name: /^Polygon/ }).click()
    await expect(page).toHaveURL(/networks=.*polygon/)

    const cards = page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article")
    await expect(cards).toHaveCount(1)
    await expect(page.getByRole("heading", { name: "Golden Beat #207" })).toBeVisible()

    await page.reload()
    await expect(page.getByRole("heading", { name: "Golden Beat #207" })).toBeVisible()
    await expect(filters.getByRole("button", { name: /^Música/ })).toHaveAttribute("aria-pressed", "true")
  })

  test("mudança de filtro reinicia a paginação e o histórico restaura o estado", async ({ page, isMobile }) => {
    test.skip(isMobile, "Paginação por links validada no desktop.")
    await page.goto("/?page=3")
    await expect(page.getByRole("link", { name: "Página 3" })).toHaveAttribute("aria-current", "page")

    await page.getByRole("complementary", { name: "Filtros do catálogo" }).getByRole("button", { name: /^Arte digital/ }).click()
    await expect(page).not.toHaveURL(/page=3/)

    await page.goBack()
    await expect(page).toHaveURL(/page=3/)
    await expect(page.getByRole("link", { name: "Página 3" })).toHaveAttribute("aria-current", "page")
  })

  test("busca sem resultados mostra estado vazio e permite limpar", async ({ page }) => {
    await page.goto("/?q=inexistente-xyz")
    await expect(page.getByRole("heading", { name: "Nenhum NFT encontrado" })).toBeVisible()
    await page.getByRole("button", { name: "Limpar busca e filtros" }).click()
    await expect(page.getByRole("heading", { name: "Emerald Ape #042" })).toBeVisible()
  })

  test("ordenação por menor preço reflete os parâmetros enviados à API", async ({ page }) => {
    const request = page.waitForRequest((req) => req.url().includes("/api/nfts?") && req.url().includes("sort=preco-asc"))
    await page.goto("/?sort=preco-asc")
    await request
    await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first().getByRole("heading")).toHaveText("Thistle Nomad #359")
  })

  test("filtros no mobile ficam na gaveta e atualizam a URL", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Específico do mobile.")
    await page.goto("/")
    await page.getByRole("button", { name: "Filtros" }).click()
    const sheet = page.getByRole("dialog", { name: "Filtros" })
    await sheet.getByRole("button", { name: /^Fotografia/ }).click()
    await expect(page).toHaveURL(/fotografia/)
  })
})
