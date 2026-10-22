import { addToCartFromDetail, cartItems, expect, login, setMockConfig, submitLogin, test, USERS } from "./fixtures"

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

test.describe("Conta: falhas, rollback e relógio", () => {
  // PNG 1×1 válido para o upload de avatar.
  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  )

  test("favorito com falha da API: atualização otimista é desfeita (rollback)", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/")
    const add = page.getByRole("button", { name: "Favoritar Golden Signal #160" })
    await expect(add).toBeVisible()
    await setMockConfig(page, { latency: "slow", failure: "server-error" })

    await add.click()
    // Otimista: marcado antes da resposta da API…
    const remove = page.getByRole("button", { name: "Remover Golden Signal #160 dos favoritos" })
    await expect(remove).toHaveAttribute("aria-pressed", "true")
    // …e desfeito quando a API falha.
    await expect(page.getByText("Não foi possível atualizar os favoritos de Golden Signal #160. Tente novamente.")).toBeVisible()
    await expect(add).toHaveAttribute("aria-pressed", "false")

    await setMockConfig(page, { latency: "none", failure: "none" })
    await page.goto("/favoritos")
    await expect(page.getByRole("heading", { name: "Nenhum favorito por aqui" })).toBeVisible()
  })

  test("avatar: tipo inválido, falha da API, envio e remoção", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/conta/perfil")
    const input = page.locator('input[type="file"]')

    await input.setInputFiles({ name: "notas.txt", mimeType: "text/plain", buffer: Buffer.from("texto") })
    await expect(page.getByText("Envie uma imagem PNG, JPG ou WebP.")).toBeVisible()

    await setMockConfig(page, { failure: "server-error" })
    await input.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: PNG })
    await expect(page.getByText("O servidor encontrou um erro inesperado. Tente novamente em instantes.")).toBeVisible()

    await setMockConfig(page, { failure: "none" })
    await input.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: PNG })
    await expect(page.getByText("Avatar atualizado.")).toBeVisible()
    await expect(page.getByRole("img", { name: `Avatar de ${USERS.bruno.name}` })).toBeVisible()
    await page.reload()
    await expect(page.getByRole("img", { name: `Avatar de ${USERS.bruno.name}` })).toBeVisible()

    await page.getByRole("button", { name: "Remover", exact: true }).click()
    await expect(page.getByText("Avatar removido.")).toBeVisible()
    await expect(page.getByRole("img", { name: `Avatar de ${USERS.bruno.name}` })).toHaveCount(0)
  })

  test("troca de senha: senha atual incorreta é recusada pela API; a nova senha passa a valer", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/conta/perfil")
    await page.getByLabel("Senha atual").fill("Errada2026")
    await page.getByLabel("Nova senha", { exact: true }).fill("NovaSenha2026")
    await page.getByLabel("Confirmar nova senha").fill("NovaSenha2026")
    await page.getByRole("button", { name: "Salvar", exact: true }).click()
    await expect(page.getByText("A senha atual está incorreta.")).toBeVisible()

    await page.getByLabel("Senha atual").fill(USERS.bruno.password)
    await page.getByRole("button", { name: "Salvar", exact: true }).click()
    await expect(page.getByText("Perfil e senha atualizados.")).toBeVisible()

    await page.getByRole("button", { name: /^Sair/ }).click()
    await expect(page).toHaveURL("/")
    await page.goto("/entrar")
    await submitLogin(page, USERS.bruno)
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." })).toBeVisible()
    await login(page, { ...USERS.bruno, password: "NovaSenha2026" })
  })

  test("carteiras: validação dos campos, falha da API e salvamento", async ({ page }) => {
    await login(page, USERS.bruno)
    await page.goto("/conta/carteiras")
    const primary = page.getByRole("region", { name: "Carteira principal" })
    const save = primary.getByRole("button", { name: "Salvar carteira" })

    await save.click()
    await expect(
      primary
        .getByText("Informe o endereço da carteira.")
        .or(primary.getByText(/Informe um endereço 0x/))
        .first()
    ).toBeVisible()

    await primary.getByLabel(/Nome de exibição/).fill("Bruno Criador")
    await primary.getByLabel(/Apelido da carteira/).fill("Ateliê")
    await primary.getByRole("combobox", { name: /Rede/ }).click()
    await page.getByRole("option", { name: "Ethereum" }).click()
    await primary.getByLabel(/Nome do perfil/).fill("bruno.cria")
    await primary.getByLabel(/Endereço da carteira/).fill("0x123")
    await primary.getByRole("combobox", { name: /Tipo de carteira/ }).click()
    await page.getByRole("option", { name: "MetaMask" }).click()
    await primary.getByLabel(/Código de indicação/).fill("KURIO-BRUNO")
    await primary.getByLabel(/E-mail/).fill(USERS.bruno.email)
    await primary.getByLabel(/Nome ENS/).fill("bruno")
    await save.click()
    await expect(primary.getByText("Informe um endereço 0x válido com 40 caracteres hexadecimais.")).toBeVisible()

    await primary.getByLabel(/Endereço da carteira/).fill("0xB0b0000000000000000000000000000000000001")
    await setMockConfig(page, { failure: "server-error" })
    await save.click()
    await expect(primary.getByText("O servidor encontrou um erro inesperado. Tente novamente em instantes.")).toBeVisible()

    await setMockConfig(page, { failure: "none" })
    await save.click()
    await expect(page.getByText("Carteira principal salva.")).toBeVisible()
    await page.reload()
    await expect(page.getByRole("region", { name: "Carteira principal" }).getByLabel(/Endereço da carteira/)).toHaveValue(
      "0xB0b0000000000000000000000000000000000001"
    )
  })

  test("relógio controlado: sessão expira durante a navegação e o carrinho é preservado após novo login", async ({
    page,
    isMobile,
  }) => {
    await page.clock.install()
    await page.goto("/")
    await setMockConfig(page, { sessionMinutes: 1 })
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await page.goto("/")
    await expect(page.getByRole("link", { name: /Carrinho, 1 item/ })).toBeVisible()

    // Avança o relógio da página (e do servidor simulado, que roda nela) além da validade da sessão.
    await page.clock.fastForward("02:00")
    await page
      .getByRole("link", { name: /^(Minha conta|Perfil)/ })
      .first()
      .click()

    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fconta%2Fperfil/)
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Sua sessão expirou. Entre novamente para continuar." })
    ).toBeVisible()
    await submitLogin(page, USERS.ana)
    await expect(page).toHaveURL(/\/conta\/perfil/)
    await page.goto("/carrinho")
    await expect(cartItems(page).getByText("Golden Beat #207").first()).toBeVisible()
  })
})
