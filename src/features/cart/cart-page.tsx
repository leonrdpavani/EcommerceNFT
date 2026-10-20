import { Link, useNavigate } from "@tanstack/react-router"
import { ShoppingCartIcon, Trash2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { cn } from "cn"

import { Breadcrumb, MobileScreenHeader } from "@/components/layout/page-parts"
import { NftCarousel } from "@/components/nft/nft-carousel"
import { NftImage } from "@/components/nft/nft-image"
import { QuantityStepper } from "@/components/nft/quantity-stepper"
import { Button, buttonVariants } from "@/components/ui/button"
import { SummaryLines, SummaryTotal } from "@/features/cart/order-summary"
import { PromoCodeForm } from "@/features/cart/promo-code-form"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"
import { formatEth } from "@/lib/format"
import { buildCart, PREVIEW_CART, relatedNfts, type PreviewCart, type PreviewCartItem } from "@/preview"
import type { CartLine } from "@/types/domain"

const MAX_PER_LINE = 10

export function CartPage() {
  usePageTitle("Carrinho")
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  // Pré-visualização: na integração, o carrinho vem de GET /cart e as alterações são mutations.
  const [lines, setLines] = useState<CartLine[]>(PREVIEW_CART)
  const [couponError, setCouponError] = useState<string>()
  const cart = useMemo(() => buildCart(lines), [lines])

  function updateQuantity(item: PreviewCartItem, quantity: number) {
    setLines((current) =>
      current.map((line) =>
        line.nftId === item.nftId && line.editionId === item.editionId ? { ...line, quantity } : line
      )
    )
  }

  function removeItem(item: PreviewCartItem) {
    setLines((current) => current.filter((line) => !(line.nftId === item.nftId && line.editionId === item.editionId)))
    toast.success(`${item.nft.name} removido do carrinho.`)
  }

  function applyCoupon(code: string) {
    setCouponError(`O cupom ${code} não é válido. (Validação real na integração com a API.)`)
  }

  const handlers = { updateQuantity, removeItem }
  const checkout = () => void navigate({ to: "/pagamento" })

  if (!isDesktop) {
    return (
      <MobileCart cart={cart} {...handlers} onApplyCoupon={applyCoupon} couponError={couponError} onCheckout={checkout} />
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
        {cart.items.length > 0 ? (
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
                <th scope="col" className="w-[87px] border-b-[0.6px] border-line-soft pb-3 font-medium">
                  Total
                </th>
                <th scope="col" className="w-12 border-b-[0.6px] border-line-soft pb-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={`${item.nftId}-${item.editionId}`} className="bg-surface">
                  <td className="h-[70px] p-0">
                    <div className="flex items-center gap-4">
                      <NftImage artwork={item.nft.artwork} sizes="70px" alt="" className="size-[70px] rounded-md" />
                      <div className="flex min-w-0 flex-col gap-1.5 leading-4">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: item.nftId }}
                          className="truncate text-base font-bold text-cream hover:text-brand-text"
                        >
                          {item.nft.name}
                        </Link>
                        <span className="text-sm whitespace-nowrap text-taupe">
                          ID do token: {item.nft.tokenId} · {item.editionLabel}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="text-base leading-4 font-bold text-sand">{formatEth(item.nft.price)}</td>
                  <td>
                    <QuantityStepper
                      value={item.quantity}
                      max={MAX_PER_LINE}
                      onChange={(quantity) => updateQuantity(item, quantity)}
                      itemName={item.nft.name}
                    />
                  </td>
                  <td className="text-base leading-4 font-bold whitespace-nowrap text-brand-text">
                    {formatEth(item.lineTotal)}
                  </td>
                  <td className="pr-6 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      aria-label={`Remover ${item.nft.name} do carrinho`}
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-xs text-sand transition-colors hover:text-coral"
                    >
                      <Trash2Icon className="size-5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyCart />
        )}

        <aside aria-labelledby="summary-title" className="flex flex-col gap-6">
          <h2 id="summary-title" className="border-b-[0.6px] border-line-soft pb-3 text-lg leading-4 font-bold text-cream">
            Resumo da carteira
          </h2>
          <PromoCodeForm onApply={applyCoupon} error={couponError} />
          <SummaryLines values={cart} />
          <SummaryTotal total={cart.total} />
          <div className="flex flex-col items-center gap-3">
            <Button className="w-full rounded-xs text-[15px]" disabled={cart.items.length === 0} onClick={checkout}>
              Conectar e finalizar
            </Button>
            <Link to="/" hash="catalogo" className="text-[15px] text-brand-text hover:underline">
              Continuar explorando
            </Link>
          </div>
        </aside>
      </div>

      <NftCarousel title="Colecionadores também viram" nfts={relatedNfts()} className="mt-24" />
    </div>
  )
}

function MobileCart({
  cart,
  updateQuantity,
  removeItem,
  onApplyCoupon,
  couponError,
  onCheckout,
}: {
  cart: PreviewCart
  updateQuantity: (item: PreviewCartItem, quantity: number) => void
  removeItem: (item: PreviewCartItem) => void
  onApplyCoupon: (code: string) => void
  couponError?: string
  onCheckout: () => void
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col gap-1 pt-8">
      <div className="flex flex-col gap-3 px-7 pb-6">
        <MobileScreenHeader title="Carrinho de NFTs" />
        {cart.items.length > 0 ? (
          <ul className="flex flex-col gap-5" aria-label="Itens no carrinho">
            {cart.items.map((item) => (
              <li
                key={`${item.nftId}-${item.editionId}`}
                className="relative flex h-[100px] overflow-hidden rounded-[14px] bg-surface shadow-card"
              >
                <NftImage artwork={item.nft.artwork} sizes="100px" alt="" className="size-[100px] shrink-0 rounded-l-[14px]" />
                <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-2 pl-2.5">
                  <div className="flex flex-col gap-1.5 leading-4">
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: item.nftId }}
                      className="truncate pr-8 text-[15px] font-bold text-cream"
                    >
                      {item.nft.name}
                    </Link>
                    <span className="text-sm text-sand">Edição: {item.editionLabel}</span>
                  </div>
                  <p className="text-lg leading-4 font-bold text-brand-text">{formatEth(item.lineTotal)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  aria-label={`Remover ${item.nft.name} do carrinho`}
                  className="absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-full text-amber transition-colors hover:text-coral"
                >
                  <Trash2Icon className="size-[18px]" aria-hidden="true" />
                </button>
                <QuantityStepper
                  size="circle"
                  value={item.quantity}
                  max={MAX_PER_LINE}
                  onChange={(quantity) => updateQuantity(item, quantity)}
                  itemName={item.nft.name}
                  className="absolute right-4 bottom-3 gap-2.5"
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyCart />
        )}
      </div>

      <section
        aria-label="Resumo do pagamento"
        className="mt-auto flex flex-col gap-6 rounded-t-[40px] bg-surface px-6 pt-6 pb-[max(36px,env(safe-area-inset-bottom))]"
      >
        <PromoCodeForm variant="mobile" onApply={onApplyCoupon} error={couponError} />
        <SummaryLines values={cart} size="md" className="-mt-2" />
        <SummaryTotal total={cart.total} />
        <Button variant="cta" size="xl" className="w-full" disabled={cart.items.length === 0} onClick={onCheckout}>
          Conectar e finalizar
        </Button>
      </section>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-lg border border-dashed border-line-soft px-6 py-14 text-center")}>
      <ShoppingCartIcon className="size-10 text-brand-text" aria-hidden="true" />
      <h2 className="text-lg font-bold text-cream">Seu carrinho está vazio</h2>
      <p className="max-w-[36ch] text-sm leading-6 text-sand">Explore o mercado e adicione NFTs para continuar.</p>
      <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
        Explorar o mercado
      </Link>
    </div>
  )
}
