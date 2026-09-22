import { Input } from "@/components/ui/input"

type DateRangeFilterProps = {
  from: string
  label: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  to: string
}

export function DateRangeFilter({
  from,
  label,
  onFromChange,
  onToChange,
  to,
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid gap-2">
        <Input
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
        />
        <Input
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
        />
      </div>
    </div>
  )
}
