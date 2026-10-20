import { createFileRoute } from "@tanstack/react-router"

import { AccountLayout } from "@/features/account/account-layout"

export const Route = createFileRoute("/conta")({
  component: AccountLayout,
})
