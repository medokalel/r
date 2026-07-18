import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

interface TooltipProps {
  /** Content shown inside the tooltip bubble. */
  label: ReactNode
  /** Element the tooltip is attached to. */
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Delay before the tooltip appears, in ms. */
  delayDuration?: number
  contentClassName?: string
}

export function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  contentClassName,
}: TooltipProps) {
  const { dir } = useDirection()

  if (label == null || label === '') return <>{children}</>

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            dir={dir}
            side={side}
            align={align}
            sideOffset={8}
            className={cn(
              'z-50 max-w-xs rounded-[12px] bg-[#eef2fd] px-4 py-2.5',
              'text-[14px] font-medium leading-[1.5] text-neutral-900',
              'shadow-[0_8px_24px_rgba(18,54,163,0.14)]',
              'select-none break-words',
              'data-[state=delayed-open]:animate-[fadeInScale_0.14s_ease-out]',
              contentClassName
            )}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-[#eef2fd]" width={14} height={7} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
