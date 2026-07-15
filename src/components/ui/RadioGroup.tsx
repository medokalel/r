import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'

interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function RadioGroup({ name, value, onChange, options, className }: RadioGroupProps) {
  // Two choices always fit on one row; only larger groups stack on small screens
  const inline = options.length <= 2
  return (
    <div
      className={cn(
        'flex',
        inline
          ? 'flex-row flex-wrap items-center gap-x-8 gap-y-2'
          : 'flex-col gap-2 2xl:flex-row 2xl:flex-wrap 2xl:items-center 2xl:gap-8',
        className
      )}
    >
      {options.map((opt) => (
        <label key={opt.value} className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="size-5 accent-primary"
          />
          <span
            className={cn(
              fieldTextClassName,
              value === opt.value ? 'font-normal text-neutral-900' : 'font-normal text-neutral-600'
            )}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}
