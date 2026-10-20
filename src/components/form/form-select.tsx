import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { ControlledSelect } from "@/components/form/controlled-select"
import { EnsInput } from "@/components/form/ens-input"

type AriaProps = {
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-required"?: boolean
}

interface FormSelectProps<T extends FieldValues> extends AriaProps {
  control: Control<T>
  name: FieldPath<T>
  placeholder?: string
  options: { value: string; label: string }[]
}

/** Select ligado ao react-hook-form. Recebe id/aria do FormField para manter label e erro associados. */
export function FormSelect<T extends FieldValues>({ control, name, placeholder, options, ...aria }: FormSelectProps<T>) {
  const { field } = useController({ control, name })
  return (
    <ControlledSelect
      value={field.value as string | undefined}
      onChange={field.onChange}
      onBlur={field.onBlur}
      placeholder={placeholder}
      options={options}
      {...aria}
    />
  )
}

interface FormEnsInputProps<T extends FieldValues> extends AriaProps {
  control: Control<T>
  suffixName: FieldPath<T>
  name: FieldPath<T>
}

export function FormEnsInput<T extends FieldValues>({ control, suffixName, name, ...aria }: FormEnsInputProps<T>) {
  const { field: suffix } = useController({ control, name: suffixName })
  const { field } = useController({ control, name })
  return (
    <EnsInput
      suffix={suffix.value as string}
      onSuffixChange={suffix.onChange}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      {...aria}
    />
  )
}
