import { cn } from '@/lib/utils'

export interface TableFilterOption {
  value: string
  label: string
}

interface TableFilterSelectProps {
  label: string
  value: string
  options: TableFilterOption[]
  onChange: (value: string) => void
  className?: string
}

export function TableFilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: TableFilterSelectProps) {
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2.5 text-[14px] text-neutral-700 outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
