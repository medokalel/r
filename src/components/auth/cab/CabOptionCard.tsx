import { cn } from '@/lib/utils'

interface CabOptionCardProps {
  icon?: string
  title: string
  description?: string
  selected: boolean
  onSelect: () => void
  className?: string
  /** Compact single-line cards for multi-select area pickers. */
  compact?: boolean
}

/** Single-select card: org type, accreditation body, etc — dashed primary border when chosen. */
export function CabOptionCard({
  icon,
  title,
  description,
  selected,
  onSelect,
  className,
  compact = false,
}: CabOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex w-full rounded-[var(--radius-sm)] border-2 bg-white text-start',
        'transition-all duration-300 ease-out motion-safe:hover:shadow-sm motion-safe:active:scale-[0.98]',
        compact
          ? 'h-11 items-center px-3 pe-9'
          : 'flex-col items-start p-4 pe-10',
        selected
          ? 'onboarding-card-selected border-dashed border-primary bg-primary-subtle shadow-sm motion-safe:scale-[1.01]'
          : 'onboarding-card-deselected border-neutral-200 hover:border-neutral-300',
        className
      )}
    >
      {icon && !compact && <span className="mb-3 text-[20px] leading-none">{icon}</span>}
      <p
        className={cn(
          compact
            ? 'w-full truncate text-[11px] font-medium leading-none text-neutral-900'
            : 'text-[14px] font-semibold leading-[1.4] text-neutral-900'
        )}
      >
        {title}
      </p>
      {description && !compact && (
        <p className="mt-3 text-[11px] leading-[1.6] text-neutral-500">{description}</p>
      )}
      <span
        className={cn(
          'absolute flex size-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px] leading-none text-white',
          'transition-all duration-300 ease-out',
          compact ? 'end-3 top-1/2 -translate-y-1/2' : 'end-4 top-4',
          selected
            ? 'scale-100 border-primary bg-primary opacity-100'
            : 'scale-75 border-neutral-300 bg-neutral-300 opacity-80'
        )}
        aria-hidden
      >
        ✓
      </span>
    </button>
  )
}
