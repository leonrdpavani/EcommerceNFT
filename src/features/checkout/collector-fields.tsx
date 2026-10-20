import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import { cn } from "cn"

import { FormField } from "@/components/form/form-field"
import { FormEnsInput, FormSelect } from "@/components/form/form-select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CheckoutValues } from "@/features/checkout/checkout-schema"
import { NETWORKS, WALLET_OPTIONS } from "@/lib/catalog"

interface CollectorFieldsProps {
  control: Control<CheckoutValues>
  register: UseFormRegister<CheckoutValues>
  errors: FieldErrors<CheckoutValues>
  layout?: "two-columns" | "single"
}

export const NETWORK_OPTIONS = NETWORKS.map((network) => ({ value: network.id, label: network.label }))
export const WALLET_TYPE_OPTIONS = WALLET_OPTIONS.map((wallet) => ({ value: wallet.id, label: wallet.name }))

const GRID_POSITIONS = {
  "1-1": "col-start-1 row-start-1",
  "2-1": "col-start-2 row-start-1",
  "1-2": "col-start-1 row-start-2",
  "2-2": "col-start-2 row-start-2",
  "1-3": "col-start-1 row-start-3",
  "2-3": "col-start-2 row-start-3 self-end",
  "1-4": "col-start-1 row-start-4",
  "2-4": "col-start-2 row-start-4",
  "1-5": "col-start-1 row-start-5",
  "2-5": "col-start-2 row-start-5",
} as const

/** Campos "Perfil do colecionador" do pagamento (Figma: Checkout Page). */
export function CollectorFields({ control, register, errors, layout = "two-columns" }: CollectorFieldsProps) {
  const two = layout === "two-columns"
  const at = (position: keyof typeof GRID_POSITIONS) => (two ? GRID_POSITIONS[position] : undefined)

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("grid gap-x-6 gap-y-3", two && "grid-cols-2")}>
        <FormField label="Nome de exibição" required error={errors.displayName?.message} className={at("1-1")}>
          <Input autoComplete="name" {...register("displayName")} />
        </FormField>
        <FormField label="Nome de usuário" required error={errors.username?.message} className={at("2-1")}>
          <Input autoComplete="username" {...register("username")} />
        </FormField>

        <FormField label="Rede" required error={errors.network?.message} className={at("1-2")}>
          <FormSelect control={control} name="network" placeholder="Selecione uma rede" options={NETWORK_OPTIONS} />
        </FormField>
        <FormField label="Nome do perfil" required error={errors.profileName?.message} className={at("2-2")}>
          <Input {...register("profileName")} />
        </FormField>

        <FormField label="Endereço da carteira" required error={errors.walletAddress?.message} className={at("1-3")}>
          <Input placeholder="Endereço 0x da carteira" spellCheck={false} autoCapitalize="none" {...register("walletAddress")} />
        </FormField>
        <FormField srLabel="ENS ou carteira secundária (opcional)" error={errors.secondaryWallet?.message} className={at("2-3")}>
          <Input
            placeholder="ENS ou carteira secundária (opcional)"
            spellCheck={false}
            autoCapitalize="none"
            {...register("secondaryWallet")}
          />
        </FormField>

        <FormField label="Tipo de carteira" required error={errors.walletType?.message} className={at("1-4")}>
          <FormSelect control={control} name="walletType" placeholder="Selecione uma carteira" options={WALLET_TYPE_OPTIONS} />
        </FormField>
        <FormField label="Código de indicação" required error={errors.referralCode?.message} className={at("2-4")}>
          <Input autoCapitalize="characters" {...register("referralCode")} />
        </FormField>

        <FormField label="E-mail" required error={errors.email?.message} className={at("1-5")}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <FormField label="Nome ENS" required error={errors.ensName?.message} className={at("2-5")}>
          <FormEnsInput control={control} suffixName="ensSuffix" name="ensName" />
        </FormField>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-[15px] text-cream">
        <input type="checkbox" className="round-check" {...register("useOtherWallet")} />
        Usar outra carteira?
      </label>

      <FormField label="Observação do colecionador (opcional)" error={errors.note?.message} className="max-w-[350px] gap-3">
        <Textarea {...register("note")} />
      </FormField>
    </div>
  )
}
