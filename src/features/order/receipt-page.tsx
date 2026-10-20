import { Link } from "@tanstack/react-router"
import { ExternalLinkIcon, XIcon } from "lucide-react"

import thankYouIcon from "@/assets/icons/thank-you.svg"
import { NftImage } from "@/components/nft/nft-image"
import { buttonVariants } from "@/components/ui/button"
import { usePageTitle } from "@/hooks/use-page-title"
import { formatEth } from "@/lib/format"
import { getPreviewCart } from "@/preview"

/** Recibo do pedido confirmado (Figma: Order Confirmation Modal). */
export function ReceiptPage({ orderId }: { orderId: string }) {
  usePageTitle("Pedido confirmado")
  // Pré-visualização: na integração, o recibo é o snapshot imutável retornado por GET /orders/:id.
  const cart = getPreviewCart()
  const receipt = {
    transactionId: "0xA91F…E82C",
    date: "29 Jul, 2026",
    wallet: "MetaMask",
    network: "Ethereum",
  }

  return (
    <div className="flex justify-center px-4 py-8 lg:py-20">
      <article
        aria-labelledby="receipt-title"
        className="relative w-full max-w-[578px] bg-surface shadow-float"
      >
        <Link
          to="/"
          aria-label="Fechar recibo e voltar ao início"
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-xs text-brand-text transition-colors hover:bg-surface-raised"
        >
          <XIcon className="size-[18px]" aria-hidden="true" />
        </Link>

        <header className="flex flex-col items-center justify-center gap-4 px-6 pt-6 pb-5 text-center">
          <img src={thankYouIcon} alt="" width={65} height={80} className="h-20 w-[65px]" />
          <h1 id="receipt-title" className="text-base leading-5 font-bold text-sand">
            Seus NFTs agora estão na sua carteira
          </h1>
          <p className="sr-only">Pedido {orderId} confirmado.</p>
        </header>

        <dl className="grid grid-cols-2 gap-y-4 border-y border-brand px-6 py-3 text-sand sm:flex sm:items-center sm:justify-between sm:px-9 sm:py-4">
          <MetaItem label="ID da transação" value={receipt.transactionId} strong />
          <MetaItem label="Data" value={receipt.date} divided />
          <MetaItem label="Total" value={formatEth(cart.total)} divided />
          <MetaItem label="Carteira" value={receipt.wallet} strong divided />
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
              {cart.items.map((item) => (
                <tr key={`${item.nftId}-${item.editionId}`}>
                  <td className="p-0">
                    <div className="flex items-center gap-3">
                      <NftImage artwork={item.nft.artwork} sizes="70px" alt="" className="size-[66px] shrink-0 rounded-lg sm:size-[70px]" />
                      <div className="flex min-w-0 flex-col gap-1.5 leading-4">
                        <p className="text-base font-bold text-cream">{item.nft.name}</p>
                        <p className="text-sm text-taupe">ID do token: {item.nft.tokenId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center text-sm text-sand">(x {item.quantity})</td>
                  <td className="text-right text-lg leading-4 font-bold whitespace-nowrap text-brand-text">
                    {formatEth(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3 border-b-[0.6px] border-line-soft pb-3">
            <div className="flex items-center justify-between text-[15px] text-cream">
              <dt>Taxa de rede</dt>
              <dd className="text-lg leading-4">{formatEth(cart.fee)}</dd>
            </div>
            <div className="flex items-center justify-between leading-4 font-bold">
              <dt className="text-base text-cream">Total</dt>
              <dd className="text-lg text-brand-text">{formatEth(cart.total)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-center text-sm leading-[22px] text-sand">
            Transação confirmada na {receipt.network}. A propriedade foi transferida para sua carteira conectada e
            registrada na rede.
          </p>
          <a
            href={`https://etherscan.io/tx/${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "mx-auto mt-5 h-12 rounded-sm px-4 text-base" })}
          >
            Ver no Etherscan
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
            <span className="sr-only">(simulado, abre em nova aba)</span>
          </a>
        </section>
        <div aria-hidden="true" className="h-2.5 bg-brand" />
      </article>
    </div>
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
