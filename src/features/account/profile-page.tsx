import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormField, PasswordInput } from "@/components/form/form-field"
import { FormEnsInput } from "@/components/form/form-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { profileSchema, type ProfileValues } from "@/features/account/account-schemas"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export function ProfilePage() {
  usePageTitle("Perfil do colecionador")
  const isDesktop = useIsDesktop()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      ensSuffix: ".eth",
      ensName: "",
      walletNickname: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = handleSubmit(
    () => toast.info("Pré-visualização: o perfil será salvo via API na próxima etapa."),
    () => toast.error("Revise os campos destacados.")
  )

  const fieldWidth = isDesktop ? "w-full max-w-[417px]" : "w-full"

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8 pb-10" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-base leading-4 font-bold text-cream max-lg:sr-only">
        Perfil do colecionador
      </h1>

      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        <FormField label="Nome de exibição" required error={errors.displayName?.message}>
          <Input autoComplete="name" {...register("displayName")} />
        </FormField>
        <FormField label="Nome de usuário" required error={errors.username?.message}>
          <Input autoComplete="username" {...register("username")} />
        </FormField>
        <FormField label="E-mail" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField label="Nome ENS" required error={errors.ensName?.message}>
          <FormEnsInput control={control} suffixName="ensSuffix" name="ensName" />
        </FormField>
        <FormField label="Apelido da carteira" required error={errors.walletNickname?.message}>
          <Input {...register("walletNickname")} />
        </FormField>
        <AvatarField />
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-base leading-4 font-medium text-cream">Alterar senha</legend>
        <FormField label="Senha atual" error={errors.currentPassword?.message} className={`gap-3 ${fieldWidth}`}>
          <PasswordInput autoComplete="current-password" {...register("currentPassword")} />
        </FormField>
        <FormField
          label="Nova senha"
          error={errors.newPassword?.message}
          hint="Mínimo de 8 caracteres, com letras e números."
          className={`gap-3 ${fieldWidth}`}
        >
          <PasswordInput autoComplete="new-password" {...register("newPassword")} />
        </FormField>
        <FormField label="Confirmar nova senha" error={errors.confirmPassword?.message} className={`gap-3 ${fieldWidth}`}>
          <PasswordInput autoComplete="new-password" {...register("confirmPassword")} />
        </FormField>
      </fieldset>

      <Button type="submit" className="w-full rounded-xs font-bold sm:w-[131px]" aria-busy={isSubmitting}>
        Salvar
      </Button>
    </form>
  )
}

function AvatarField() {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Envie uma imagem PNG, JPG ou WebP.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("A imagem deve ter no máximo 2 MB.")
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span id={`${inputId}-label`} className="text-[15px] leading-[15px] text-cream">
        Avatar
      </span>
      <div className="flex items-center gap-6">
        <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-brand-text">
          {preview ? (
            <img src={preview} alt="Pré-visualização do avatar" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6" aria-hidden="true" />
          )}
        </div>
        <div className="flex items-center gap-5">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleFile}
            aria-labelledby={`${inputId}-label`}
            aria-describedby={error ? errorId : undefined}
          />
          <Button
            className="h-10 w-[98px] rounded-xs font-bold"
            onClick={() => fileRef.current?.click()}
            aria-describedby={error ? errorId : undefined}
          >
            Alterar
          </Button>
          <Button variant="ghost" className="h-10 px-2 text-sm font-normal" onClick={() => setPreview(null)} disabled={!preview}>
            Remover
          </Button>
        </div>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] text-coral">
          {error}
        </p>
      ) : null}
    </div>
  )
}
