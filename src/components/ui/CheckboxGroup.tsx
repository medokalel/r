import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'

interface CheckboxGroupProps {
  values: string[]
  onChange: (values: string[]) => void
  options: { value: string; label: string }[]
  className?: string
}

export function CheckboxGroup({ values, onChange, options, className }: CheckboxGroupProps) {
  const toggle = (optionValue: string) => {
    onChange(
      values.includes(optionValue)
        ? values.filter((value) => value !== optionValue)
        : [...values, optionValue]
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-10 gap-y-3', className)}>
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-2">
          <input
            type={option.value === 'other' ? 'radio' : 'checkbox'}
            name={option.value === 'other' ? 'otherSystem' : undefined}
            checked={values.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="size-5 accent-primary"
          />
          <span className={cn(fieldTextClassName, 'text-neutral-600')}>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
