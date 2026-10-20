import { ControlledSelect } from "@/components/form/controlled-select"
import { Input } from "@/components/ui/input"

interface EnsInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  suffix: string
  onSuffixChange: (value: string) => void
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

/** Campo "Nome ENS": seletor de sufixo (.eth) + nome (Figma: ENS Input). */
export function EnsInput({ suffix, onSuffixChange, className, ...inputProps }: EnsInputProps) {
  return (
    <div className="flex gap-2.5">
      <ControlledSelect
        value={suffix}
        onChange={onSuffixChange}
        options={[{ value: ".eth", label: ".eth" }]}
        className="w-[86px] shrink-0"
        aria-label="Sufixo ENS"
      />
      <Input placeholder="seunome" spellCheck={false} autoCapitalize="none" className={className} {...inputProps} />
    </div>
  )
}
