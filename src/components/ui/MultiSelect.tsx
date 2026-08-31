import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CloseCircle } from 'iconsax-reactjs'
import { SelectDropdownIcon } from '@/components/ui/SelectDropdownIcon'
import { fieldTextClassName } from '@/components/ui/fieldStyles'
import { WesternDigits } from '@/components/WesternDigits'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

/** Options may be plain strings (value === label) or explicit value/label pairs. */
type MultiSelectOption = string | { value: string; label: string }

function normalizeOption(option: MultiSelectOption) {
  return typeof option === 'string' ? { value: option, label: option } : option
}

interface MultiSelectProps {
  /** Currently selected values, rendered as removable tags in the trigger. */
  tags: string[]
  options: MultiSelectOption[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  /**
   * 'wrapped' (default): compact pills that wrap inline, e.g. Accreditation
   * Body Name. 'stacked': each selection takes its own full-width row, e.g.
   * the CAB Type accreditation-scopes picker.
   */
  layout?: 'wrapped' | 'stacked'
  /** Adds a filter input above the option list, for long option lists. */
  searchable?: boolean
  searchPlaceholder?: string
  /** Shows selected values without opening the dropdown or allowing edits. */
  readOnly?: boolean
}

/**
 * Multi-select dropdown: shows chosen values as removable chips in the trigger
 * and a checkbox-style checklist in the popover.
 */
export function MultiSelect({
  tags,
  options,
  onChange,
  placeholder,
  className,
  layout = 'wrapped',
  searchable = false,
  searchPlaceholder,
  readOnly = false,
}: MultiSelectProps) {
  const { dir } = useDirection()
  const [query, setQuery] = useState('')
  const allItems = options.map(normalizeOption)
  const items = searchable
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
    : allItems
  const labelFor = (value: string) => allItems.find((option) => option.value === value)?.label ?? value
  const toggleTag = (value: string) =>
    onChange(tags.includes(value) ? tags.filter((tag) => tag !== value) : [...tags, value])
  const stacked = layout === 'stacked'

  if (readOnly) {
    return (
      <div
        className={cn(
          'relative flex w-full items-center rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-50 ps-3 text-start',
          stacked ? 'min-h-12 flex-col gap-2 py-2.5 pe-3' : 'min-h-12 gap-3 py-2 pe-3',
          className
        )}
      >
        {stacked ? (
          tags.length === 0 ? (
            placeholder && (
              <span className="text-[16px] font-light leading-[1.6] text-neutral-500">{placeholder}</span>
            )
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'flex w-full items-center rounded-[var(--radius-sm)] bg-primary-subtle px-3 py-2.5',
                  fieldTextClassName,
                  'text-neutral-700'
                )}
              >
                <WesternDigits>{labelFor(tag)}</WesternDigits>
              </span>
            ))
          )
        ) : (
          <div className="flex flex-1 flex-wrap gap-3">
            {tags.length === 0 && placeholder && (
              <span className="text-[16px] font-light leading-[1.6] text-neutral-500">{placeholder}</span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center rounded-[var(--radius-sm)] bg-[#f3f6fd] px-2.5 py-1.5',
                  fieldTextClassName,
                  'text-neutral-600'
                )}
              >
                <WesternDigits>{labelFor(tag)}</WesternDigits>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            // Stable hook so a surrounding theme (e.g. the CAB setup wizard) can restyle the trigger.
            'multiselect-trigger',
            'relative flex w-full items-center rounded-[var(--radius-sm)] border border-neutral-200 bg-white ps-3 text-start',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500',
            stacked ? 'min-h-12 flex-col gap-2 py-2.5 pe-8' : 'min-h-12 gap-3 py-2 pe-3',
            className
          )}
        >
          {stacked ? (
            tags.length === 0 ? (
              <span className="flex w-full items-center justify-between">
                {placeholder && (
                  <span className="text-[16px] font-light leading-[1.6] text-neutral-500">
                    {placeholder}
                  </span>
                )}
                <SelectDropdownIcon className="shrink-0 text-neutral-900" />
              </span>
            ) : (
              <>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-primary-subtle px-3 py-2.5',
                      fieldTextClassName,
                      'text-neutral-700'
                    )}
                  >
                    <WesternDigits>{labelFor(tag)}</WesternDigits>
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
                      className="flex shrink-0 cursor-pointer items-center justify-center text-primary"
                      aria-label={`Remove ${labelFor(tag)}`}
                    >
                      <CloseCircle size={20} variant="Linear" />
                    </span>
                  </span>
                ))}
                <SelectDropdownIcon className="absolute end-3 top-3 shrink-0 text-neutral-900" />
              </>
            )
          ) : (
            <>
              <div className="flex flex-1 flex-wrap gap-3">
                {tags.length === 0 && placeholder && (
                  <span className="text-[16px] font-light leading-[1.6] text-neutral-500">{placeholder}</span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[#f3f6fd] px-2.5 py-1.5',
                      fieldTextClassName,
                      'text-neutral-600'
                    )}
                  >
                    <WesternDigits>{labelFor(tag)}</WesternDigits>
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
                      className="flex shrink-0 cursor-pointer items-center justify-center text-primary"
                    aria-label={`Remove ${labelFor(tag)}`}
                    >
                      <CloseCircle size={16} variant="Linear" />
                    </span>
                  </span>
                ))}
              </div>
              <SelectDropdownIcon className="shrink-0 text-neutral-900" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-white shadow-lg"
          sideOffset={4}
          align="start"
        >
          {searchable && (
            <div className="border-b border-neutral-100 p-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className={cn(
                  fieldTextClassName,
                  'w-full rounded-[var(--radius-xs)] border border-neutral-200 px-3 py-2 font-light outline-none focus:border-blue-500'
                )}
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto p-1">
          {items.map((option) => {
            const selected = tags.includes(option.value)

            return (
              <DropdownMenu.Item
                key={option.value}
                onSelect={(event) => {
                  event.preventDefault()
                  toggleTag(option.value)
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
                <WesternDigits>{option.label}</WesternDigits>
              </DropdownMenu.Item>
            )
          })}
          {searchable && items.length === 0 && (
            <p className="px-3 py-2 text-body-3 text-neutral-500">No matches</p>
          )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}