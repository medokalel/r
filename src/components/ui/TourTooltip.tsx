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

export interface TourTooltipProps {
  step?: number
  totalSteps?: number
  title: ReactNode
  description: ReactNode
  skipLabel?: string
  backLabel?: string
  nextLabel?: string
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
            open &&
              'z-[calc(var(--tour-z-content)+1)] rounded-xl ring-2 ring-[#1236A3] ring-offset-2 ring-offset-slate-900/60 shadow-[0_0_35px_rgba(18,54,163,0.35)]',
            className
          )}
          style={{ ['--tour-z-content' as string]: TOUR_Z_CONTENT }}
        >
          {children}
        </div>
      </Popover.Anchor>

      {/* Darkened spotlight backdrop — non-interactive so the rest of the page stays usable */}
      {open && (
        <Popover.Portal>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-none"
            style={{ zIndex: TOUR_Z_BACKDROP }}
            aria-hidden="true"
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
            'w-[350px] max-w-[calc(100vw-32px)] rounded-[20px] bg-white p-5.5',
            'shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100',
            'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 duration-150',
            contentClassName
          )}
        >
          {/* Step Badge */}
          <div className="mb-3.5 inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-0.5 text-[12px] font-semibold text-[#1236A3]">
            Step {step} of {totalSteps}
          </div>

          {/* Title */}
          <h3 className="mb-1.5 text-[17px] font-bold text-slate-900 leading-snug">{title}</h3>

          {/* Description */}
          <p className="mb-4 text-[13px] font-normal leading-relaxed text-slate-500">{description}</p>

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
                  className="rounded-xl border border-[#1236A3] px-4 py-1.5 text-[13px] font-semibold text-[#1236A3] transition-colors hover:bg-[#EEF2FF] cursor-pointer"
                >
                  {backLabel}
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={() => onNext?.()}
                  className="rounded-xl bg-[#1236A3] px-5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-[#0d2a80] active:scale-95 cursor-pointer shadow-md shadow-[#1236A3]/20"
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