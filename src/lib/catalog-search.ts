import { z } from "zod"

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

/** Estado do catálogo na URL: sobrevive a refresh e navegação pelo histórico. */
export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  tab: z.enum(["todos", "novos", "em-alta"]).default("todos").catch("todos"),
  sort: z.enum(["recentes", "preco-asc", "preco-desc", "nome"]).default("recentes").catch("recentes"),
  categories: z.array(z.enum(categoryIds)).default([]).catch([]),
  networks: z.array(z.enum(networkIds)).default([]).catch([]),
  min: z.number().nonnegative().optional().catch(undefined),
  max: z.number().nonnegative().optional().catch(undefined),
  page: z.number().int().positive().default(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const DEFAULT_CATALOG_SEARCH: CatalogSearch = catalogSearchSchema.parse({})
