import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Small titled stat card — was private to MultiSiteRulePreview, lifted out
 * here so ReviewConfirmStep (Key Information Summary cards) reuses the same
 * component instead of redefining it.
 */
export function Card({ title, children, highlight }: { title: string; children: ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border p-4',
        highlight ? 'border-dashed border-primary/40 bg-[#f3f6fd]' : 'border-[#ececec] bg-white'
      )}
    >
      <p className="text-[13px] text-neutral-500">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function Badge({ tone, children }: { tone: 'green' | 'red' | 'neutral'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[6px] px-2.5 py-1 text-[12px] font-medium',
        tone === 'green' && 'bg-[#dcfce7] text-[#16a34a]',
        tone === 'red' && 'bg-[#fde8e8] text-[#dc2626]',
        tone === 'neutral' && 'bg-[#f3f4f6] text-neutral-600'
      )}
    >
      {children}
    </span>
  )
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-body-1-medium text-neutral-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export function CalloutCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'blue' | 'amber'
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-md)] border p-4',
        tone === 'blue' && 'border-[#dbe4fb] bg-[#f3f6fd] text-[#1236a3]',
        tone === 'amber' && 'border-[#fde9c8] bg-[#fef8ee] text-[#a05a00]'
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{children}</p>
      </div>
    </div>
  )
}
