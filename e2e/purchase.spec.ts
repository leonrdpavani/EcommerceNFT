import { addToCartFromDetail, expect, login, test, USERS } from "./fixtures"

test.describe("Compra", () => {
  test("checkout exige login e retorna ao fluxo após autenticar", async ({ page }) => {
    await page.goto("/pagamento")
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await page.getByPlaceholder("contato@email.com").fill(USERS.ana.email)
    await page.getByPlaceholder("Senha", { exact: true }).fill(USERS.ana.password)
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page).toHaveURL(/\/pagamento/)
  })

  test("compra completa do catálogo ao recibo confirmado", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "emerald-ape-042", { isMobile })

    await page.goto("/carrinho")
    await page.getByRole("button", { name: "Conectar e finalizar" }).click()
    await expect(page).toHaveURL(/\/pagamento/)

    // Dados pré-preenchidos com o perfil e a carteira principal da Ana.
    if (isMobile) await page.getByText("Dados do colecionador").click()
    await expect(page.getByLabel(/Endereço da carteira/)).toHaveValue("0xA91F3c5D7e21B4a09f8E3d6C2b17E5a4F0c9E82C")

    await page.getByRole("button", { name: "Confirmar compra" }).click()
    await expect(page).toHaveURL(/\/pedido\/ord_/)
    await expect(page.getByRole("heading", { name: "Aguardando confirmação da carteira…" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible()
    await expect(page.getByText("Emerald Ape #042")).toBeVisible()

    // Após a confirmação, o item comprado sai do carrinho.
    await page.goto("/carrinho")
    await expect(page.getByRole("heading", { name: "Seu carrinho está vazio" })).toBeVisible()
  })

  test("validação do formulário de pagamento destaca campos obrigatórios", async ({ page, isMobile }) => {
    await login(page, USERS.bruno)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await page.goto("/pagamento")
    await page.getByRole("button", { name: "Confirmar compra" }).click()
    await expect(page.getByText("Revise os campos destacados antes de confirmar a compra.")).toBeVisible()
    if (isMobile) await expect(page.getByText("Dados do colecionador")).toBeVisible()
    await expect(page.getByText("Informe o endereço da carteira.")).toBeVisible()
    await expect(page.getByLabel(/Endereço da carteira/)).toHaveAttribute("aria-invalid", "true")
  })
})
