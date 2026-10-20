import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ExternalLinkIcon, Loader2Icon, XCircleIcon, XIcon } from "lucide-react"
import { useEffect, useRef } from "react"

import thankYouIcon from "@/assets/icons/thank-you.svg"
import type { Order } from "@/api/contracts"
import { QueryError } from "@/components/feedback/query-error"
import { NftImage } from "@/components/nft/nft-image"
import { buttonVariants } from "@/components/ui/button"
import { useOrder } from "@/features/order/use-order"
import { usePageTitle } from "@/hooks/use-page-title"
import { networkLabel, WALLET_OPTIONS } from "@/lib/catalog"
import { formatDate, formatEth, shortenAddress } from "@/lib/format"

/** Recibo do pedido. A confirmação só aparece para pedido efetivamente confirmado na simulação. */
export function ReceiptPage({ userId, orderId }: { userId: string; orderId: string }) {
  const order = useOrder(userId, orderId)
  const queryClient = useQueryClient()
  const status = order.data?.status
  usePageTitle(status === "confirmed" ? "Pedido confirmado" : status === "declined" ? "Pagamento recusado" : "Processando pedido")

  // Ao confirmar, o servidor remove do carrinho só os itens comprados: sincroniza o cache.
  const wasPending = useRef(false)
  useEffect(() => {
    if (status === "pending") wasPending.current = true
    if (status && status !== "pending" && wasPending.current) void queryClient.invalidateQueries({ queryKey: ["cart"] })
  }, [status, queryClient])

  if (order.isPending) return <PendingCard title="Carregando pedido…" />
  if (order.isError) {
    return (
      <div className="container-page py-16">
        <QueryError title="Não foi possível abrir o pedido" message={order.error.message} onRetry={() => void order.refetch()} />
      </div>
    )
  }
  if (order.data.status === "pending") return <PendingCard title="Aguardando confirmação da carteira…" />
  if (order.data.status === "declined") return <DeclinedCard order={order.data} />
  return <ConfirmedReceipt order={order.data} />
}

function Shell({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  return (
    <div className="flex justify-center px-4 py-8 lg:py-20">
      <article aria-labelledby={labelledBy} className="relative w-full max-w-[578px] bg-surface shadow-float">
        <Link
          to="/"
          aria-label="Fechar e voltar ao início"
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-xs text-brand-text transition-colors hover:bg-surface-raised"
        >
          <XIcon className="size-[18px]" aria-hidden="true" />
        </Link>
        {children}
        <div aria-hidden="true" className="h-2.5 bg-brand" />
      </article>
    </div>
  )
}

function PendingCard({ title }: { title: string }) {
  return (
    <Shell labelledBy="order-status">
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center" role="status" aria-live="polite">
        <Loader2Icon className="size-10 animate-spin text-brand-text motion-reduce:animate-none" aria-hidden="true" />
        <h1 id="order-status" className="text-base font-bold text-cream">
          {title}
        </h1>
        <p className="max-w-[40ch] text-sm leading-6 text-sand">
          Não feche esta página. Se a conexão cair, o status do pedido é recuperado automaticamente — sem nova cobrança.
        </p>
      </div>
    </Shell>
  )
}

function DeclinedCard({ order }: { order: Order }) {
  return (
    <Shell labelledBy="order-status">
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center" role="alert">
        <XCircleIcon className="size-12 text-coral" aria-hidden="true" />
        <h1 id="order-status" className="text-lg font-bold text-cream">
          Pagamento recusado
        </h1>
        <p className="max-w-[44ch] text-sm leading-6 text-sand">{order.failureReason}</p>
        <p className="text-sm text-sand">Seus itens continuam no carrinho.</p>
        <Link to="/carrinho" className={buttonVariants({ className: "mt-2" })}>
          Voltar ao carrinho
        </Link>
      </div>
    </Shell>
  )
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const wallet = WALLET_OPTIONS.find((item) => item.id === order.walletType)?.name ?? order.walletType
  return (
    <Shell labelledBy="receipt-title">
      <header className="flex flex-col items-center justify-center gap-4 px-6 pt-6 pb-5 text-center">
        <img src={thankYouIcon} alt="" width={65} height={80} className="h-20 w-[65px]" />
        <h1 id="receipt-title" className="text-base leading-5 font-bold text-sand">
          Seus NFTs agora estão na sua carteira
        </h1>
        <p className="sr-only" role="status">
          Pedido {order.id} confirmado.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-y-4 border-y border-brand px-6 py-3 text-sand sm:flex sm:items-center sm:justify-between sm:px-9 sm:py-4">
        <MetaItem label="ID da transação" value={shortenAddress(order.transactionHash ?? "")} strong />
        <MetaItem label="Data" value={formatDate(order.updatedAt)} divided />
        <MetaItem label="Total" value={formatEth(order.total)} divided />
        <MetaItem label="Carteira" value={wallet} strong divided />
      </dl>

      <section aria-labelledby="receipt-details" className="flex flex-col gap-3 px-6 pt-5 pb-12 sm:px-11">
        <h2 id="receipt-details" className="text-[15px] leading-4 font-bold text-cream">
          Detalhes da transação
        </h2>
        <table className="w-full border-separate border-spacing-y-3">
          <caption className="sr-only">NFTs comprados</caption>
          <thead>
            <tr className="text-base leading-4 text-cream">
              <th scope="col" className="border-b-[0.6px] border-line-soft pb-3 text-left font-bold">
                NFTs
              </th>
              <th scope="col" className="w-[90px] border-b-[0.6px] border-line-soft pb-3 text-center font-bold">
                Edições
              </th>
              <th scope="col" className="w-[100px] border-b-[0.6px] border-line-soft pb-3 text-right font-medium">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.nftId}-${item.editionId}`}>
                <td className="p-0">
                  <div className="flex items-center gap-3">
                    <NftImage artwork={item.artwork} sizes="70px" alt="" className="size-[66px] shrink-0 rounded-lg sm:size-[70px]" />
                    <div className="flex min-w-0 flex-col gap-1.5 leading-4">
                      <p className="text-base font-bold text-cream">{item.name}</p>
                      <p className="text-sm text-taupe">
                        ID do token: {item.tokenId} · {item.editionLabel}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-center text-sm text-sand">(x {item.quantity})</td>
                <td className="text-right text-lg leading-4 font-bold whitespace-nowrap text-brand-text">{formatEth(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3 border-b-[0.6px] border-line-soft pb-3">
          {order.coupon ? (
            <div className="flex items-center justify-between text-[15px] text-cream">
              <dt>Desconto ({order.coupon.code})</dt>
              <dd>(-) {formatEth(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-[15px] text-cream">
            <dt>Taxa de rede</dt>
            <dd className="text-lg leading-4">{formatEth(order.networkFee)}</dd>
          </div>
          <div className="flex items-center justify-between leading-4 font-bold">
            <dt className="text-base text-cream">Total</dt>
            <dd className="text-lg text-brand-text">{formatEth(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-center text-sm leading-[22px] text-sand">
          Transação confirmada na {networkLabel(order.network)}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
        </p>
        {order.explorerUrl ? (
          <a
            href={order.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "mx-auto mt-5 h-12 rounded-sm px-4 text-base" })}
          >
            Ver no Etherscan
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">(link simulado, abre em nova aba)</span>
          </a>
        ) : null}
      </section>
    </Shell>
  )
}

function MetaItem({ label, value, strong, divided }: { label: string; value: string; strong?: boolean; divided?: boolean }) {
  return (
    <div className={divided ? "flex flex-col sm:border-l sm:border-brand sm:pl-4" : "flex flex-col"}>
      <dt className={strong ? "text-sm leading-4 font-bold" : "text-sm leading-4"}>{label}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  )
}
