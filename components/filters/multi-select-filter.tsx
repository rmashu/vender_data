type MultiSelectFilterProps = {
  label: string
  onChange: (values: string[]) => void
  options: string[]
  values: string[]
}

export function MultiSelectFilter({
  label,
  onChange,
  options,
  values,
}: MultiSelectFilterProps) {
  const uniqueOptions = ["ALL", ...options].filter(
    (option, index, allOptions) => option && allOptions.indexOf(option) === index
  )

  function toggle(option: string) {
    if (option === "ALL") {
      onChange(["ALL"])
      return
    }

    const withoutAll = values.filter((value) => value !== "ALL")
    const nextValues = withoutAll.includes(option)
      ? withoutAll.filter((value) => value !== option)
      : [...withoutAll, option]

    onChange(nextValues.length ? nextValues : ["ALL"])
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid max-h-44 gap-2 overflow-y-auto pr-1">
        {uniqueOptions.map((option) => (
          <label className="flex items-center gap-2 text-sm" key={option}>
            <input
              checked={values.includes(option)}
              onChange={() => toggle(option)}
              type="checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
