import { z } from "zod"

const required = (label: string) => z.string().trim().min(1, `Informe ${label}.`)

export const checkoutSchema = z.object({
  displayName: required("o nome de exibição").max(60, "Use no máximo 60 caracteres."),
  username: required("o nome de usuário").regex(
    /^[a-z0-9_.]{3,20}$/i,
    "Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado."
  ),
  network: z.enum(["ethereum", "polygon", "solana"], { error: "Selecione uma rede." }),
  profileName: required("o nome do perfil").max(60, "Use no máximo 60 caracteres."),
  walletAddress: required("o endereço da carteira").regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Informe um endereço 0x válido com 40 caracteres hexadecimais."
  ),
  secondaryWallet: z
    .string()
    .trim()
    .refine((value) => value === "" || /^0x[a-fA-F0-9]{40}$/.test(value) || /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i.test(value), {
      message: "Informe um endereço 0x ou um nome ENS (ex.: nova.eth).",
    }),
  walletType: z.enum(["walletconnect", "metamask", "coinbase"], { error: "Selecione o tipo de carteira." }),
  referralCode: required("o código de indicação").regex(/^[A-Z0-9-]{4,16}$/i, "Use de 4 a 16 letras, números ou hífen."),
  email: required("o e-mail").email("Informe um e-mail válido."),
  ensName: required("o nome ENS").regex(/^[a-z0-9-]{3,32}$/i, "Use de 3 a 32 letras, números ou hífen."),
  ensSuffix: z.enum([".eth"]),
  useOtherWallet: z.boolean(),
  note: z.string().trim().max(280, "Use no máximo 280 caracteres."),
  paymentWallet: z.enum(["walletconnect", "metamask", "coinbase"], { error: "Selecione a carteira de pagamento." }),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const CHECKOUT_DEFAULTS: Partial<CheckoutValues> = {
  displayName: "",
  username: "",
  profileName: "",
  walletAddress: "",
  secondaryWallet: "",
  referralCode: "",
  email: "",
  ensName: "",
  ensSuffix: ".eth",
  useOtherWallet: false,
  note: "",
  paymentWallet: "coinbase",
}
