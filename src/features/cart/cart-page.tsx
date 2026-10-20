import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { ShoppingCartIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import type { Cart, CartItem, Quote } from "@/api/contracts"
import { isApiError } from "@/api/http"
import { catalogQuery } from "@/api/queries"
import { QueryError } from "@/components/feedback/query-error"
import { Breadcrumb, MobileScreenHeader } from "@/components/layout/page-parts"
import { NftCarousel } from "@/components/nft/nft-carousel"
import { NftImage } from "@/components/nft/nft-image"
import { QuantityStepper } from "@/components/nft/quantity-stepper"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryLines, SummarySkeleton, SummaryTotal } from "@/features/cart/order-summary"
import { PromoCodeForm } from "@/features/cart/promo-code-form"
import { useCartItemMutation } from "@/features/cart/use-cart-item-mutation"
import { useQuote } from "@/features/cart/use-quote"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { DEFAULT_CATALOG_SEARCH } from "@/lib/catalog-search"
import { formatEth } from "@/lib/format"

const MAX_PER_LINE = 10

export function CartPage() {
  usePageTitle("Carrinho")
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const { cart, quote, coupon, applyCoupon, removeCoupon } = useQuote()
  const itemMutation = useCartItemMutation()
  const trending = useQuery(catalogQuery({ ...DEFAULT_CATALOG_SEARCH, tab: "em-alta" }))

  function updateQuantity(item: CartItem, quantity: number) {
    itemMutation.mutate(
      { itemId: item.id, quantity },
      { onError: (error) => toast.error(isApiError(error) ? error.message : "Não foi possível atualizar a quantidade.") }
    )
  }

  function removeItem(item: CartItem) {
    itemMutation.mutate(
      { itemId: item.id, quantity: null },
      {
        onSuccess: () => toast.success(`${item.name} removido do carrinho.`),
        onError: (error) => toast.error(isApiError(error) ? error.message : "Não foi possível remover o item."),
      }
    )
  }

  const couponError = applyCoupon.error && isApiError(applyCoupon.error) ? applyCoupon.error.message : undefined
  const promo = {
    coupon,
    error: couponError,
    onApply: (code: string) => applyCoupon.mutate(code),
    onRemove: () => {
      applyCoupon.reset()
      removeCoupon()
    },
    pending: applyCoupon.isPending,
  }

  const items = cart.data?.items ?? []
  const canCheckout = items.length > 0 && Boolean(quote.data) && quote.data!.issues.length === 0
  const checkout = () => void navigate({ to: "/pagamento" })

  if (cart.isError && !cart.data) {
    return (
      <div className="container-page py-16">
        <QueryError message={cart.error.message} onRetry={() => void cart.refetch()} />
      </div>
    )
  }

  if (!isDesktop) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col gap-1 pt-8">
        <div className="flex flex-col gap-3 px-7 pb-6">
          <MobileScreenHeader title="Carrinho de NFTs" />
          <QuoteIssues quote={quote.data} />
          {cart.isPending ? (
            <MobileItemsSkeleton />
          ) : items.length > 0 ? (
            <ul className="flex flex-col gap-5" aria-label="Itens no carrinho">
              {items.map((item) => (
                <li key={item.id} className="relative flex h-[100px] overflow-hidden rounded-[14px] bg-surface shadow-card">
                  <NftImage artwork={item.artwork} sizes="100px" alt="" className="size-[100px] shrink-0 rounded-l-[14px]" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-2 pl-2.5">
                    <div className="flex flex-col gap-1.5 leading-4">
                      <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="truncate pr-8 text-[15px] font-bold text-cream">
                        {item.name}
                      </Link>
                      <span className="text-sm text-sand">Edição: {item.editionLabel}</span>
                    </div>
                    <p className="text-lg leading-4 font-bold text-brand-text">{formatEth(item.lineTotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    aria-label={`Remover ${item.name} do carrinho`}
                    className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full text-amber transition-colors hover:text-coral"
                  >
                    <Trash2Icon className="size-[18px]" aria-hidden="true" />
                  </button>
                  <QuantityStepper
                    size="circle"
                    value={item.quantity}
                    max={Math.min(MAX_PER_LINE, Math.max(item.available, 1))}
                    onChange={(quantity) => updateQuantity(item, quantity)}
                    itemName={item.name}
                    className="absolute right-4 bottom-3 gap-2.5"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCart />
          )}
        </div>

        {items.length > 0 ? (
          <section
            aria-label="Resumo do pagamento"
            className="mt-auto flex flex-col gap-6 rounded-t-[40px] bg-surface px-6 pt-6 pb-[max(36px,env(safe-area-inset-bottom))]"
          >
            <PromoSection variant="mobile" {...promo} />
            <SummaryBlock quote={quote.data} isPending={quote.isPending} coupon={coupon} size="md" />
            <Button variant="cta" size="xl" className="w-full" disabled={!canCheckout} onClick={checkout}>
              Conectar e finalizar
            </Button>
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <div className="container-page mt-8">
      <Breadcrumb
        items={[
          { label: "Início", to: "/" },
          { label: "Mercado", to: "/", hash: "catalogo" },
          { label: "Carrinho" },
        ]}
      />
      <h1 className="sr-only">Carrinho de NFTs</h1>

      <div className="mt-3 grid grid-cols-[minmax(0,782px)_332px] items-start justify-between gap-12">
        <div className="flex flex-col gap-4">
          <QuoteIssues quote={quote.data} />
          {cart.isPending ? <DesktopItemsSkeleton /> : items.length > 0 ? <CartTable cart={cart.data!} onQuantity={updateQuantity} onRemove={removeItem} /> : <EmptyCart />}
        </div>

        <aside aria-labelledby="summary-title" className="flex flex-col gap-6">
          <h2 id="summary-title" className="border-b-[0.6px] border-line-soft pb-3 text-lg leading-4 font-bold text-cream">
            Resumo da carteira
          </h2>
          <PromoSection variant="desktop" {...promo} />
          <SummaryBlock quote={items.length ? quote.data : undefined} isPending={cart.isPending || (items.length > 0 && quote.isPending)} coupon={coupon} />
          <div className="flex flex-col items-center gap-3">
            <Button className="w-full rounded-xs text-[15px]" disabled={!canCheckout} onClick={checkout}>
              Conectar e finalizar
            </Button>
            <Link to="/" hash="catalogo" className="text-[15px] text-brand-text hover:underline">
              Continuar explorando
            </Link>
          </div>
        </aside>
      </div>

      {trending.data?.items.length ? <NftCarousel title="Colecionadores também viram" nfts={trending.data.items} className="mt-24" /> : null}
    </div>
  )
}

function CartTable({
  cart,
  onQuantity,
  onRemove,
}: {
  cart: Cart
  onQuantity: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}) {
  return (
    <table className="w-full border-separate border-spacing-y-3">
      <caption className="sr-only">Itens no carrinho</caption>
      <thead>
        <tr className="text-left text-base leading-4 text-cream">
          <th scope="col" className="w-[300px] border-b-[0.6px] border-line-soft pb-3 font-bold">
            NFTs
          </th>
          <th scope="col" className="border-b-[0.6px] border-line-soft pb-3 font-medium">
            Preço
          </th>
          <th scope="col" className="border-b-[0.6px] border-line-soft pb-3 font-bold">
            Edições
          </th>
          <th scope="col" className="w-[100px] border-b-[0.6px] border-line-soft pb-3 font-medium">
            Total
          </th>
          <th scope="col" className="w-12 border-b-[0.6px] border-line-soft pb-3">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {cart.items.map((item) => (
          <tr key={item.id} className="bg-surface">
            <td className="h-[70px] p-0">
              <div className="flex items-center gap-4">
                <NftImage artwork={item.artwork} sizes="70px" alt="" className="size-[70px] rounded-md" />
                <div className="flex min-w-0 flex-col gap-1.5 leading-4">
                  <Link to="/nft/$nftId" params={{ nftId: item.nftId }} className="truncate text-base font-bold text-cream hover:text-brand-text">
                    {item.name}
                  </Link>
                  <span className="text-sm whitespace-nowrap text-taupe">
                    ID do token: {item.tokenId} · {item.editionLabel}
                  </span>
                </div>
              </div>
            </td>
            <td className="text-base leading-4 font-bold whitespace-nowrap text-sand">{formatEth(item.unitPrice)}</td>
            <td>
              <QuantityStepper
                value={item.quantity}
                max={Math.min(MAX_PER_LINE, Math.max(item.available, 1))}
                onChange={(quantity) => onQuantity(item, quantity)}
                itemName={item.name}
              />
            </td>
            <td className="text-base leading-4 font-bold whitespace-nowrap text-brand-text">{formatEth(item.lineTotal)}</td>
            <td className="pr-6 text-right">
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remover ${item.name} do carrinho`}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-xs text-sand transition-colors hover:text-coral"
              >
                <Trash2Icon className="size-5" aria-hidden="true" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function PromoSection({
  variant,
  coupon,
  error,
  onApply,
  onRemove,
  pending,
}: {
  variant: "desktop" | "mobile"
  coupon: string | null
  error?: string
  onApply: (code: string) => void
  onRemove: () => void
  pending: boolean
}) {
  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xs border border-dashed border-brand px-3 py-2.5 text-sm" role="status">
        <span className="text-cream">
          Cupom <strong className="text-brand-text">{coupon}</strong> aplicado
        </span>
        <button type="button" onClick={onRemove} className="cursor-pointer text-brand-text hover:underline">
          Remover
        </button>
      </div>
    )
  }
  return <PromoCodeForm variant={variant} onApply={onApply} error={error} pending={pending} />
}

export function SummaryBlock({
  quote,
  isPending,
  coupon,
  size = "lg",
}: {
  quote?: Quote
  isPending: boolean
  coupon: string | null
  size?: "lg" | "md"
}) {
  if (isPending) return <SummarySkeleton />
  const values = quote ?? { subtotal: "0", discount: "0", networkFee: "0", total: "0" }
  return (
    <>
      <SummaryLines values={values} couponCode={quote?.coupon?.code ?? coupon} size={size} className={size === "md" ? "-mt-2" : undefined} />
      <SummaryTotal total={values.total} />
    </>
  )
}

export function QuoteIssues({ quote }: { quote?: Quote }) {
  if (!quote?.issues.length) return null
  return (
    <div role="alert" className="flex gap-3 rounded-md border border-coral/60 bg-coral/10 p-4 text-sm text-cream">
      <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-coral" aria-hidden="true" />
      <ul className="flex flex-col gap-1">
        {quote.issues.map((issue) => {
          const line = quote.items.find((item) => item.nftId === issue.nftId && item.editionId === issue.editionId)
          const name = line ? `${line.name} (${line.editionLabel})` : issue.nftId
          return (
            <li key={`${issue.type}-${issue.nftId}-${issue.editionId}`}>
              {issue.type === "INSUFFICIENT_AVAILABILITY"
                ? `${name}: só ${issue.available} unidade(s) disponível(is). Ajuste a quantidade para continuar.`
                : `${name}: o preço mudou de ${formatEth(issue.previousPrice)} para ${formatEth(issue.currentPrice)}.`}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DesktopItemsSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Carregando carrinho">
      <Skeleton className="h-7 w-full" />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-[70px] w-full rounded-none" />
      ))}
    </div>
  )
}

function MobileItemsSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="Carregando carrinho">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-[100px] w-full rounded-[14px]" />
      ))}
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-soft px-6 py-14 text-center">
      <ShoppingCartIcon className="size-10 text-brand-text" aria-hidden="true" />
      <h2 className="text-lg font-bold text-cream">Seu carrinho está vazio</h2>
      <p className="max-w-[36ch] text-sm leading-6 text-sand">Explore o mercado e adicione NFTs para continuar.</p>
      <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
        Explorar o mercado
      </Link>
    </div>
  )
}
