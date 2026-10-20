// zod/mini: API funcional e tree-shakeable — este schema fica no bundle inicial (search da rota).
import * as z from "zod/mini"

const categoryIds = [
  "arte-digital",
  "fotografia",
  "musica",
  "arte-3d",
  "colecionaveis",
  "generativa",
  "jogos",
  "assinaturas",
  "utilidade",
] as const

const networkIds = ["ethereum", "polygon", "solana"] as const

/** Estado do catálogo na URL: sobrevive a refresh e navegação pelo histórico. Valores inválidos voltam ao padrão. */
export const catalogSearchSchema = z.object({
  q: z.catch(z.optional(z.string().check(z.trim(), z.maxLength(80))), undefined),
  tab: z.catch(z._default(z.enum(["todos", "novos", "em-alta"]), "todos"), "todos"),
  sort: z.catch(z._default(z.enum(["recentes", "preco-asc", "preco-desc", "nome"]), "recentes"), "recentes"),
  categories: z.catch(z._default(z.array(z.enum(categoryIds)), []), []),
  networks: z.catch(z._default(z.array(z.enum(networkIds)), []), []),
  min: z.catch(z.optional(z.number().check(z.nonnegative())), undefined),
  max: z.catch(z.optional(z.number().check(z.nonnegative())), undefined),
  page: z.catch(z._default(z.int().check(z.positive()), 1), 1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const DEFAULT_CATALOG_SEARCH: CatalogSearch = catalogSearchSchema.parse({})
