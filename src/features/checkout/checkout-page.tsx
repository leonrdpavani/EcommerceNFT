import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { EllipsisVerticalIcon, WalletIcon } from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { useEffect, useId, useRef, useState } from "react"
import { Controller, useForm, type UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import type { Quote, Wallet } from "@/api/contracts"
import { isApiError } from "@/api/http"
import { walletsQuery } from "@/api/queries"
import { QueryError } from "@/components/feedback/query-error"
import { Breadcrumb, MobileScreenHeader } from "@/components/layout/page-parts"
import { WalletChips } from "@/components/layout/site-footer"
import { NftImage } from "@/components/nft/nft-image"
import { Button, buttonVariants } from "@/components/ui/button"
import { PromoSection, QuoteIssues, SummaryBlock } from "@/features/cart/cart-page"
import { useQuote } from "@/features/cart/use-quote"
import { CHECKOUT_DEFAULTS, checkoutSchema, type CheckoutValues } from "@/features/checkout/checkout-schema"
import { CollectorFields } from "@/features/checkout/collector-fields"
import { useCreateOrder } from "@/features/checkout/use-create-order"
import { useSession } from "@/features/session/use-session"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { networkLabel, WALLET_OPTIONS } from "@/lib/catalog"
import { formatEth, shortenAddress } from "@/lib/format"
import type { WalletOption } from "@/types/domain"

type CheckoutForm = UseFormReturn<CheckoutValues>
type QuoteState = ReturnType<typeof useQuote>

export function CheckoutPage() {
  usePageTitle("Pagamento")
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const quoteState = useQuote()
  const { cart, quote } = quoteState
  const wallets = useQuery({ ...walletsQuery(user?.id ?? "anon"), enabled: Boolean(user) })
  const createOrder = useCreateOrder()

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: CHECKOUT_DEFAULTS,
    mode: "onTouched",
  })

  // Pré-preenche com o perfil e a carteira principal cadastrados (sem sobrescrever edições).
  const primary = wallets.data?.items.find((wallet) => wallet.slot === "primary")
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !user || !wallets.data || form.formState.isDirty) return
    prefilled.current = true
    form.reset({ ...CHECKOUT_DEFAULTS, ...prefill(user, primary) })
  }, [user, primary, wallets.data, form])

  const onValid = (values: CheckoutValues) => {
    if (!quote.data) return
    createOrder.mutate(
      {
        quoteId: quote.data.id,
        network: values.network,
        walletType: values.paymentWallet,
        collector: {
          displayName: values.displayName,
          username: values.username,
          profileName: values.profileName,
          email: values.email,
          walletAddress: values.walletAddress,
          secondaryWallet: values.secondaryWallet,
          referralCode: values.referralCode,
          ensName: `${values.ensName}${values.ensSuffix}`,
          note: values.note,
        },
      },
      {
        onSuccess: (order) => void navigate({ to: "/pedido/$orderId", params: { orderId: order.id } }),
        onError: (error) => {
          if (isApiError(error) && error.code === "QUOTE_OUTDATED") {
            toast.warning(error.message)
            void queryClient.invalidateQueries({ queryKey: ["cart"] })
            return
          }
          toast.error(isApiError(error) ? error.message : "Não foi possível criar o pedido.")
        },
      }
    )
  }

  const submit = form.handleSubmit(onValid, () => toast.error("Revise os campos destacados antes de confirmar a compra."))
  const busy = createOrder.isPending
  const blocked = !quote.data || quote.data.issues.length > 0 || quote.isFetching

  if (cart.isError && !cart.data) {
    return (
      <div className="container-page py-16">
        <QueryError message={cart.error.message} onRetry={() => void cart.refetch()} />
      </div>
    )
  }

  if (cart.data && cart.data.items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-bold text-cream">Não há itens para pagar</h1>
        <p className="text-sm text-sand">Seu carrinho está vazio. Adicione NFTs antes de finalizar a compra.</p>
        <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
          Explorar o mercado
        </Link>
      </div>
    )
  }

  if (!isDesktop) {
    return <MobileCheckout form={form} quoteState={quoteState} wallets={wallets.data?.items ?? []} onSubmit={submit} busy={busy} blocked={blocked} />
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
          <QuoteIssues quote={quote.data} />
          <OrderItems quote={quote.data} />
          <PromoToggle quoteState={quoteState} />
          <div className="flex flex-col gap-3 border-b-[0.6px] border-line-soft pb-3">
            <SummaryBlock quote={quote.data} isPending={quote.isPending} coupon={quoteState.coupon} />
          </div>

          <fieldset className="mt-2 flex flex-col gap-5">
            <legend className="mb-5 w-full text-center text-[17px] leading-4 font-bold text-cream">Carteira e rede</legend>
            <Controller
              control={form.control}
              name="paymentWallet"
              render={({ field }) => (
                <RadioGroupPrimitive.Root value={field.value} onValueChange={field.onChange} aria-label="Carteira de pagamento" className="flex flex-col gap-4">
                  {WALLET_OPTIONS.map((wallet) => (
                    <RadioGroupPrimitive.Item
                      key={wallet.id}
                      value={wallet.id}
                      aria-label={wallet.name}
                      className="group flex h-[45px] cursor-pointer items-center gap-2.5 rounded-xs border border-line px-3 text-left outline-none hover:border-line-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text data-[state=checked]:border-brand"
                    >
                      <RadioDot />
                      {wallet.id === "walletconnect" ? <WalletChips className="w-56" /> : <span className="text-[15px] text-cream">{wallet.name}</span>}
                    </RadioGroupPrimitive.Item>
                  ))}
                </RadioGroupPrimitive.Root>
              )}
            />
          </fieldset>

          <Button type="submit" size="lg" className="mt-1 w-full rounded-lg text-[15px]" disabled={busy || blocked} aria-busy={busy}>
            {busy ? "Enviando pedido…" : "Confirmar compra"}
          </Button>
        </section>
      </form>
    </div>
  )
}

function prefill(user: NonNullable<ReturnType<typeof useSession>["user"]>, wallet?: Wallet): Partial<CheckoutValues> {
  return {
    displayName: wallet?.displayName ?? user.displayName,
    username: user.username,
    email: wallet?.email ?? user.email,
    profileName: wallet?.profileName ?? "",
    network: wallet?.network,
    walletType: wallet?.walletType,
    walletAddress: wallet?.address ?? "",
    secondaryWallet: wallet?.secondaryAddress ?? "",
    referralCode: wallet?.referralCode ?? "",
    ensName: wallet?.ensName ?? user.ensName,
    paymentWallet: wallet?.walletType ?? "coinbase",
  }
}

function RadioDot() {
  return (
    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center rounded-full border-[1.2px] border-brand group-data-[state=checked]:[&>span]:scale-100">
      <span className="size-2.5 scale-0 rounded-full bg-brand transition-transform" />
    </span>
  )
}

function OrderItems({ quote }: { quote?: Quote }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b-[0.6px] border-line-soft pb-3 text-base leading-4 text-cream" aria-hidden="true">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul className="flex flex-col gap-3" aria-label="NFTs do pedido" aria-busy={!quote}>
        {(quote?.items ?? []).map((item) => (
          <li key={`${item.nftId}-${item.editionId}`} className="flex h-[70px] items-center gap-2 bg-surface pr-4 pl-1">
            <NftImage artwork={item.artwork} sizes="66px" alt="" className="size-[66px] rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-4">
              <p className="truncate text-base font-bold text-cream">{item.name}</p>
              <p className="truncate text-sm text-taupe">
                ID do token: {item.tokenId} · {item.editionLabel}
              </p>
            </div>
            <p className="text-sm whitespace-nowrap text-sand">
              <span className="sr-only">Quantidade: </span>(x {item.quantity})
            </p>
            <p className="min-w-[88px] text-right text-lg leading-4 font-bold whitespace-nowrap text-brand-text">{formatEth(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromoToggle({ quoteState }: { quoteState: QuoteState }) {
  const [open, setOpen] = useState(Boolean(quoteState.coupon))
  const panelId = useId()
  const { applyCoupon, coupon, removeCoupon } = quoteState
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
        <PromoSection
          variant="desktop"
          coupon={coupon}
          error={applyCoupon.error && isApiError(applyCoupon.error) ? applyCoupon.error.message : undefined}
          onApply={(code) => applyCoupon.mutate(code)}
          onRemove={() => {
            applyCoupon.reset()
            removeCoupon()
          }}
          pending={applyCoupon.isPending}
        />
      </div>
    </div>
  )
}

function MobileCheckout({
  form,
  quoteState,
  wallets,
  onSubmit,
  busy,
  blocked,
}: {
  form: CheckoutForm
  quoteState: QuoteState
  wallets: Wallet[]
  onSubmit: () => void
  busy: boolean
  blocked: boolean
}) {
  const [savedWallet, setSavedWallet] = useState<string>("primary")
  const total = quoteState.quote.data?.total

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
        <QuoteIssues quote={quoteState.quote.data} />

        <section aria-labelledby="saved-wallets-title" className="flex flex-col gap-4">
          <div className="flex items-center justify-between leading-4 font-bold">
            <h2 id="saved-wallets-title" className="text-base text-cream">
              Carteira conectada
            </h2>
            <Link to="/conta/carteiras" className="text-sm text-brand-text hover:underline">
              Trocar carteira
            </Link>
          </div>
          {wallets.length > 0 ? (
            <RadioGroupPrimitive.Root
              value={savedWallet}
              onValueChange={(slot) => {
                setSavedWallet(slot)
                const wallet = wallets.find((item) => item.slot === slot)
                if (wallet) {
                  form.setValue("walletAddress", wallet.address, { shouldValidate: true })
                  form.setValue("network", wallet.network, { shouldValidate: true })
                }
              }}
              aria-label="Carteira conectada"
              className="flex flex-col gap-5"
            >
              {wallets.map((wallet) => (
                <div key={wallet.slot} className="relative">
                  <RadioGroupPrimitive.Item
                    value={wallet.slot}
                    aria-label={`${wallet.walletNickname}, ${shortenAddress(wallet.address)}, rede ${networkLabel(wallet.network)}`}
                    className="group flex min-h-[93px] w-full cursor-pointer items-center gap-5 rounded-[14px] bg-surface py-3 pr-12 pl-5 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text data-[state=checked]:shadow-[0_20px_20px_rgb(10_6_4/0.45)]"
                  >
                    <RadioDot />
                    <span className="flex flex-col gap-1">
                      <span className="text-base leading-4 font-bold text-cream">{wallet.walletNickname}</span>
                      <span className="text-sm leading-[22px] text-sand">
                        {shortenAddress(wallet.address)}
                        <br />
                        {wallet.network === "ethereum" ? "Rede principal Ethereum" : `Rede ${networkLabel(wallet.network)}`}
                      </span>
                    </span>
                  </RadioGroupPrimitive.Item>
                  <Link
                    to="/conta/carteiras"
                    aria-label={`Editar a carteira ${wallet.walletNickname}`}
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center text-sand"
                  >
                    <EllipsisVerticalIcon className="size-5" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </RadioGroupPrimitive.Root>
          ) : (
            <p className="rounded-[14px] bg-surface p-4 text-sm text-sand">
              Nenhuma carteira cadastrada.{" "}
              <Link to="/conta/carteiras" className="text-brand-text underline-offset-4 hover:underline">
                Cadastrar carteira
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="wallet-network-title" className="flex flex-col gap-4">
          <h2 id="wallet-network-title" className="text-base leading-4 font-bold text-cream">
            Carteira e rede
          </h2>
          <Controller
            control={form.control}
            name="paymentWallet"
            render={({ field }) => (
              <RadioGroupPrimitive.Root value={field.value} onValueChange={field.onChange} aria-label="Carteira de pagamento" className="flex flex-col gap-4">
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

        <details className="group rounded-[15px] bg-surface px-4 py-3 open:pb-5" open={Object.keys(form.formState.errors).length > 0 || undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-base leading-6 font-bold text-cream marker:hidden">
            Dados do colecionador
            <span className="text-sm font-normal text-brand-text group-open:hidden">Revisar</span>
          </summary>
          <div className="mt-4">
            <CollectorFields control={form.control} register={form.register} errors={form.formState.errors} layout="single" />
          </div>
        </details>

        <p className="flex items-center justify-end gap-7 leading-4 font-bold">
          <span className="text-base text-cream">Total:</span>
          <span className="text-lg text-brand-text" aria-live="polite">
            {total ? formatEth(total) : "—"}
          </span>
        </p>
      </div>

      <Button type="submit" variant="cta" size="xl" className="w-full text-[15px]" disabled={busy || blocked} aria-busy={busy}>
        {busy ? "Enviando pedido…" : "Confirmar compra"}
      </Button>
    </form>
  )
}

function WalletBadge({ wallet }: { wallet: WalletOption }) {
  return (
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-soft bg-surface-raised text-sm font-bold text-brand-text">
      {wallet.id === "coinbase" ? <WalletIcon className="size-5" /> : wallet.monogram}
    </span>
  )
}
