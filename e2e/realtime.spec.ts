import { addToCartFromDetail, expect, login, mockAction, openReviewAndConnect, setMockConfig, test, USERS, waitForRealtime } from "./fixtures"

/**
 * Todos os eventos passam pelo cliente Socket.IO real (socket.io-client), conectado ao
 * servidor simulado pelo MSW. As ações só alteram o estado do servidor simulado.
 */
test.describe("Tempo real (Socket.IO)", () => {
  test("preço muda durante o checkout: a interface avisa e exige nova confirmação", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    const dialog = await openReviewAndConnect(page)
    await waitForRealtime(page, "usr_ana")
    await expect(dialog.getByText("1.006 ETH")).toBeVisible()

    await mockAction(page, "price-change", { nftId: "golden-beat-207", delta: "0.5" })

    await expect(page.getByText(/O preço de Golden Beat #207 mudou de 0.99 ETH para 1.49 ETH/)).toBeVisible()
    await expect(dialog.getByRole("alert").filter({ hasText: "Os valores mudaram" })).toBeVisible()
    await expect(dialog.getByText("1.506 ETH")).toBeVisible()
    const pay = dialog.getByRole("button", { name: "Confirmar e pagar" })
    await expect(pay).toBeDisabled()

    await dialog.getByRole("button", { name: "Aceitar novos valores" }).click()
    await expect(pay).toBeEnabled()
    await pay.click()
    await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible()
    await expect(page.getByText("1.506 ETH").first()).toBeVisible()
  })

  test("edição esgotada com item no carrinho bloqueia o checkout", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await page.goto("/carrinho")
    await waitForRealtime(page, "usr_ana")
    await mockAction(page, "sell-out", { nftId: "golden-beat-207" })
    await expect(page.getByText(/Golden Beat #207 \(1\/50\) esgotou/)).toBeVisible()
    await expect(page.getByRole("alert").filter({ hasText: "só 0 unidade(s) disponível(is)" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Conectar e finalizar" })).toBeDisabled()
  })

  test("eventos duplicados e antigos não regridem o estado", async ({ page, isMobile }) => {
    test.skip(isMobile, "Preço do detalhe validado no desktop.")
    await page.goto("/nft/ivory-baron-088")
    await waitForRealtime(page)
    await mockAction(page, "price-change", { nftId: "ivory-baron-088", delta: "1" })
    const price = page.getByText("Preço unitário:").locator("..")
    await expect(price).toHaveText(/2.79 ETH/)

    await mockAction(page, "duplicate-event")
    await mockAction(page, "stale-event", { nftId: "ivory-baron-088" })
    await page.waitForTimeout(500)
    await expect(price).toHaveText(/2.79 ETH/)
    await expect(page.getByText("0.01 ETH")).toHaveCount(0)
  })

  test("queda da conexão com pedido pendente: reconecta e recupera o pedido sem nova compra", async ({ page, isMobile }) => {
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await setMockConfig(page, { settleMs: 4000 })
    const dialog = await openReviewAndConnect(page)
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(page.getByRole("heading", { name: "Aguardando confirmação da carteira…" })).toBeVisible()
    const orderUrl = page.url()

    await setMockConfig(page, { realtime: "offline" })
    await mockAction(page, "drop-connections")
    await expect(page.getByText("Conexão em tempo real perdida. Tentando reconectar…")).toBeVisible()

    // Recarrega durante a pendência: o mesmo pedido continua sendo acompanhado.
    await page.reload()
    await expect(page).toHaveURL(orderUrl)
    await setMockConfig(page, { realtime: "online" })
    await expect(page.getByRole("heading", { name: "Seus NFTs agora estão na sua carteira" })).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(orderUrl)
  })

  test("eventos de pedido da sessão anterior não chegam ao novo usuário", async ({ page, isMobile }) => {
    test.skip(isMobile, "Troca de usuário validada no desktop.")
    test.setTimeout(60_000)
    await login(page, USERS.ana)
    await addToCartFromDetail(page, "golden-beat-207", { isMobile })
    await setMockConfig(page, { settleMs: 5000 })
    const dialog = await openReviewAndConnect(page)
    await dialog.getByRole("button", { name: "Confirmar e pagar" }).click()
    await expect(page.getByRole("heading", { name: "Aguardando confirmação da carteira…" })).toBeVisible()

    // A Ana sai e o Bruno entra antes de o pedido dela ser concluído.
    await page.goto("/conta/perfil")
    await page.getByRole("button", { name: /^Sair/ }).click()
    await login(page, USERS.bruno)
    await waitForRealtime(page, "usr_bruno")

    await page.waitForTimeout(5500)
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Pagamento confirmado" })).toHaveCount(0)
  })
})
