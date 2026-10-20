import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon } from "lucide-react"
import { useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { User } from "@/api/contracts"
import { isApiError } from "@/api/http"
import { QueryError } from "@/components/feedback/query-error"
import { FormAlert } from "@/components/form/form-alert"
import { FormField, PasswordInput } from "@/components/form/form-field"
import { FormEnsInput } from "@/components/form/form-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { profileSchema, type ProfileValues } from "@/features/account/account-schemas"
import { useChangePassword, useProfile, useUpdateAvatar, useUpdateProfile } from "@/features/account/use-account"
import { useIsDesktop } from "@/hooks/use-media-query"
import { usePageTitle } from "@/hooks/use-page-title"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const PROFILE_FIELDS = ["displayName", "username", "email", "ensName", "walletNickname"] as const

function toValues(user: User): ProfileValues {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensSuffix: ".eth",
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }
}

export function ProfilePage({ userId }: { userId: string }) {
  usePageTitle("Perfil do colecionador")
  const profile = useProfile(userId)

  if (profile.isPending) return <ProfileSkeleton />
  if (profile.isError) return <QueryError message={profile.error.message} onRetry={() => void profile.refetch()} />
  return <ProfileForm user={profile.data} />
}

function ProfileForm({ user }: { user: User }) {
  const isDesktop = useIsDesktop()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), mode: "onTouched", defaultValues: toValues(user) })

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        const updated = await updateProfile.mutateAsync({
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName: values.ensName,
          walletNickname: values.walletNickname,
        })
        if (values.newPassword) {
          await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
        }
        reset(toValues(updated))
        toast.success(values.newPassword ? "Perfil e senha atualizados." : "Perfil atualizado.")
      } catch (error) {
        if (isApiError(error) && error.fields) {
          for (const [field, message] of Object.entries(error.fields)) {
            if ((PROFILE_FIELDS as readonly string[]).includes(field) || field === "currentPassword" || field === "newPassword") {
              setError(field as keyof ProfileValues, { message }, { shouldFocus: true })
            }
          }
        } else {
          setFormError(isApiError(error) ? error.message : "Não foi possível salvar o perfil.")
        }
      }
    },
    () => toast.error("Revise os campos destacados.")
  )

  const saving = updateProfile.isPending || changePassword.isPending
  const fieldWidth = isDesktop ? "w-full max-w-[417px]" : "w-full"

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8 pb-10" aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-base leading-4 font-bold text-cream max-lg:sr-only">
        Perfil do colecionador
      </h1>
      <FormAlert message={formError} />

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
        <AvatarField user={user} />
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-base leading-4 font-medium text-cream">Alterar senha</legend>
        <FormField label="Senha atual" error={errors.currentPassword?.message} className={`gap-3 ${fieldWidth}`}>
          <PasswordInput autoComplete="current-password" {...register("currentPassword")} />
        </FormField>
        <FormField label="Nova senha" error={errors.newPassword?.message} hint="Mínimo de 8 caracteres, com letras e números." className={`gap-3 ${fieldWidth}`}>
          <PasswordInput autoComplete="new-password" {...register("newPassword")} />
        </FormField>
        <FormField label="Confirmar nova senha" error={errors.confirmPassword?.message} className={`gap-3 ${fieldWidth}`}>
          <PasswordInput autoComplete="new-password" {...register("confirmPassword")} />
        </FormField>
      </fieldset>

      <Button type="submit" className="w-full rounded-xs font-bold sm:w-[131px]" disabled={saving} aria-busy={saving}>
        {saving ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  )
}

function AvatarField({ user }: { user: User }) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const fileRef = useRef<HTMLInputElement>(null)
  const updateAvatar = useUpdateAvatar()
  const [localError, setError] = useState<string | null>(null)
  const apiError = updateAvatar.error ? (isApiError(updateAvatar.error) ? updateAvatar.error.message : "Não foi possível atualizar o avatar.") : null
  const error = localError ?? apiError

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
    const reader = new FileReader()
    reader.onload = () => updateAvatar.mutate(reader.result as string, { onSuccess: () => toast.success("Avatar atualizado.") })
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span id={`${inputId}-label`} className="text-[15px] leading-[15px] text-cream">
        Avatar
      </span>
      <div className="flex items-center gap-6">
        <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-brand-text">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={`Avatar de ${user.displayName}`} className="size-full object-cover" /> : <ImageIcon className="size-6" aria-hidden="true" />}
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
            disabled={updateAvatar.isPending}
            aria-busy={updateAvatar.isPending}
            aria-describedby={error ? errorId : undefined}
          >
            Alterar
          </Button>
          <Button
            variant="ghost"
            className="h-10 px-2 text-sm font-normal"
            onClick={() => updateAvatar.mutate(null, { onSuccess: () => toast.success("Avatar removido.") })}
            disabled={!user.avatarUrl || updateAvatar.isPending}
          >
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

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando perfil">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
