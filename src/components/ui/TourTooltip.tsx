import { type ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

/**
 * z-index layering for the tour overlay. Kept as named constants (instead of
 * ad-hoc magic numbers) so the stacking order is documented in one place.
 * The backdrop portals to <body> first, the popover content portals after it
 * and must stay above it.
 */
const TOUR_Z_BACKDROP = 100
const TOUR_Z_CONTENT = 101

/** Pill-style progress indicator — the current step's dot elongates into a
 *  bar, completed steps stay as small filled dots, upcoming steps are muted.
 *  Scans faster than a "Step X of Y" pill alone, especially for a 7-step tour. */
function TourProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const dotStep = i + 1
        const isCurrent = dotStep === current
        const isDone = dotStep < current
        return (
          <span
            key={dotStep}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              isCurrent ? 'w-5 bg-primary' : isDone ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-slate-200'
            )}
          />
        )
      })}
    </div>
  )
}

export interface TourTooltipProps {
  step?: number
  totalSteps?: number
  title: ReactNode
  description: ReactNode
  skipLabel?: string
  backLabel?: string
  nextLabel?: string
  closeLabel?: string
  onSkip?: () => void
  onBack?: () => void
  onNext?: () => void

  /** Whether this step's popover is currently open. Fully controlled by the caller. */
  open: boolean

  /** Side to display the tooltip relative to the anchor element */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Align position along the alignment axis */
  align?: 'start' | 'center' | 'end'

  /** Distance (px) from the anchor along the main axis. Radix flips this automatically in RTL. */
  sideOffset?: number
  /** Distance (px) along the alignment axis, e.g. to nudge the popover past a wide anchor. */
  alignOffset?: number

  children: ReactNode
  className?: string
  contentClassName?: string
}

export function TourTooltip({
  step = 1,
  totalSteps = 7,
  title,
  description,
  skipLabel = 'Skip Tour',
  backLabel = 'Back',
  nextLabel = 'Next',
  closeLabel = 'Close',
  onSkip,
  onBack,
  onNext,
  open,
  side = 'right',
  align = 'start',
  sideOffset = 14,
  alignOffset = 0,
  children,
  className,
  contentClassName,
}: TourTooltipProps) {
  const { dir } = useDirection()

  return (
    <Popover.Root open={open} modal={false}>
      <Popover.Anchor asChild>
        <div
          className={cn(
            'relative w-full transition-all duration-300',
            open && 'z-[calc(var(--tour-z-content)+1)]',
            className
          )}
          style={{ ['--tour-z-content' as string]: TOUR_Z_CONTENT }}
        >
          {children}
        </div>
      </Popover.Anchor>

      {/* Darkened spotlight backdrop — pointer-events-auto so it blocks interaction
          with the rest of the page while the tour is open. */}
      {open && (
        <Popover.Portal>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
            style={{ zIndex: TOUR_Z_BACKDROP }}
            aria-hidden="true"
            onClick={(e) => e.preventDefault()}
          />
        </Popover.Portal>
      )}

      <Popover.Portal>
        <Popover.Content
          dir={dir}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions
          collisionPadding={16}
          role="dialog"
          aria-label={typeof title === 'string' ? title : undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => onSkip?.()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          style={{ zIndex: TOUR_Z_CONTENT }}
          className={cn(
            'w-[360px] max-w-[calc(100vw-32px)] rounded-[20px] border border-slate-100 bg-white p-6',
            'shadow-[0_24px_60px_-12px_rgba(18,54,163,0.28)]',
            'data-[state=open]:animate-[fadeInScale_0.2s_ease-out]',
            contentClassName
          )}
        >
          {/* Progress + close */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <TourProgressDots total={totalSteps} current={step} />
              <span className="text-[12px] font-medium text-slate-400">
                {step}/{totalSteps}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSkip?.()}
              aria-label={closeLabel}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <h3 className="mb-1.5 text-[18px] font-bold tracking-tight text-slate-900 leading-snug">{title}</h3>

          {/* Description */}
          <p className="mb-5 text-[13.5px] font-normal leading-relaxed text-slate-500">{description}</p>

          {/* Separator Line */}
          <div className="border-t border-slate-100 pt-3.5" />

          {/* Footer / Action buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSkip?.()}
              className="text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
            >
              {skipLabel}
            </button>

            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={() => onBack?.()}
                  className="rounded-xl border border-primary px-4 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-subtle cursor-pointer"
                >
                  {backLabel}
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={() => onNext?.()}
                  className="rounded-xl bg-primary px-5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-primary-hover active:bg-primary-active active:scale-95 cursor-pointer shadow-md shadow-primary/20"
                >
                  {nextLabel}
                </button>
              )}
            </div>
          </div>

          <Popover.Arrow className="fill-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.06)]" width={18} height={9} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}