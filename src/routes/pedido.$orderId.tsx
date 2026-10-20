import { createFileRoute } from "@tanstack/react-router"

import { ReceiptPage } from "@/features/order/receipt-page"

export const Route = createFileRoute("/pedido/$orderId")({
  component: OrderRoute,
})

function OrderRoute() {
  const { orderId } = Route.useParams()
  return <ReceiptPage orderId={orderId} />
}
