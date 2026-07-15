import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { WesternDigits } from '@/components/WesternDigits'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  /** Currently selected values, rendered as removable tags in the trigger. */
  tags: string[]
  options: string[]
  onChange: (tags: string[]) => void
  className?: string
}

/**
 * Multi-select dropdown: shows chosen values as removable chips in the trigger
 * and a checkbox-style checklist in the popover.
 */
export function MultiSelect({ tags, options, onChange, className }: MultiSelectProps) {
  const { dir } = useDirection()
  const toggleTag = (option: string) => {
    onChange(
      tags.includes(option) ? tags.filter((tag) => tag !== option) : [...tags, option]
    )
  }

  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 py-2 text-start',
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
