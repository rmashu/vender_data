import { Input } from "@/components/ui/input"

type SearchInputFilterProps = {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

export function SearchInputFilter({
  label,
  onChange,
  placeholder,
  value,
}: SearchInputFilterProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{label}</p>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
