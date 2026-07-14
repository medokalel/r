import { cn } from '@/lib/utils'

export const authFieldLabelClassName =
  'block text-[18px] font-normal leading-[1.6] text-neutral-900'

interface AuthFieldLabelProps {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function AuthFieldLabel({ htmlFor, children, required, className }: AuthFieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn(authFieldLabelClassName, className)}>
      {children}
      {required && <span className="text-error-500"> *</span>}
    </label>
  )
}
