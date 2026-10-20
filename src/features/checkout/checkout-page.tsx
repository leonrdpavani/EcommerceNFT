import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "@tanstack/react-router"
import { EllipsisVerticalIcon, WalletIcon } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { useId, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "cn"

import { Breadcrumb, MobileScreenHeader } from "@/components/layout/page-parts"
import { WalletChips } from "@/components/layout/site-footer"
import { NftImage } from "@/components/nft/nft-image"
import { Button } from "@/components/ui/button"
import { SummaryLines, SummaryTotal } from "@/features/cart/order-summary"
import { PromoCodeForm } from "@/features/cart/promo-code-form"
import { CHECKOUT_DEFAULTS, checkoutSchema, type CheckoutValues } from "@/features/checkout/checkout-schema"
import { CollectorFields } from "@/features/checkout/collector-fields"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { networkLabel, WALLET_OPTIONS } from "@/lib/catalog"
import { formatEth, shortenAddress } from "@/lib/format"
import { getPreviewCart, PREVIEW_WALLETS } from "@/preview"
import type { WalletOption } from "@/types/domain"

export function CheckoutPage() {
  usePageTitle("Pagamento")
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  // Pré-visualização: na integração, o resumo vem da cotação (POST /quotes) revalidada antes do envio.
  const cart = getPreviewCart()
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: CHECKOUT_DEFAULTS,
    mode: "onTouched",
  })

  const onValid = () => {
    void navigate({ to: "/pedido/$orderId", params: { orderId: "KRO-PREVIEW" } })
  }

  const onInvalid = () => {
    toast.error("Revise os campos destacados antes de confirmar a compra.")
  }

  const submit = form.handleSubmit(onValid, onInvalid)

  if (!isDesktop) {
    return <MobileCheckout form={form} cart={cart} onSubmit={submit} />
  }

  return (
    <div className="container-page mt-8">
      <Breadcrumb
        items={[
          { label: "Início", to: "/" },
          { label: "Mercado", to: "/", hash: "catalogo" },
          { label: "Pagamento" },
        ]}
      />
      <h1 className="sr-only">Pagamento</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid grid-cols-[minmax(0,1fr)_405px] items-start gap-8">
        <section aria-labelledby="collector-title" className="flex flex-col gap-3">
          <h2 id="collector-title" className="text-[17px] leading-4 font-bold text-cream">
            Perfil do colecionador
          </h2>
          <CollectorFields control={form.control} register={form.register} errors={form.formState.errors} />
        </section>

        <section aria-labelledby="items-title" className="flex flex-col gap-3">
          <h2 id="items-title" className="text-[17px] leading-4 font-bold text-cream">
            Seus NFTs
          </h2>
          <OrderItems cart={cart} />
          <PromoToggle />
          <SummaryLines values={cart} feeNoteAlign="center" className="border-b-[0.6px] border-line-soft pb-3" />
          <SummaryTotal total={cart.total} className="px-10" />

          <fieldset className="mt-2 flex flex-col gap-5">
            <legend className="mb-5 w-full text-center text-[17px] leading-4 font-bold text-cream">Carteira e rede</legend>
            <Controller
              control={form.control}
              name="paymentWallet"
              render={({ field }) => (
                <RadioGroupPrimitive.Root
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="Carteira de pagamento"
                  className="flex flex-col gap-4"
                >
                  {WALLET_OPTIONS.map((wallet) => (
                    <RadioGroupPrimitive.Item
                      key={wallet.id}
                      value={wallet.id}
                      aria-label={wallet.name}
                      className="group flex h-[45px] cursor-pointer items-center gap-2.5 rounded-xs border border-line px-3 text-left outline-none hover:border-line-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text data-[state=checked]:border-brand"
                    >
                      <RadioDot />
                      {wallet.id === "walletconnect" ? (
                        <WalletChips className="w-56" />
                      ) : (
                        <span className="text-[15px] text-cream">{wallet.name}</span>
                      )}
                    </RadioGroupPrimitive.Item>
                  ))}
                </RadioGroupPrimitive.Root>
              )}
            />
          </fieldset>

          <Button type="submit" size="lg" className="mt-1 w-full rounded-lg text-[15px]">
            Confirmar compra
          </Button>
        </section>
      </form>
    </div>
  )
}

function RadioDot() {
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px] border-brand group-data-[state=checked]:[&>span]:scale-100"
    >
      <span className="size-2.5 scale-0 rounded-full bg-brand transition-transform" />
    </span>
  )
}

function OrderItems({ cart }: { cart: ReturnType<typeof getPreviewCart> }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b-[0.6px] border-line-soft pb-3 text-base leading-4 text-cream" aria-hidden="true">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul className="flex flex-col gap-3" aria-label="NFTs do pedido">
        {cart.items.map((item) => (
          <li key={`${item.nftId}-${item.editionId}`} className="flex h-[70px] items-center gap-2 bg-surface pr-4 pl-1">
            <NftImage artwork={item.nft.artwork} sizes="66px" alt="" className="size-[66px] rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-4">
              <p className="truncate text-base font-bold text-cream">{item.nft.name}</p>
              <p className="truncate text-sm text-taupe">ID do token: {item.nft.tokenId}</p>
            </div>
            <p className="text-sm whitespace-nowrap text-sand">
              <span className="sr-only">Quantidade: </span>(x {item.quantity})
            </p>
            <p className="min-w-[88px] text-right text-lg leading-4 font-bold whitespace-nowrap text-brand-text">
              {formatEth(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromoToggle() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const panelId = useId()
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="cursor-pointer text-center text-sm leading-4 text-cream hover:text-brand-text"
      >
        Tem um código promocional? <span className="underline-offset-4 hover:underline">Aplique aqui</span>
      </button>
      <div id={panelId} hidden={!open}>
        <PromoCodeForm
          onApply={(code) => setError(`O cupom ${code} não é válido. (Validação real na integração com a API.)`)}
          error={error}
        />
      </div>
    </div>
  )
}

function MobileCheckout({
  form,
  cart,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<CheckoutValues>>
  cart: ReturnType<typeof getPreviewCart>
  onSubmit: () => void
}) {
  const [savedWallet, setSavedWallet] = useState(PREVIEW_WALLETS[0].id)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      noValidate
      className="mx-auto flex min-h-dvh max-w-[720px] flex-col justify-between gap-8 px-7 py-8"
    >
      <div className="flex flex-col gap-4">
        <MobileScreenHeader title="Pagamento com carteira" fallback="/carrinho" />

        <section aria-labelledby="saved-wallets-title" className="flex flex-col gap-4">
          <div className="flex items-center justify-between leading-4 font-bold">
            <h2 id="saved-wallets-title" className="text-base text-cream">
              Carteira conectada
            </h2>
            <button
              type="button"
              className="cursor-pointer text-sm text-brand-text hover:underline"
              onClick={() => toast.info("Pré-visualização: a troca de carteira será conectada na integração.")}
            >
              Trocar carteira
            </button>
          </div>
          <RadioGroupPrimitive.Root
            value={savedWallet}
            onValueChange={setSavedWallet}
            aria-label="Carteira conectada"
            className="flex flex-col gap-5"
          >
            {PREVIEW_WALLETS.map((wallet) => (
              <div key={wallet.id} className="relative">
                <RadioGroupPrimitive.Item
                  value={wallet.id}
                  aria-label={`${wallet.label}, ${shortenAddress(wallet.address)}, rede ${networkLabel(wallet.network)}`}
                  className="group flex min-h-[93px] w-full cursor-pointer items-center gap-5 rounded-[14px] bg-surface py-3 pr-12 pl-5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text data-[state=checked]:shadow-[0_20px_20px_rgb(10_6_4/0.45)]"
                >
                  <RadioDot />
                  <span className="flex flex-col gap-1">
                    <span className="text-base leading-4 font-bold text-cream">{wallet.label}</span>
                    <span className="text-sm leading-[22px] text-sand">
                      {shortenAddress(wallet.address)}
                      <br />
                      {wallet.network === "ethereum" ? "Rede principal Ethereum" : `Rede ${networkLabel(wallet.network)}`}
                    </span>
                  </span>
                </RadioGroupPrimitive.Item>
                <button
                  type="button"
                  aria-label={`Opções da carteira ${wallet.label}`}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center text-sand"
                  onClick={() => toast.info("Pré-visualização: a edição de carteiras fica em Conta › Carteiras.")}
                >
                  <EllipsisVerticalIcon className="size-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </RadioGroupPrimitive.Root>
        </section>

        <section aria-labelledby="wallet-network-title" className="flex flex-col gap-4">
          <h2 id="wallet-network-title" className="text-base leading-4 font-bold text-cream">
            Carteira e rede
          </h2>
          <Controller
            control={form.control}
            name="paymentWallet"
            render={({ field }) => (
              <RadioGroupPrimitive.Root
                value={field.value}
                onValueChange={field.onChange}
                aria-label="Carteira de pagamento"
                className="flex flex-col gap-4"
              >
                {WALLET_OPTIONS.map((wallet) => (
                  <RadioGroupPrimitive.Item
                    key={wallet.id}
                    value={wallet.id}
                    aria-label={wallet.name}
                    className="group flex h-[65px] w-full cursor-pointer items-center gap-3 rounded-[15px] bg-surface pr-4 pl-3.5 text-left shadow-[0_0_20px_rgb(10_6_4/0.45)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text"
                  >
                    <WalletBadge wallet={wallet} />
                    <span className="flex-1 text-sm leading-4 text-cream">{wallet.name}</span>
                    <RadioDot />
                  </RadioGroupPrimitive.Item>
                ))}
              </RadioGroupPrimitive.Root>
            )}
          />
        </section>

        <details className="group rounded-[15px] bg-surface px-4 py-3 open:pb-5">
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-base leading-6 font-bold text-cream marker:hidden">
            Dados do colecionador
            <span className="text-sm font-normal text-brand-text group-open:hidden">Preencher</span>
          </summary>
          <div className="mt-4">
            <CollectorFields control={form.control} register={form.register} errors={form.formState.errors} layout="single" />
          </div>
        </details>

        <p className="flex items-center justify-end gap-7 leading-4 font-bold">
          <span className="text-base text-cream">Total:</span>
          <span className="text-lg text-brand-text">{formatEth(cart.total)}</span>
        </p>
      </div>

      <Button type="submit" variant="cta" size="xl" className="w-full text-[15px]">
        Confirmar compra
      </Button>
    </form>
  )
}

function WalletBadge({ wallet }: { wallet: WalletOption }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border border-line-soft bg-surface-raised text-sm font-bold text-brand-text"
      )}
    >
      {wallet.id === "coinbase" ? <WalletIcon className="size-5" /> : wallet.monogram}
    </span>
  )
}
