import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
})

export const passwordRule = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .regex(/[A-Za-z]/, "A senha precisa ter ao menos uma letra.")
  .regex(/\d/, "A senha precisa ter ao menos um número.")

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Informe um nome de usuário.")
      .regex(/^[a-z0-9_.]{3,20}$/i, "Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado."),
    email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
