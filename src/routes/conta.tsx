import { createFileRoute } from "@tanstack/react-router"

import { AccountLayout } from "@/features/account/account-layout"
import { requireSession } from "@/features/session/require-auth"

export const Route = createFileRoute("/conta")({
  beforeLoad: requireSession,
  component: AccountLayout,
})
