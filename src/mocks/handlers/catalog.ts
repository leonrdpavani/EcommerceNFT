import { http, HttpResponse } from "msw"

import type { NftDetailResponse, NftListResponse, RelatedNftsResponse } from "@/api/contracts"
import { catalogSearchSchema } from "@/lib/catalog-search"

import { queryCatalog } from "../catalog-query"
import { networkDelay } from "../config"
import { getDb } from "../db"
import { API, apiError } from "../http-utils"

function listParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value ? value.split(",").filter(Boolean) : []
}

function numberParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value === null || value === "" ? undefined : Number(value)
}

export const catalogHandlers = [
  http.get(`${API}/nfts`, async ({ request }) => {
    await networkDelay()
    const params = new URL(request.url).searchParams
    const parsed = catalogSearchSchema.safeParse({
      q: params.get("q") ?? undefined,
      tab: params.get("tab") ?? undefined,
      sort: params.get("sort") ?? undefined,
      categories: listParam(params, "categories"),
      networks: listParam(params, "networks"),
      min: numberParam(params, "min"),
      max: numberParam(params, "max"),
      page: numberParam(params, "page"),
    })
    if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Parâmetros de busca inválidos.")
    const db = await getDb()
    return HttpResponse.json<NftListResponse>(queryCatalog(db.nfts, parsed.data))
  }),

  http.get(`${API}/nfts/:id`, async ({ params }) => {
    await networkDelay()
    const db = await getDb()
    const nft = db.nfts.find((item) => item.id === params.id)
    if (!nft) return apiError(404, "NOT_FOUND", "NFT não encontrado.")
    return HttpResponse.json<NftDetailResponse>(nft)
  }),

  http.get(`${API}/nfts/:id/related`, async ({ params }) => {
    await networkDelay()
    const db = await getDb()
    const nft = db.nfts.find((item) => item.id === params.id)
    const items = db.nfts
      .filter((item) => item.id !== params.id)
      .sort((a, b) => Number(b.collection === nft?.collection) - Number(a.collection === nft?.collection) || b.trendingScore - a.trendingScore)
      .slice(0, 10)
    return HttpResponse.json<RelatedNftsResponse>({ items })
  }),
]
