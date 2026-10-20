import { createFileRoute } from "@tanstack/react-router"

import { CheckoutPage } from "@/features/checkout/checkout-page"
import { requireSession } from "@/features/session/require-auth"

export const Route = createFileRoute("/pagamento")({
  beforeLoad: requireSession,
  component: CheckoutPage,
})
