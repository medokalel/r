import { CheckIcon } from '@radix-ui/react-icons'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

export interface CabProfilePagesNavItem {
  key: string
  label: string
  done: boolean
}

interface CabProfilePagesNavProps {
  items: readonly CabProfilePagesNavItem[]
  currentIndex: number
  onSelect: (index: number) => void
  ariaLabel: string
  className?: string
}

/**
 * Clickable list of the CAB profile pages. Vertical on desktop, a horizontal scroller on
 * small screens. The page in view is filled, completed pages carry a tick.
 */
export function CabProfilePagesNav({
  items,
  currentIndex,
  onSelect,
  ariaLabel,
  className,
}: CabProfilePagesNavProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('min-w-0', className)}>
      <ol className="scrollbar-hide flex gap-1 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--cab-border)] bg-white p-2 xl:flex-col xl:overflow-visible xl:p-3">
        {items.map((item, index) => {
          const isActive = index === currentIndex

          return (
            <li key={item.key} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-start transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-primary-subtle'
                )}
              >
                <span
                  lang="en"
                  dir="ltr"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                    englishDigitsLtrClassName,
                    isActive
                      ? 'bg-white text-primary'
                      : item.done
                        ? 'bg-success-500 text-white'
                        : 'bg-primary-subtle text-primary'
                  )}
                >
                  {item.done && !isActive ? <CheckIcon className="size-4" aria-hidden /> : index + 1}
                </span>
                <span className="whitespace-nowrap text-[14px] font-semibold xl:whitespace-normal">
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
