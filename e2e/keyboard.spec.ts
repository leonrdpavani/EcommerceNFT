import { addToCartFromDetail, expect, login, test, USERS } from "./fixtures"

test.describe("Teclado, foco e zoom", () => {
  test("link de pular para o conteúdo é o primeiro foco da página", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("article").first()).toBeVisible()
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(page.locator("#conteudo")).toBeFocused()
  })

  test("filtros e cards operáveis só pelo teclado, com foco visível", async ({ page, isMobile }) => {
    test.skip(isMobile, "Filtros laterais do desktop.")
    await page.goto("/")
    const music = page.getByRole("complementary", { name: "Filtros do catálogo" }).getByRole("button", { name: /^Música/ })
    await music.focus()
    await expect(music).toBeFocused()
    const outline = await music.evaluate((element) => getComputedStyle(element).outlineStyle)
    expect(outline).not.toBe("none")
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/musica/)
    await expect(music).toHaveAttribute("aria-pressed", "true")

    const cardLink = page.getByRole("region", { name: "Catálogo de NFTs" }).getByRole("link", { name: "Golden Beat #207" })
    await cardLink.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("heading", { level: 1, name: "Golden Beat #207" })).toBeVisible()
    // Na troca de página, o foco vai para o conteúdo principal.
    await expect(page.locator("#conteudo")).toBeFocused()
  })

  test("diálogo de busca prende o foco, fecha com Esc e devolve o foco ao gatilho", async ({ page, isMobile }) => {
    await page.goto("/")
    const trigger = page.getByRole("button", { name: "Buscar NFTs" })
    await trigger.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", { name: "Buscar NFTs" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("searchbox", { name: "Termo de busca" })).toBeFocused()

    // Tab circula apenas dentro do diálogo.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab")
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
      expect(inside).toBe(true)
    }

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    // Busca completa pelo teclado.
    await page.keyboard.press("Enter")
    await page.keyboard.type("Golden")
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/q=Golden/)
    if (!isMobile) await expect(page.getByText(/Resultados para/)).toBeVisible()
  })

  test("formulário de login: validação acessível pelo teclado", async ({ page }) => {
    await page.goto("/entrar")
    const email = page.getByPlaceholder("contato@email.com")
    await email.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByText("Informe seu e-mail.")).toBeVisible()
    await expect(email).toHaveAttribute("aria-invalid", "true")
    const describedBy = await email.getAttribute("aria-describedby")
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy!.split(" ")[0]}`)).toHaveText("Informe seu e-mail.")

    await email.fill("email-invalido")
    await page.keyboard.press("Enter")
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible()
  })

  test("revisão do pedido: foco no diálogo e Esc fecha sem perder o preenchimento", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await page.goto("/pagamento")
    await expect(page.getByLabel(/Endereço da carteira/)).not.toHaveValue("")
    const confirm = page.getByRole("button", { name: "Confirmar compra" })
    await confirm.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog", { name: "Revise seu pedido" })
    await expect(dialog).toBeVisible()
    const inside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))
    expect(inside).toBe(true)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(confirm).toBeFocused()
    await expect(page.getByLabel(/Endereço da carteira/)).toHaveValue("0xA91F3c5D7e21B4a09f8E3d6C2b17E5a4F0c9E82C")
  })

  test.describe("zoom de 400% (320 px de largura)", () => {
    test.use({ viewport: { width: 320, height: 640 } })

    test("sem rolagem horizontal nem perda de conteúdo", async ({ page }) => {
      const paths = ["/", "/nft/emerald-ape-042", "/carrinho", "/entrar", "/cadastro", "/pagina-inexistente"]
      for (const path of paths) {
        await page.goto(path)
        await page.waitForLoadState("networkidle")
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${path}`).toBeLessThanOrEqual(0)
      }
    })
  })
})
