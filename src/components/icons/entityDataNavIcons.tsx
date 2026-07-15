import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EntityDataNavIconProps {
  className?: string
}

function NavIconSvg({
  className,
  children,
}: EntityDataNavIconProps & { children: ReactNode }) {
  return (
    <svg
      className={cn('size-5 shrink-0', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function EntityDataNavEntityIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <path
        d="M4 21V9.5C4 8.12 5.12 7 6.5 7h11C18.88 7 20 8.12 20 9.5V21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2 21h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="10" r="0.85" fill="currentColor" />
      <circle cx="12" cy="10" r="0.85" fill="currentColor" />
      <circle cx="16" cy="10" r="0.85" fill="currentColor" />
      <circle cx="8" cy="13.5" r="0.85" fill="currentColor" />
      <circle cx="12" cy="13.5" r="0.85" fill="currentColor" />
      <circle cx="16" cy="13.5" r="0.85" fill="currentColor" />
      <circle cx="8" cy="17" r="0.85" fill="currentColor" />
      <circle cx="12" cy="17" r="0.85" fill="currentColor" />
      <circle cx="16" cy="17" r="0.85" fill="currentColor" />
      <path
        d="M10.5 21v-3.5h3V21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

export function EntityDataNavFieldIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </NavIconSvg>
  )
}

export function EntityDataNavDocumentsIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <path
        d="M22 11v6c0 4-1 5-5 5H7c-4 0-5-1-5-5V7c0-4 1-5 5-5h1.5c1.5 0 1.83.44 2.4 1.2l1.5 2c.38.5.6.8 1.6.8h3c4 0 5 1 5 5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />
    </NavIconSvg>
  )
}

export function EntityDataNavFeedbackIcon({ className }: EntityDataNavIconProps) {
  return (
    <NavIconSvg className={className}>
      <path
        d="M16 2H8C4 2 2 4 2 8v13c0 .55.45 1 1 1h13c4 0 6-2 6-6V8c0-4-2-6-6-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12.91 7.84-5.19 5.19c-.2.2-.39.59-.43.87l-.28 1.98c-.1.72.4 1.22 1.12 1.12l1.98-.28c.28-.04.67-.23.87-.43l5.19-5.19c.89-.89 1.32-1.93 0-3.25-1.32-1.33-2.36-.91-3.26-.01Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.17 8.58a4.688 4.688 0 0 0 3.25 3.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </NavIconSvg>
  )
}

export const entityDataNavIconComponents = {
  entityData: EntityDataNavEntityIcon,
  field: EntityDataNavFieldIcon,
  documents: EntityDataNavDocumentsIcon,
  feedback: EntityDataNavFeedbackIcon,
} as const
