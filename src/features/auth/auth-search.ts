import * as z from "zod/mini"

/** `redirect` preserva o fluxo anterior para retomar após autenticar (apenas caminhos internos). */
export const authSearchSchema = z.object({
  redirect: z.catch(z.optional(z.string().check(z.startsWith("/"))), undefined),
})
