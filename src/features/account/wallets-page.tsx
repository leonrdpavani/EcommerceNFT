import { zodResolver } from "@hookform/resolvers/zod"
import { useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { Wallet, WalletSlot } from "@/api/contracts"
import { isApiError } from "@/api/http"
import { QueryError } from "@/components/feedback/query-error"
import { FormAlert } from "@/components/form/form-alert"
import { FormField } from "@/components/form/form-field"
import { FormEnsInput, FormSelect } from "@/components/form/form-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { walletSchema, type WalletValues } from "@/features/account/account-schemas"
import { useSaveWallet, useWallets } from "@/features/account/use-account"
import { NETWORK_OPTIONS, WALLET_TYPE_OPTIONS } from "@/features/checkout/collector-fields"
import { usePageTitle } from "@/hooks/use-page-title"

const EMPTY_WALLET: Partial<WalletValues> = {
  displayName: "",
  walletNickname: "",
  profileName: "",
  address: "",
  secondaryAddress: "",
  referralCode: "",
  email: "",
  ensSuffix: ".eth",
  ensName: "",
}

function toValues(wallet?: Wallet): Partial<WalletValues> {
  if (!wallet) return EMPTY_WALLET
  const { slot: _slot, updatedAt: _updatedAt, ...rest } = wallet
  return { ...rest, ensSuffix: ".eth" }
}

export function WalletsPage({ userId }: { userId: string }) {
  usePageTitle("Carteiras")
  const wallets = useWallets(userId)
  const formRef = useRef<HTMLFormElement>(null)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const sameId = useId()

  if (wallets.isPending) return <WalletsSkeleton />
  if (wallets.isError) return <QueryError message={wallets.error.message} onRetry={() => void wallets.refetch()} />

  const primary = wallets.data.items.find((wallet) => wallet.slot === "primary")
  const secondary = wallets.data.items.find((wallet) => wallet.slot === "secondary")
  const showSecondaryForm = secondaryOpen || Boolean(secondary)

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section aria-labelledby="primary-wallet-title" className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4 leading-4">
            <h1 id="primary-wallet-title" className="text-[17px] font-bold text-cream">
              Carteira principal
            </h1>
            <button
              type="button"
              className="cursor-pointer text-base font-medium text-brand-text hover:underline"
              onClick={() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus()}
            >
              {primary ? "Editar" : "Adicionar"}
            </button>
          </div>
          <p className="text-sm leading-[18px] text-sand">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </header>
        <WalletForm key={primary?.updatedAt ?? "new-primary"} userId={userId} slot="primary" wallet={primary} formRef={formRef} submitLabel="Salvar carteira" />
      </section>

      <section aria-labelledby="secondary-wallet-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 id="secondary-wallet-title" className="text-[17px] leading-4 font-bold text-cream">
            Carteira secundária
          </h2>
          <div className="flex items-center gap-4">
            <label htmlFor={sameId} className="flex cursor-pointer items-center gap-2 text-sm leading-4 text-cream">
              <input
                id={sameId}
                type="checkbox"
                className="round-check"
                checked={sameAsPrimary}
                disabled={!primary || Boolean(secondary)}
                onChange={(event) => {
                  setSameAsPrimary(event.target.checked)
                  if (event.target.checked) setSecondaryOpen(false)
                }}
              />
              Igual à carteira principal
            </label>
            <button
              type="button"
              className="cursor-pointer text-base leading-4 font-medium text-brand-text hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setSecondaryOpen(true)}
              disabled={sameAsPrimary || showSecondaryForm}
              aria-expanded={showSecondaryForm}
            >
              Adicionar
            </button>
          </div>
        </div>
        {showSecondaryForm ? (
          <WalletForm
            key={secondary?.updatedAt ?? "new-secondary"}
            userId={userId}
            slot="secondary"
            wallet={secondary}
            submitLabel="Salvar carteira secundária"
            onCancel={secondary ? undefined : () => setSecondaryOpen(false)}
          />
        ) : (
          <p className="text-sm leading-[15px] text-sand">
            {sameAsPrimary ? "A carteira principal também será usada como secundária." : "Você ainda não adicionou uma carteira secundária."}
          </p>
        )}
      </section>
    </div>
  )
}

function WalletForm({
  userId,
  slot,
  wallet,
  submitLabel,
  formRef,
  onCancel,
}: {
  userId: string
  slot: WalletSlot
  wallet?: Wallet
  submitLabel: string
  formRef?: React.Ref<HTMLFormElement>
  onCancel?: () => void
}) {
  const save = useSaveWallet(userId)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WalletValues>({ resolver: zodResolver(walletSchema), defaultValues: toValues(wallet), mode: "onTouched" })

  const onSubmit = handleSubmit(
    ({ ensSuffix: _suffix, ...body }) =>
      save.mutate(
        { slot, body },
        {
          onSuccess: () => toast.success(slot === "primary" ? "Carteira principal salva." : "Carteira secundária salva."),
          onError: (error) => {
            if (isApiError(error) && error.fields) {
              for (const [field, message] of Object.entries(error.fields)) setError(field as keyof WalletValues, { message })
            }
          },
        }
      ),
    () => toast.error("Revise os campos destacados.")
  )

  const generalError = save.error && isApiError(save.error) && !save.error.fields ? save.error.message : null

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <FormAlert message={generalError} />
      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        <FormField label="Nome de exibição" required error={errors.displayName?.message} className="gap-1">
          <Input {...register("displayName")} />
        </FormField>
        <FormField label="Apelido da carteira" required error={errors.walletNickname?.message} className="gap-1">
          <Input {...register("walletNickname")} />
        </FormField>
        <FormField label="Rede" required error={errors.network?.message} className="gap-1">
          <FormSelect control={control} name="network" placeholder="Selecione uma rede" options={NETWORK_OPTIONS} />
        </FormField>
        <FormField label="Nome do perfil" required error={errors.profileName?.message} className="gap-1">
          <Input {...register("profileName")} />
        </FormField>
        <FormField label="Endereço da carteira" required error={errors.address?.message} className="gap-1">
          <Input placeholder="Endereço 0x da carteira" spellCheck={false} autoCapitalize="none" {...register("address")} />
        </FormField>
        <FormField srLabel="ENS ou carteira secundária (opcional)" error={errors.secondaryAddress?.message} className="lg:self-end">
          <Input placeholder="ENS ou carteira secundária (opcional)" spellCheck={false} autoCapitalize="none" {...register("secondaryAddress")} />
        </FormField>
        <FormField label="Tipo de carteira" required error={errors.walletType?.message} className="gap-1">
          <FormSelect control={control} name="walletType" placeholder="Selecione uma carteira" options={WALLET_TYPE_OPTIONS} />
        </FormField>
        <FormField label="Código de indicação" required error={errors.referralCode?.message} className="gap-1">
          <Input autoCapitalize="characters" {...register("referralCode")} />
        </FormField>
        <FormField label="E-mail" required error={errors.email?.message} className="gap-1">
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField label="Nome ENS" required error={errors.ensName?.message} className="gap-1">
          <FormEnsInput control={control} suffixName="ensSuffix" name="ensName" />
        </FormField>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" className="h-10 w-full rounded-xs px-2 font-bold sm:w-auto sm:min-w-[131px]" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending ? "Salvando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function WalletsSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Carregando carteiras">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
