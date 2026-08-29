import { useState, useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

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
  onSelectStep?: () => void

  /** Force open / control open state */
  open?: boolean
  /** Default open state */
  defaultOpen?: boolean

  /** Side to display the tooltip relative to child element */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Align position */
  align?: 'start' | 'center' | 'end'

  /** Pixel offsets for micro-adjusting location coordinates */
  offsetX?: number
  offsetY?: number

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
  onSelectStep,
  open: controlledOpen,
  defaultOpen = false,
  side = 'right',
  align = 'start',
  offsetX = 0,
  offsetY = 0,
  children,
  className,
  contentClassName,
}: TourTooltipProps) {
  const [isHovered, setIsHovered] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : isHovered
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const updateCoords = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const scrollX = window.scrollX || window.pageXOffset
    const scrollY = window.scrollY || window.pageYOffset

    let top = 0
    let left = 0

    if (side === 'right') {
      left = rect.right + 14 + scrollX
      if (align === 'start') {
        top = rect.top + scrollY
      } else if (align === 'end') {
        top = rect.bottom + scrollY - 200
      } else {
        top = rect.top + rect.height / 2 + scrollY - 100
      }
    } else if (side === 'left') {
      left = rect.left - 364 + scrollX
      top = align === 'start' ? rect.top + scrollY : rect.top + rect.height / 2 + scrollY - 100
    } else if (side === 'bottom') {
      top = rect.bottom + 14 + scrollY
      left = align === 'start' ? rect.left + scrollX : rect.left + rect.width / 2 + scrollX - 175
    } else {
      // top
      top = rect.top - 220 + scrollY
      left = align === 'start' ? rect.left + scrollX : rect.left + rect.width / 2 + scrollX - 175
    }

    setCoords({ top: top + offsetY, left: left + offsetX })
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    updateCoords()
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 250)
  }

  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, true)
    }
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen, side, align, offsetX, offsetY])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Render crisp SVG pointer arrow
  const renderArrowSvg = () => {
    switch (side) {
      case 'top':
        return (
          <svg
            width="18"
            height="9"
            viewBox="0 0 18 9"
            className="absolute bottom-[-9px] left-8 fill-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.03)]"
          >
            <path d="M9 9L0 0H18L9 9Z" />
          </svg>
        )
      case 'bottom':
        return (
          <svg
            width="18"
            height="9"
            viewBox="0 0 18 9"
            className="absolute top-[-9px] left-8 fill-white drop-shadow-[0_-2px_2px_rgba(0,0,0,0.03)]"
          >
            <path d="M9 0L18 9H0L9 0Z" />
          </svg>
        )
      case 'left':
        return (
          <svg
            width="9"
            height="18"
            viewBox="0 0 9 18"
            className="absolute right-[-9px] top-8 fill-white drop-shadow-[2px_0_2px_rgba(0,0,0,0.03)]"
          >
            <path d="M9 9L0 18V0L9 9Z" />
          </svg>
        )
      case 'right':
      default:
        return (
          <svg
            width="9"
            height="18"
            viewBox="0 0 9 18"
            className="absolute left-[-9px] top-8 fill-white drop-shadow-[-2px_0_2px_rgba(0,0,0,0.03)]"
          >
            <path d="M0 9L9 0V18L0 9Z" />
          </svg>
        )
    }
  }

  return (
    <>
      {/* Darkened Spotlight Backdrop */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99990] bg-slate-900/60 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-none" />,
          document.body
        )}

      <div
        ref={triggerRef}
        onClick={() => {
          onSelectStep?.()
        }}
        className={cn(
          'relative inline-block w-full transition-all duration-300 cursor-pointer',
          isOpen &&
            'z-[99998] relative rounded-xl ring-2 ring-[#1236A3] ring-offset-2 ring-offset-slate-900/60 shadow-[0_0_35px_rgba(18,54,163,0.35)]',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Target element */}
        {children}

        {/* Render popover into document.body */}
        {isOpen &&
          createPortal(
            <div
              style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className={cn(
                'z-[99999] w-[350px] max-w-[calc(100vw-32px)] rounded-[20px] bg-white p-5.5',
                'shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100',
                'animate-in fade-in zoom-in-95 duration-150',
                contentClassName
              )}
            >
              {/* Arrow Pointer */}
              {renderArrowSvg()}

              {/* Step Badge */}
              <div className="mb-3.5 inline-flex items-center rounded-full bg-[#EEF2FF] px-3 py-0.5 text-[12px] font-semibold text-[#1236A3]">
                Step {step} of {totalSteps}
              </div>

              {/* Title */}
              <h3 className="mb-1.5 text-[17px] font-bold text-slate-900 leading-snug">
                {title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-[13px] font-normal leading-relaxed text-slate-500">
                {description}
              </p>

              {/* Separator Line */}
              <div className="border-t border-slate-100 pt-3.5" />

              {/* Footer / Action buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSkip?.()
                  }}
                  className="text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
                >
                  {skipLabel}
                </button>

                <div className="flex items-center gap-2">
                  {onBack && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onBack?.()
                      }}
                      className="rounded-xl border border-[#1236A3] px-4 py-1.5 text-[13px] font-semibold text-[#1236A3] transition-colors hover:bg-[#EEF2FF] cursor-pointer"
                    >
                      {backLabel}
                    </button>
                  )}
                  {onNext && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNext?.()
                      }}
                      className="rounded-xl bg-[#1236A3] px-5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-[#0d2a80] active:scale-95 cursor-pointer shadow-md shadow-[#1236A3]/20"
                    >
                      {nextLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  )
}
