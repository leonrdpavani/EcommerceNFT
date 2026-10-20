import { expect, test } from "./fixtures"

test.describe("Detalhe do NFT", () => {
  test("acesso direto carrega o NFT pela API", async ({ page }) => {
    await page.goto("/nft/ivory-baron-088")
    await expect(page.getByRole("heading", { level: 1, name: "Ivory Baron #088" })).toBeVisible()
    await expect(page.getByText("ID do token:").first()).toBeVisible()
  })

  test("NFT inexistente mostra a página de não encontrado", async ({ page }) => {
    await page.goto("/nft/nao-existe-123")
    await expect(page.getByRole("heading", { name: "NFT não encontrado" })).toBeVisible()
    await page.getByRole("link", { name: "Voltar ao início" }).click()
    await expect(page).toHaveURL("/")
  })

  test("edição esgotada fica indisponível e a quantidade respeita o limite", async ({ page }) => {
    // Emerald Ape #042 (índice 0) tem a edição 1/1 esgotada no seed.
    await page.goto("/nft/emerald-ape-042")
    await expect(page.getByRole("radio", { name: "1/1 (esgotada)" })).toBeDisabled()

    await page.getByRole("radio", { name: "1/10" }).click()
    const increase = page.getByRole("button", { name: /Aumentar quantidade/ })
    for (let i = 0; i < 12; i++) {
      if (await increase.isDisabled()) break
      await increase.click()
    }
    await expect(page.getByRole("group", { name: /Quantidade/ }).locator("output")).toHaveText("10")
    await expect(increase).toBeDisabled()
  })

  test("rota inexistente mostra 404", async ({ page }) => {
    await page.goto("/rota/que/nao/existe")
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
  })
})
