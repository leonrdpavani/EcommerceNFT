import { addToCartFromDetail, cartItems, expect, login, openReviewAndConnect, setMockConfig, submitLogin, test, USERS } from "./fixtures"

test.describe("Compra", () => {
  test("checkout exige login e retorna ao fluxo após autenticar", async ({ page }) => {
    await page.goto("/pagamento")
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await submitLogin(page, USERS.ana)
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

    const dialog = await openReviewAndConnect(page)
    await expect(dialog.getByText("Emerald Ape #042")).toBeVisible()
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()

    await expect(page).toHaveURL(/\/pedido\/ord_/)
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
    await expect(page.getByText("Informe o endereço da carteira.")).toBeVisible()
    await expect(page.getByLabel(/Endereço da carteira/)).toHaveAttribute("aria-invalid", "true")
  })

  test("pagamento recusado preserva os itens no carrinho", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await setMockConfig(page, { payment: "decline" })
    const dialog = await openReviewAndConnect(page)
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(page.getByRole("heading", { name: "Pagamento recusado" })).toBeVisible()
    await page.getByRole("link", { name: "Voltar ao carrinho" }).click()
    await expect(cartItems(page).getByRole("link", { name: "Golden Beat #207" })).toBeVisible()
  })

  test("clique repetido não duplica o pedido", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-signal-160", { isMobile })
    const keys: string[] = []
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/orders")) keys.push(request.headers()["idempotency-key"])
    })
    const dialog = await openReviewAndConnect(page)
    const pay = dialog.getByRole("button", { name: "Confirmar e pagar" })
    await pay.dblclick()
    await expect(page).toHaveURL(/\/pedido\/ord_/)
    expect(keys.length).toBeGreaterThanOrEqual(1)
    expect(new Set(keys).size).toBe(1)
  })

  test("timeout após criar o pedido recupera o mesmo pedido pela chave de idempotência", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "amber-pulse-126", { isMobile })
    await setMockConfig(page, { orderTimeout: true })
    const keys: string[] = []
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/api/orders")) keys.push(request.headers()["idempotency-key"])
    })
    const dialog = await openReviewAndConnect(page)
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(dialog.getByText(/Verificando se o pedido foi criado/)).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/pedido\/ord_/, { timeout: 15_000 })
    expect(keys.length).toBe(2)
    expect(keys[0]).toBe(keys[1])
    await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible()
  })

  test("carteira que recusa a conexão mostra o motivo e não envia o pedido", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await setMockConfig(page, { wallet: "refuse" })
    await page.goto("/pagamento")
    await page.getByRole("button", { name: "Confirmar compra" }).click()
    const dialog = page.getByRole("dialog", { name: "Revise seu pedido" })
    await dialog.getByRole("button", { name: "Conectar carteira" }).click()
    await expect(dialog.getByRole("alert").filter({ hasText: "A conexão foi recusada na carteira" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Confirmar e pagar" })).toBeDisabled()
  })

  test("carteira desconectada antes do envio exige reconectar", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await setMockConfig(page, { wallet: "disconnect" })
    const dialog = await openReviewAndConnect(page)
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(dialog.getByRole("alert").filter({ hasText: "Sua carteira desconectou" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Conectar carteira" })).toBeVisible()
  })
})
