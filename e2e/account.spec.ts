import { expect, login, test, USERS } from "./fixtures"

test.describe("Conta e sessão", () => {
  test("login com credenciais inválidas mostra erro da API", async ({ page }) => {
    await page.goto("/entrar")
    await page.getByPlaceholder("contato@email.com").fill(USERS.ana.email)
    await page.getByPlaceholder("Senha", { exact: true }).fill("senha-errada1")
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." })).toBeVisible()
  })

  test("cadastro trata conflito de e-mail já existente", async ({ page }) => {
    await page.goto("/cadastro")
    await page.getByPlaceholder("Nome de usuário", { exact: true }).fill("ana2")
    await page.getByPlaceholder("Digite seu e-mail", { exact: true }).fill(USERS.ana.email)
    await page.getByPlaceholder("Senha", { exact: true }).fill("Segura123")
    await page.getByPlaceholder("Confirmar senha").fill("Segura123")
    await page.getByRole("button", { name: /Criar (conta|perfil)/ }).click()
    await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible()
  })

  test("sessão persiste após refresh e logout limpa o acesso privado", async ({ page }) => {
    await login(page, USERS.ana)
    await page.goto("/conta/perfil")
    await expect(page.getByLabel(/Nome de exibição/)).toHaveValue(USERS.ana.name)
    await page.reload()
    await expect(page.getByLabel(/Nome de exibição/)).toHaveValue(USERS.ana.name)

    await page.getByRole("button", { name: /^Sair/ }).click()
    await expect(page).toHaveURL("/")
    await page.goto("/conta/perfil")
    await expect(page).toHaveURL(/\/entrar/)
  })

  test("perfil salva alterações e valida erros", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/conta/perfil")
    const name = page.getByLabel(/Nome de exibição/)
    await name.fill("Bruno Atualizado")
    await page.getByLabel(/Nome de usuário/).fill("ana.coleciona")
    await page.getByLabel(/Apelido da carteira/).fill("Ateliê")
    await page.getByRole("button", { name: "Salvar", exact: true }).click()
    await expect(page.getByText("Este nome de usuário já está em uso.")).toBeVisible()

    await page.getByLabel(/Nome de usuário/).fill("bruno.novo")
    await page.getByRole("button", { name: "Salvar", exact: true }).click()
    await expect(page.getByText("Perfil atualizado.")).toBeVisible()
    await page.reload()
    await expect(name).toHaveValue("Bruno Atualizado")
  })

  test("favoritos exigem login e persistem para o usuário", async ({ page, isMobile }) => {
    test.skip(isMobile, "Botão de favoritar do detalhe no desktop.")
    await page.goto("/nft/golden-signal-160")
    await page.getByRole("button", { name: "Favoritar", exact: true }).click()
    await expect(page).toHaveURL(/\/entrar\?redirect=/)
    await page.getByPlaceholder("contato@email.com").fill(USERS.bruno.email)
    await page.getByPlaceholder("Senha", { exact: true }).fill(USERS.bruno.password)
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page).toHaveURL(/golden-signal-160/)

    await page.getByRole("button", { name: "Favoritar", exact: true }).click()
    await expect(page.getByText("Golden Signal #160 adicionado aos favoritos.")).toBeVisible()
    await page.goto("/favoritos")
    await expect(page.getByRole("heading", { name: "Golden Signal #160" })).toBeVisible()
  })
})
