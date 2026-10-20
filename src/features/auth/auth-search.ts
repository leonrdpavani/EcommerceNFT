import { z } from "zod"

/** `redirect` preserva o fluxo anterior para retomar após autenticar. */
export const authSearchSchema = z.object({
  redirect: z.string().startsWith("/").optional().catch(undefined),
})
