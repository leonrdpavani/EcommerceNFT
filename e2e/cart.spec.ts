import { addToCartFromDetail, cartItems, expect, login, test, USERS } from "./fixtures"

test.describe("Carrinho", () => {
  test("visitante adiciona, altera quantidade, remove e o carrinho persiste após refresh", async ({ page, isMobile }) => {
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await addToCartFromDetail(page, "ivory-baron-088", { isMobile })

    await page.goto("/carrinho")
    await expect(cartItems(page).getByRole("link", { name: "Golden Beat #207" })).toBeVisible()
    await expect(cartItems(page).getByRole("link", { name: "Ivory Baron #088" })).toBeVisible()

    await page.getByRole("button", { name: "Aumentar quantidade de Golden Beat #207" }).click()
    // 2 × 0.99 + 1.79 = 3.77; total = 3.77 + 0.016
    await expect(page.getByText("3.786 ETH").first()).toBeVisible()

    await page.reload()
    await expect(page.getByText("3.786 ETH").first()).toBeVisible()

    await page.getByRole("button", { name: "Remover Ivory Baron #088 do carrinho" }).click()
    await expect(cartItems(page).getByRole("link", { name: "Ivory Baron #088" })).toHaveCount(0)
    await expect(page.getByText("1.996 ETH").first()).toBeVisible()
  })

  test("cupom inválido, expirado e válido", async ({ page, isMobile }) => {
    await addToCartFromDetail(page, "verdant-sovereign-001", { isMobile })
    await page.goto("/carrinho")
    const input = page.getByRole("textbox", { name: "Código promocional" })

    await input.fill("NAOEXISTE")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("O cupom NAOEXISTE não existe.")).toBeVisible()

    await input.fill("VERAO2025")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText("O cupom VERAO2025 expirou.")).toBeVisible()

    await input.fill("KURIO10")
    await page.getByRole("button", { name: "Aplicar" }).click()
    await expect(page.getByText(/Cupom\s+KURIO10\s+aplicado/)).toBeVisible()
    // 12.30 − 10% (1.23) + 0.016 = 11.086
    await expect(page.getByText("11.086 ETH").first()).toBeVisible()
  })

  test("itens do visitante são preservados ao entrar na conta", async ({ page, isMobile }) => {
    await addToCartFromDetail(page, "golden-signal-160", { isMobile })
    await login(page, USERS.bruno)
    await page.goto("/carrinho")
    await expect(cartItems(page).getByRole("link", { name: "Golden Signal #160" })).toBeVisible()
  })
})
