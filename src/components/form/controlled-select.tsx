import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ControlledSelectProps {
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  options: { value: string; label: string }[]
  id?: string
  className?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-required"?: boolean
}

/** Select do shadcn com a interface de um campo controlado (para usar com FormField/react-hook-form). */
export function ControlledSelect({
  value,
  onChange,
  onBlur,
  placeholder,
  options,
  id,
  className,
  ...aria
}: ControlledSelectProps) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={onChange}
      onOpenChange={(open) => {
        if (!open) onBlur?.()
      }}
    >
      <SelectTrigger id={id} className={className} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
