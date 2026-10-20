import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { cn } from "cn"

import facebookIcon from "@/assets/icons/facebook.svg"
import googleIcon from "@/assets/icons/google.svg"
import { FormField, PasswordInput } from "@/components/form/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, signupSchema, type LoginValues, type SignupValues } from "@/features/auth/auth-schemas"
import { notifyUnavailable } from "@/lib/soon"

export type AuthVariant = "dialog" | "page"

const inputStyles: Record<AuthVariant, string> = {
  dialog: "rounded-sm px-4 text-sm",
  page: "h-[50px] rounded-[10px] px-4 text-sm",
}

const ctaStyles: Record<AuthVariant, string> = {
  dialog: "h-[45px] w-full rounded-sm text-base",
  page: "h-[60px] w-full rounded-[10px] text-base",
}

export function LoginForm({ variant, onSuccess }: { variant: AuthVariant; onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } })

  const onSubmit = handleSubmit(() => {
    // Pré-visualização: na integração, POST /session autentica e retoma o fluxo anterior.
    toast.info("Pré-visualização: a autenticação será conectada à API simulada na próxima etapa.")
    onSuccess()
  })

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col", variant === "dialog" ? "gap-6" : "gap-10")}>
      <div className="flex flex-col gap-3">
        <FormField srLabel="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="contato@email.com" className={inputStyles[variant]} {...register("email")} />
        </FormField>
        <FormField srLabel="Senha" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" placeholder="Senha" className={inputStyles[variant]} {...register("password")} />
        </FormField>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => notifyUnavailable("A recuperação de senha")}
            className="cursor-pointer text-sm leading-4 text-brand-text hover:underline"
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>
      <Button type="submit" className={cn("font-bold", ctaStyles[variant])} aria-busy={isSubmitting}>
        Entrar
      </Button>
    </form>
  )
}

export function SignupForm({ variant, onSuccess }: { variant: AuthVariant; onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  })

  const onSubmit = handleSubmit(() => {
    // Pré-visualização: na integração, POST /accounts cria a conta e trata conflito (409).
    toast.info("Pré-visualização: o cadastro será conectado à API simulada na próxima etapa.")
    onSuccess()
  })

  return (
    <form onSubmit={onSubmit} noValidate className={cn("flex flex-col", variant === "dialog" ? "gap-6" : "gap-10")}>
      <div className="flex flex-col gap-3">
        <FormField srLabel="Nome de usuário" error={errors.username?.message}>
          <Input autoComplete="username" placeholder="Nome de usuário" className={inputStyles[variant]} {...register("username")} />
        </FormField>
        <FormField srLabel="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="Digite seu e-mail" className={inputStyles[variant]} {...register("email")} />
        </FormField>
        <FormField srLabel="Senha" error={errors.password?.message} hint="Mínimo de 8 caracteres, com letras e números.">
          <PasswordInput autoComplete="new-password" placeholder="Senha" className={inputStyles[variant]} {...register("password")} />
        </FormField>
        <FormField srLabel="Confirmar senha" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" placeholder="Confirmar senha" className={inputStyles[variant]} {...register("confirmPassword")} />
        </FormField>
      </div>
      <Button type="submit" className={cn("font-bold", ctaStyles[variant])} aria-busy={isSubmitting}>
        {variant === "dialog" ? "Criar conta" : "Criar perfil"}
      </Button>
    </form>
  )
}

export function SocialSignIn({ variant }: { variant: AuthVariant }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3" role="separator" aria-label="Ou continue com">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="text-[13px] leading-4 text-cream" aria-hidden="true">
          Ou continue com
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <div className={cn("flex flex-col", variant === "dialog" ? "gap-3 px-20 max-sm:px-0" : "gap-4")}>
        <SocialButton icon={googleIcon} provider="Google" />
        <SocialButton icon={facebookIcon} provider="Facebook" />
      </div>
    </div>
  )
}

function SocialButton({ icon, provider }: { icon: string; provider: string }) {
  return (
    <button
      type="button"
      onClick={() => notifyUnavailable(`O login com ${provider}`)}
      className="flex h-10 w-full cursor-pointer items-center justify-center gap-3 rounded-sm border border-line text-[13px] leading-4 font-medium text-sand transition-colors hover:border-line-soft hover:bg-surface-raised"
    >
      <img src={icon} alt="" width={20} height={20} className="size-5" />
      Continuar com {provider}
    </button>
  )
}

export function AuthSwitchLink({ mode, redirect }: { mode: "login" | "signup"; redirect?: string }) {
  return mode === "login" ? (
    <p className="text-center text-[15px] text-sand">
      Novo na Kurio?{" "}
      <Link to="/cadastro" search={{ redirect }} className="text-sand underline-offset-4 hover:text-brand-text hover:underline">
        Crie uma conta
      </Link>
    </p>
  ) : (
    <p className="text-center text-[15px] text-sand">
      Já tem uma conta?{" "}
      <Link to="/entrar" search={{ redirect }} className="text-sand underline-offset-4 hover:text-brand-text hover:underline">
        Entre
      </Link>
    </p>
  )
}
