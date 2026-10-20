import { z } from "zod"

import { passwordRule } from "@/features/auth/auth-schemas"

const required = (label: string) => z.string().trim().min(1, `Informe ${label}.`)
const ensName = required("o nome ENS").regex(/^[a-z0-9-]{3,32}$/i, "Use de 3 a 32 letras, números ou hífen.")

export const profileSchema = z
  .object({
    displayName: required("o nome de exibição").max(60, "Use no máximo 60 caracteres."),
    username: required("o nome de usuário").regex(
      /^[a-z0-9_.]{3,20}$/i,
      "Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado."
    ),
    email: required("o e-mail").email("Informe um e-mail válido."),
    ensSuffix: z.enum([".eth"]),
    ensName,
    walletNickname: required("o apelido da carteira").max(40, "Use no máximo 40 caracteres."),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, ctx) => {
    const changing = Boolean(values.currentPassword || values.newPassword || values.confirmPassword)
    if (!changing) return
    if (!values.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["currentPassword"], message: "Informe a senha atual." })
    }
    const strength = passwordRule.safeParse(values.newPassword)
    if (!strength.success) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: strength.error.issues[0].message })
    } else if (values.newPassword === values.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "A nova senha deve ser diferente da atual." })
    }
    if (values.confirmPassword !== values.newPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "As senhas não coincidem." })
    }
  })

export type ProfileValues = z.infer<typeof profileSchema>

export const walletSchema = z.object({
  displayName: required("o nome de exibição").max(60, "Use no máximo 60 caracteres."),
  walletNickname: required("o apelido da carteira").max(40, "Use no máximo 40 caracteres."),
  network: z.enum(["ethereum", "polygon", "solana"], { error: "Selecione uma rede." }),
  profileName: required("o nome do perfil"),
  address: required("o endereço da carteira").regex(/^0x[a-fA-F0-9]{40}$/, "Informe um endereço 0x válido com 40 caracteres hexadecimais."),
  secondaryAddress: z
    .string()
    .trim()
    .refine((value) => value === "" || /^0x[a-fA-F0-9]{40}$/.test(value) || /^[a-z0-9-]+\.eth$/i.test(value), {
      message: "Informe um endereço 0x ou um nome ENS (ex.: nova.eth).",
    }),
  walletType: z.enum(["walletconnect", "metamask", "coinbase"], { error: "Selecione o tipo de carteira." }),
  referralCode: required("o código de indicação").regex(/^[A-Z0-9-]{4,16}$/i, "Use de 4 a 16 letras, números ou hífen."),
  email: required("o e-mail").email("Informe um e-mail válido."),
  ensSuffix: z.enum([".eth"]),
  ensName,
})

export type WalletValues = z.infer<typeof walletSchema>
