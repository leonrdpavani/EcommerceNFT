import type { ArtworkKey, CategoryId, Edition, NetworkId, Nft } from "@/types/domain"

type Seed = [
  name: string,
  artwork: ArtworkKey,
  category: CategoryId,
  network: NetworkId,
  price: string,
  extra?: { compareAtPrice?: string; badge?: "raro"; isNewRelease?: boolean; trendingScore?: number },
]

/** Fixtures determinísticas do catálogo — variedade suficiente para filtros, ordenação e paginação. */
const SEEDS: Seed[] = [
  ["Emerald Ape #042", "emerald-ape", "arte-digital", "ethereum", "1.19", { trendingScore: 98 }],
  ["Sage Nomad #009", "sage-nomad", "arte-digital", "ethereum", "1.69", { isNewRelease: true, trendingScore: 74 }],
  ["Neon Vessel #552", "ivory-baron", "colecionaveis", "polygon", "1.99", { compareAtPrice: "2.29", badge: "raro", trendingScore: 91 }],
  ["Cosmic Bloom #118", "sage-nomad", "generativa", "ethereum", "1.29", { trendingScore: 66 }],
  ["Violet Nomad #314", "sage-nomad", "arte-digital", "solana", "1.39", { isNewRelease: true, trendingScore: 58 }],
  ["Ivory Baron #088", "ivory-baron", "fotografia", "ethereum", "1.79", { trendingScore: 87 }],
  ["Golden Beat #207", "golden-beat", "musica", "polygon", "0.99", { isNewRelease: true, trendingScore: 79 }],
  ["Golden Frequency #071", "golden-beat", "musica", "ethereum", "0.59", { trendingScore: 42 }],
  ["Golden Signal #160", "golden-beat", "musica", "solana", "0.39", { trendingScore: 51 }],
  ["Jade Monarch #233", "emerald-ape", "colecionaveis", "ethereum", "3.40", { badge: "raro", trendingScore: 95 }],
  ["Velvet Drifter #017", "sage-nomad", "arte-3d", "polygon", "0.82", { trendingScore: 33 }],
  ["Onyx Regent #401", "ivory-baron", "arte-3d", "ethereum", "2.15", { isNewRelease: true, trendingScore: 70 }],
  ["Amber Pulse #126", "golden-beat", "jogos", "polygon", "0.47", { trendingScore: 61 }],
  ["Moss Wanderer #305", "sage-nomad", "fotografia", "solana", "0.73", { trendingScore: 28 }],
  ["Ember Vessel #519", "ivory-baron", "generativa", "ethereum", "1.08", { compareAtPrice: "1.35", trendingScore: 64 }],
  ["Saffron Echo #064", "golden-beat", "assinaturas", "ethereum", "0.25", { isNewRelease: true, trendingScore: 22 }],
  ["Obsidian Muse #377", "ivory-baron", "arte-digital", "polygon", "4.85", { badge: "raro", trendingScore: 89 }],
  ["Verdant Sovereign #001", "emerald-ape", "arte-digital", "ethereum", "12.30", { badge: "raro", trendingScore: 100 }],
  ["Lilac Stroller #148", "sage-nomad", "utilidade", "polygon", "0.18", { trendingScore: 19 }],
  ["Brass Groove #282", "golden-beat", "musica", "ethereum", "0.66", { trendingScore: 47 }],
  ["Ivory Scholar #093", "ivory-baron", "colecionaveis", "solana", "1.52", { isNewRelease: true, trendingScore: 56 }],
  ["Emerald Courier #455", "emerald-ape", "jogos", "polygon", "0.94", { trendingScore: 39 }],
  ["Fern Pilgrim #210", "sage-nomad", "generativa", "solana", "0.61", { trendingScore: 31 }],
  ["Gilded Tempo #338", "golden-beat", "assinaturas", "polygon", "0.33", { trendingScore: 26 }],
  ["Charcoal Envoy #164", "ivory-baron", "fotografia", "ethereum", "2.62", { compareAtPrice: "2.95", trendingScore: 72 }],
  ["Emerald Heir #508", "emerald-ape", "colecionaveis", "solana", "5.75", { badge: "raro", isNewRelease: true, trendingScore: 93 }],
  ["Mist Voyager #076", "sage-nomad", "arte-3d", "ethereum", "1.44", { trendingScore: 44 }],
  ["Solar Cadence #391", "golden-beat", "jogos", "solana", "0.52", { isNewRelease: true, trendingScore: 37 }],
  ["Graphite Count #222", "ivory-baron", "utilidade", "polygon", "0.29", { trendingScore: 15 }],
  ["Jade Wanderer #613", "emerald-ape", "generativa", "ethereum", "2.08", { trendingScore: 68 }],
  ["Orchid Rover #187", "sage-nomad", "assinaturas", "ethereum", "0.42", { trendingScore: 24 }],
  ["Citrine Loop #054", "golden-beat", "arte-digital", "polygon", "0.77", { isNewRelease: true, trendingScore: 53 }],
  ["Slate Duke #429", "ivory-baron", "jogos", "ethereum", "1.21", { trendingScore: 49 }],
  ["Emerald Vanguard #712", "emerald-ape", "utilidade", "ethereum", "0.88", { trendingScore: 35 }],
  ["Thistle Nomad #359", "sage-nomad", "colecionaveis", "polygon", "0.02", { trendingScore: 11 }],
  ["Aurum Ballad #144", "golden-beat", "fotografia", "solana", "1.11", { isNewRelease: true, trendingScore: 46 }],
]

const COLLECTIONS: Record<ArtworkKey, string> = {
  "emerald-ape": "Kurio Apes",
  "sage-nomad": "Nomad Society",
  "ivory-baron": "Baron Circle",
  "golden-beat": "Golden Frequencies",
}

const ATTRIBUTES: Record<ArtworkKey, string[]> = {
  "emerald-ape": ["Óculos", "Esmeralda", "Raro"],
  "sage-nomad": ["Chapéu bucket", "Moletom", "Incomum"],
  "ivory-baron": ["Blazer", "Gola alta", "Épico"],
  "golden-beat": ["Fones", "Jaqueta", "Comum"],
}

function editionsFor(index: number): Edition[] {
  return [
    { id: "1-1", label: "1/1", supply: 1, available: index % 4 === 0 ? 0 : 1 },
    { id: "1-10", label: "1/10", supply: 10, available: 10 - (index % 7) },
    { id: "1-50", label: "1/50", supply: 50, available: 50 - ((index * 3) % 41) },
    { id: "aberta", label: "ABERTA", supply: null, available: 999 },
  ]
}

function tokenIdFrom(name: string) {
  const number = name.split("#")[1] ?? "0"
  return `#${number.padStart(4, "0")}`
}

export const NFT_FIXTURES: Nft[] = SEEDS.map(([name, artwork, category, network, price, extra = {}], index) => {
  const id = name
    .toLowerCase()
    .replace(/#/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const collection = COLLECTIONS[artwork]

  return {
    id,
    tokenId: tokenIdFrom(name),
    name,
    artwork,
    collection,
    category,
    network,
    price,
    compareAtPrice: extra.compareAtPrice,
    badge: extra.badge,
    rating: 4 + ((index * 7) % 10) / 10,
    reviewsCount: 6 + ((index * 13) % 40),
    summary: `Um colecionável digital finalizado à mão da coleção ${collection}, verificado na ${network === "ethereum" ? "Ethereum" : network === "polygon" ? "Polygon" : "Solana"}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${name} é uma obra digital finalizada à mão da coleção ${collection}. Cada atributo fica armazenado nos metadados do token e verificado na rede. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      "A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. O criador recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.",
    ],
    attributes: ATTRIBUTES[artwork],
    contract: `0x7A${(42 + index).toString(16).toUpperCase().padStart(2, "0")}...19E8`,
    editions: editionsFor(index),
    isNewRelease: extra.isNewRelease ?? false,
    trendingScore: extra.trendingScore ?? 0,
    listedAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
    version: 1,
  }
})
