import { createFileRoute } from "@tanstack/react-router"

import { ReceiptPage } from "@/features/order/receipt-page"
import { requireSession } from "@/features/session/require-auth"

export const Route = createFileRoute("/pedido/$orderId")({
  beforeLoad: requireSession,
  component: OrderRoute,
})

function OrderRoute() {
  const { orderId } = Route.useParams()
  const { session } = Route.useRouteContext()
  return <ReceiptPage key={`${session.user.id}-${orderId}`} userId={session.user.id} orderId={orderId} />
}
