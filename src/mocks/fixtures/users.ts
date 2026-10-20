import type { Wallet } from "@/api/contracts"

/** Credenciais fictícias documentadas no README. As senhas só existem aqui para gerar o hash do seed. */
export const SEED_PASSWORD = "Kurio2026"

export const USER_FIXTURES = [
  {
    id: "usr_ana",
    email: "ana@kurio.dev",
    username: "ana.coleciona",
    displayName: "Ana Colecionadora",
    ensName: "ana",
    walletNickname: "Cofre da Ana",
    avatarUrl: null,
    favorites: ["emerald-ape-042", "golden-beat-207"],
    wallets: [
      {
        slot: "primary",
        displayName: "Ana Colecionadora",
        walletNickname: "Principal",
        network: "ethereum",
        profileName: "ana.coleciona",
        address: "0xA91F3c5D7e21B4a09f8E3d6C2b17E5a4F0c9E82C",
        secondaryAddress: "nova.kurio.eth",
        walletType: "metamask",
        referralCode: "KURIO-ANA",
        email: "ana@kurio.dev",
        ensName: "ana",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
    ] satisfies Wallet[],
  },
  {
    id: "usr_bruno",
    email: "bruno@kurio.dev",
    username: "bruno.cria",
    displayName: "Bruno Criador",
    ensName: "bruno",
    walletNickname: "Ateliê",
    avatarUrl: null,
    favorites: [] as string[],
    wallets: [] as Wallet[],
  },
] as const

export const COUPON_FIXTURES: Record<
  string,
  { description: string; kind: "percent" | "fixed"; value: string; expiresAt: string; minSubtotal?: string }
> = {
  KURIO10: { description: "10% de desconto no lançamento", kind: "percent", value: "10", expiresAt: "2099-12-31T23:59:59.000Z" },
  GENESIS: {
    description: "0.5 ETH de desconto em pedidos acima de 2 ETH",
    kind: "fixed",
    value: "0.5",
    expiresAt: "2099-12-31T23:59:59.000Z",
    minSubtotal: "2",
  },
  VERAO2025: { description: "Campanha de verão 2025", kind: "percent", value: "15", expiresAt: "2025-03-20T23:59:59.000Z" },
}

export const NETWORK_FEE = "0.016"
