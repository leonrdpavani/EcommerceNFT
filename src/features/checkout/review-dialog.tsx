import { useMutation } from "@tanstack/react-query"
import { CheckCircle2Icon, Loader2Icon, PlugZapIcon, TriangleAlertIcon } from "lucide-react"
import { useRef, useState } from "react"
import { cn } from "cn"

import type { CreateOrderRequest, Order, Quote, WalletConnection } from "@/api/contracts"
import { api } from "@/api/endpoints"
import { isApiError, type ApiError } from "@/api/http"
import { NftImage } from "@/components/nft/nft-image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { SummaryLines, SummaryTotal } from "@/features/cart/order-summary"
import type { CheckoutValues } from "@/features/checkout/checkout-schema"
import { useCreateOrder } from "@/features/checkout/use-create-order"
import { networkLabel, WALLET_OPTIONS } from "@/lib/catalog"
import { formatEth, shortenAddress } from "@/lib/format"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: CheckoutValues | null
  /** Cotação atual (pode mudar em tempo real enquanto o diálogo está aberto). */
  quote: Quote | undefined
  quoteFetching: boolean
  onOrderPlaced: (order: Order) => void
  onQuoteOutdated: () => void
}

function quoteSignature(quote: Quote) {
  return JSON.stringify([quote.total, quote.discount, quote.networkFee, quote.items.map((item) => [item.nftId, item.editionId, item.quantity, item.unitPrice])])
}

/**
 * Revisão antes do envio: mostra exatamente o que será cobrado, conecta a carteira e
 * envia o pedido. Se preço, disponibilidade ou taxas mudarem, exige nova confirmação.
 */
export function ReviewDialog({ open, onOpenChange, values, quote, quoteFetching, onOrderPlaced, onQuoteOutdated }: ReviewDialogProps) {
  const [acknowledged, setAcknowledged] = useState<string | null>(null)
  const [walletLink, setWalletLink] = useState<{ key: string; connection: WalletConnection } | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [retryScheduled, setRetryScheduled] = useState(false)
  /** Pedido enviado: corpo e cotação congelados — a nova tentativa reenvia exatamente o mesmo conteúdo. */
  const [submission, setSubmission] = useState<{ body: CreateOrderRequest; quote: Quote } | null>(null)
  const createOrder = useCreateOrder()
  const autoRetried = useRef(false)

  const connect = useMutation({
    mutationFn: () =>
      api.connectWallet({ walletType: values!.paymentWallet, network: values!.network, address: values!.walletAddress }),
    onSuccess: (data) => setWalletLink({ key: walletKey, connection: data }),
  })

  // A conexão vale apenas para a carteira, rede e endereço em que foi feita.
  const walletKey = values ? `${values.paymentWallet}|${values.network}|${values.walletAddress}` : ""
  const connection = walletLink?.key === walletKey ? walletLink.connection : null

  // Ao abrir, a cotação exibida passa a ser a referência confirmada pelo usuário.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && quote) setAcknowledged(quoteSignature(quote))
    if (!open) {
      setTimedOut(false)
      setSubmission(null)
      createOrder.reset()
    }
  }

  const shownQuote = submission?.quote ?? quote
  const changed = !submission && Boolean(quote && acknowledged && quoteSignature(quote) !== acknowledged)
  const issues = submission ? [] : (quote?.issues ?? [])
  const wallet = WALLET_OPTIONS.find((item) => item.id === values?.paymentWallet)
  const busy = createOrder.isPending
  const canPay = submission
    ? !busy && !retryScheduled
    : Boolean(quote && connection && !changed && issues.length === 0 && !quoteFetching && !busy)

  function send(body: CreateOrderRequest) {
    createOrder.mutate(body, {
      onSuccess: (order) => {
        setTimedOut(false)
        onOrderPlaced(order)
      },
      onError: (error) => {
        if (!isApiError(error)) return
        // Sem resposta (timeout/rede): o pedido pode ter sido criado. Reenvia com a MESMA
        // chave de idempotência — o servidor devolve o pedido existente em vez de duplicar.
        if (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR" || error.code === "TRANSIENT") {
          setTimedOut(true)
          if (!autoRetried.current) {
            autoRetried.current = true
            setRetryScheduled(true)
            setTimeout(() => {
              setRetryScheduled(false)
              send(body)
            }, 1200)
          }
          return
        }
        // Erros definitivos: a tentativa termina; o usuário revisa e envia de novo.
        setSubmission(null)
        setTimedOut(false)
        if (error.code === "QUOTE_OUTDATED") onQuoteOutdated()
        if (error.code === "WALLET_DISCONNECTED") setWalletLink(null)
      },
    })
  }

  function submit() {
    if (submission) {
      autoRetried.current = true
      send(submission.body)
      return
    }
    if (!quote || !values || !connection) return
    const body: CreateOrderRequest = {
      quoteId: quote.id,
      network: values.network,
      walletType: values.paymentWallet,
      walletSessionId: connection.sessionId,
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
    }
    autoRetried.current = false
    setSubmission({ body, quote })
    send(body)
  }

  const orderError = createOrder.error as ApiError | null
  const showOrderError = orderError && !timedOut && orderError.code !== "QUOTE_OUTDATED" && orderError.code !== "WALLET_DISCONNECTED"

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="w-[560px] max-w-[calc(100%-1.5rem)] gap-0 p-0 sm:max-w-[560px]">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex flex-col gap-2 pr-8">
            <DialogTitle className="text-lg">Revise seu pedido</DialogTitle>
            <DialogDescription className="text-sm text-sand">
              Confira os valores, conecte a carteira e confirme o pagamento.
            </DialogDescription>
          </div>

          {changed ? (
            <div role="alert" className="flex flex-col gap-3 rounded-md border border-amber/60 bg-amber/10 p-4 text-sm text-cream">
              <p className="flex gap-2">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
                Os valores mudaram desde que você abriu a revisão. Confira o novo total antes de pagar.
              </p>
              <Button variant="outline" size="sm" className="w-fit" onClick={() => quote && setAcknowledged(quoteSignature(quote))}>
                Aceitar novos valores
              </Button>
            </div>
          ) : null}

          {issues.length > 0 ? (
            <p role="alert" className="rounded-md border border-coral/60 bg-coral/10 p-4 text-sm text-cream">
              Alguns itens não têm mais a quantidade escolhida disponível. Volte ao carrinho para ajustar.
            </p>
          ) : null}

          <ul className="flex max-h-[220px] flex-col gap-2 overflow-y-auto" aria-label="Itens do pedido">
            {(shownQuote?.items ?? []).map((item) => (
              <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-3 bg-surface-raised p-1.5 pr-3">
                <NftImage artwork={item.artwork} sizes="48px" alt="" className="size-12 rounded-md" />
                <div className="flex min-w-0 flex-1 flex-col gap-1 leading-4">
                  <p className="truncate text-sm font-bold text-cream">{item.name}</p>
                  <p className="text-xs text-taupe">
                    {item.editionLabel} · {item.quantity} × {formatEth(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-bold whitespace-nowrap text-brand-text">{formatEth(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          {shownQuote ? (
            <div className="flex flex-col gap-3 border-t-[0.6px] border-line-soft pt-4">
              <SummaryLines values={shownQuote} couponCode={shownQuote.coupon?.code} size="md" />
              <SummaryTotal total={shownQuote.total} />
            </div>
          ) : null}

          <section aria-labelledby="review-wallet" className="flex flex-col gap-3 rounded-md border border-line p-4">
            <h3 id="review-wallet" className="text-sm font-bold text-cream">
              Carteira e rede
            </h3>
            <p className="text-sm text-sand">
              {wallet?.name} · {values ? networkLabel(values.network) : ""} · {values ? shortenAddress(values.walletAddress) : ""}
            </p>
            <div aria-live="polite">
              {connection || submission ? (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2Icon className="size-4" aria-hidden="true" />
                  Carteira conectada
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-fit"
                    onClick={() => connect.mutate()}
                    disabled={connect.isPending || !values}
                    aria-busy={connect.isPending}
                  >
                    {connect.isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <PlugZapIcon aria-hidden="true" />}
                    {connect.isPending ? "Aguardando a carteira…" : "Conectar carteira"}
                  </Button>
                  {connect.error ? (
                    <p role="alert" className="text-[13px] text-coral">
                      {isApiError(connect.error) ? connect.error.message : "Não foi possível conectar a carteira."}
                    </p>
                  ) : null}
                  {orderError?.code === "WALLET_DISCONNECTED" ? (
                    <p role="alert" className="text-[13px] text-coral">
                      {orderError.message}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          {timedOut ? (
            <p role="status" className="rounded-md border border-line-soft bg-surface-raised p-3 text-sm text-cream">
              {busy || retryScheduled
                ? "Não recebemos a resposta a tempo. Verificando se o pedido foi criado… (sem nova cobrança)"
                : "Ainda não foi possível confirmar o envio. Tente novamente — o mesmo pedido será recuperado, sem duplicar a compra."}
            </p>
          ) : null}
          {showOrderError ? (
            <p role="alert" className="text-sm text-coral">
              {orderError.message}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Voltar e editar
            </Button>
            <Button
              size="lg"
              className={cn("rounded-lg text-[15px]", busy && "cursor-progress")}
              onClick={submit}
              disabled={!canPay}
              aria-busy={busy}
            >
              {busy ? (
                <>
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                  Enviando pedido…
                </>
              ) : timedOut ? (
                "Tentar novamente"
              ) : (
                "Confirmar e pagar"
              )}
            </Button>
          </div>
        </div>
        <div aria-hidden="true" className="h-2.5 bg-brand" />
      </DialogContent>
    </Dialog>
  )
}
