import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Select from '@radix-ui/react-select'
import { useEffect, useState } from 'react'
import { SelectDropdownIcon } from '@/components/auth/SelectDropdownIcon'
import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

export const fieldTextClassName = 'field-text text-[16px] leading-[1.6]'
export const fieldBodyTextClassName = 'text-body-compact leading-[1.6]'
export const fieldTitleClassName = 'field-card-title'
export const fieldLabelClassName = 'field-label text-neutral-900'
export const questionLabelClassName = fieldLabelClassName
export const fieldInputClassName = cn(
  fieldTextClassName,
  'w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 font-light text-neutral-900',
  'placeholder:text-[16px] placeholder:font-light placeholder:leading-[1.6] placeholder:text-neutral-500',
  'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
)
export const fieldTextareaClassName = cn(fieldInputClassName, 'min-h-[134px] resize-none py-2.5')
export const formSectionClassName =
  'space-y-5 rounded-[var(--radius-md)] border border-[#ececec] bg-[rgba(102,102,102,0.04)] p-5'
export const fieldHeightClassName = 'h-12'
export const fieldActionButtonClassName =
  'min-w-[200px] rounded-[var(--radius-sm)] disabled:opacity-50'
export const fieldStandardTabClassName =
  'field-standard-tab rounded-[var(--radius-sm)] px-4 py-2 transition-colors'
export const fieldStandardTabActiveClassName = 'bg-white text-primary shadow-sm'
export const fieldStandardTabInactiveClassName = 'text-neutral-600'

interface FormLabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}

export function FormLabel({ htmlFor, children, required }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className={fieldLabelClassName}>
      {children}
      {required && <span className="text-error-500"> *</span>}
    </label>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'question'
}

export function FormField({
  label,
  required,
  children,
  className,
  variant = 'default',
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {variant === 'question' ? (
        <p className={questionLabelClassName}>
          {label}
          {required && <span className="text-error-500"> *</span>}
        </p>
      ) : (
        <FormLabel required={required}>{label}</FormLabel>
      )}
      {children}
    </div>
  )
}

interface FormSectionProps {
  children: React.ReactNode
  className?: string
}

export function FormSection({ children, className }: FormSectionProps) {
  return <div className={cn(formSectionClassName, className)}>{children}</div>
}

interface SelectFieldProps {
  value: string
  onChange?: (value: string) => void
  options?: string[]
  className?: string
}

export function SelectField({ value, onChange, options, className }: SelectFieldProps) {
  const items = options ?? [value]
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  return (
    <Select.Root
      value={internalValue}
      onValueChange={(next) => {
        setInternalValue(next)
        onChange?.(next)
      }}
    >
      <Select.Trigger
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 font-light text-start rtl:flex-row-reverse',
          className
        )}
      >
        <Select.Value />
        <Select.Icon asChild>
          <SelectDropdownIcon className="shrink-0 text-neutral-900" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="z-50 max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {items.map((opt) => (
              <Select.Item
                key={opt}
                value={opt}
                className={cn(
                  fieldTextClassName,
                  'relative flex cursor-pointer select-none items-center rounded-[var(--radius-xs)] px-3 py-2 font-light text-neutral-900 outline-none',
                  'data-[highlighted]:bg-neutral-50 data-[state=checked]:bg-primary-subtle'
                )}
              >
                <Select.ItemText>{opt}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

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

interface TagInputProps {
  tags: string[]
  options: string[]
  onChange: (tags: string[]) => void
  className?: string
}

interface RatingScaleProps {
  value: number | null
  onChange: (value: number) => void
  className?: string
}

export function RatingScale({ value, onChange, className }: RatingScaleProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length: 10 }, (_, index) => {
        const rating = index + 1
        const selected = value === rating
        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-[var(--radius-sm)] border text-center text-body-2 font-medium transition-colors',
              selected
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:bg-primary-subtle hover:text-primary'
            )}
          >
            <WesternDigits>{rating}</WesternDigits>
          </button>
        )
      })}
    </div>
  )
}

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

export function TagInput({ tags, options, onChange, className }: TagInputProps) {
  const toggleTag = (option: string) => {
    onChange(
      tags.includes(option) ? tags.filter((tag) => tag !== option) : [...tags, option]
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 py-2 text-start',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500',
            className
          )}
        >
          <div className="flex flex-1 flex-wrap gap-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[#f3f6fd] px-2.5 py-1.5',
                  fieldTextClassName,
                  'text-neutral-600'
                )}
              >
                <WesternDigits>{tag}</WesternDigits>
                <span
                  role="button"
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(tags.filter((item) => item !== tag))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      onChange(tags.filter((item) => item !== tag))
                    }
                  }}
                  className="flex size-4 cursor-pointer items-center justify-center rounded-full bg-error-50 text-base font-bold leading-none text-error-500 hover:bg-error-100 hover:text-error-700"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </span>
              </span>
            ))}
          </div>
          <SelectDropdownIcon className="shrink-0 text-neutral-900" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-[var(--radius-sm)] border border-neutral-200 bg-white p-1 shadow-lg"
          sideOffset={4}
          align="start"
        >
          {options.map((option) => {
            const selected = tags.includes(option)

            return (
              <DropdownMenu.Item
                key={option}
                onSelect={(event) => {
                  event.preventDefault()
                  toggleTag(option)
                }}
                className={cn(
                  fieldTextClassName,
                  'flex cursor-pointer select-none items-center gap-3 rounded-[var(--radius-xs)] px-3 py-2 text-neutral-900 outline-none',
                  'data-[highlighted]:bg-neutral-50',
                  selected && 'bg-primary-subtle'
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none',
                    selected ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white'
                  )}
                  aria-hidden
                >
                  {selected ? '✓' : ''}
                </span>
                <WesternDigits>{option}</WesternDigits>
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
