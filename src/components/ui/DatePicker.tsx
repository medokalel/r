import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { fieldInputClassName, fieldHeightClassName } from '@/components/ui/fieldStyles'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday-based weekday index (0=Mo … 6=Su) */
function weekdayOf(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay()
  return d === 0 ? 6 : d - 1
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toDisplay(date: Date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ value, onChange, placeholder, className, disabled }: DatePickerProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const displayPlaceholder = placeholder ?? (isRTL ? 'يوم/شهر/سنة' : 'DD/MM/YYYY')

  const today = new Date()
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [viewYear, setViewYear] = useState((value ?? today).getFullYear())
  const [viewMonth, setViewMonth] = useState((value ?? today).getMonth())
  const [internalSelected, setInternalSelected] = useState<Date | null>(value ?? null)
  const ref = useRef<HTMLDivElement>(null)

  // Controlled when a value prop is provided, otherwise fall back to internal state
  const selected = value ?? internalSelected

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(day: number) {
    const date = new Date(viewYear, viewMonth, day)
    setInternalSelected(date)
    onChange?.(date)
    setOpen(false)
  }

  // Approximate rendered popover height: padding + header + day names + 6 week rows
  const POPOVER_HEIGHT = 420

  function handleOpen() {
    if (disabled) return
    const base = selected ?? today
    setViewYear(base.getFullYear())
    setViewMonth(base.getMonth())
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < POPOVER_HEIGHT && rect.top > spaceBelow)
    }
    setOpen(true)
  }

  const totalDays = getDaysInMonth(viewYear, viewMonth)
  const firstWeekday = weekdayOf(viewYear, viewMonth, 1)

  const prevTotal = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)
  const leadDays = Array.from({ length: firstWeekday }, (_, i) => prevTotal - firstWeekday + 1 + i)
  const currDays = Array.from({ length: totalDays }, (_, i) => i + 1)
  const total = leadDays.length + currDays.length
  const trailDays = Array.from({ length: (7 - (total % 7)) % 7 }, (_, i) => i + 1)

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          fieldInputClassName,
          fieldHeightClassName,
          'flex w-full items-center justify-between gap-2 text-start',
          !selected && 'text-neutral-400',
          disabled && 'cursor-not-allowed bg-[#efefef] opacity-70'
        )}
      >
        <span>{selected ? toDisplay(selected) : displayPlaceholder}</span>
        <CalendarIcon className="size-5 shrink-0 text-primary" />
      </button>

      {/* Popover — flips above the trigger when there is not enough space below */}
      {open && (
        <div
          className={cn(
            'absolute z-50 w-[340px] rounded-[var(--radius-md)] border border-neutral-100 bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
              aria-label="Previous month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-[15px] font-semibold text-neutral-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
              aria-label="Next month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl-flip">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map(d => (
              <span key={d} className="py-1 text-center text-[12px] font-semibold text-neutral-400">{d}</span>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {leadDays.map(d => (
              <span key={`lead-${d}`} className="flex size-10 items-center justify-center text-[13px] text-neutral-300">{d}</span>
            ))}
            {currDays.map(d => {
              const thisDate = new Date(viewYear, viewMonth, d)
              const isToday = isSameDay(thisDate, today)
              const isSelected = selected && isSameDay(thisDate, selected)

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  className={cn(
                    'mx-auto flex size-10 items-center justify-center rounded-full text-[13px] transition-colors',
                    isSelected
                      ? 'bg-primary font-semibold text-white'
                      : isToday
                      ? 'border-2 border-primary font-semibold text-primary hover:bg-primary/10'
                      : 'text-neutral-800 hover:bg-neutral-100'
                  )}
                >
                  {d}
                  {isToday && !isSelected && (
                    <span className="absolute mt-7 size-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
            {trailDays.map(d => (
              <span key={`trail-${d}`} className="flex size-10 items-center justify-center text-[13px] text-neutral-300">{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
