import type { SsoProvider } from '@/lib/api/ssoTypes'
import { cn } from '@/lib/utils'

const PROVIDER_MARKS: Record<SsoProvider, { label: string; className: string }> = {
  entra: { label: 'ME', className: 'bg-[#e8f1fb] text-[#0f5cab]' },
  google: { label: 'GW', className: 'bg-[#e9f5ec] text-[#1e7b3a]' },
  okta: { label: 'OK', className: 'bg-[#e8ecf8] text-[#1d2f7a]' },
  generic_oidc: { label: 'OI', className: 'bg-[#eef0f3] text-[#3f4652]' },
  generic_saml: { label: 'SA', className: 'bg-[#fbf1e6] text-[#8a4b0f]' },
}

interface SsoProviderMarkProps {
  provider: SsoProvider
  className?: string
}

/** Two-letter badge that identifies an identity provider (the providers' own logos are not bundled). */
export function SsoProviderMark({ provider, className }: SsoProviderMarkProps) {
  const mark = PROVIDER_MARKS[provider]
  return (
    <span
      lang="en"
      dir="ltr"
      aria-hidden
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-bold tracking-wide',
        mark.className,
        className,
      )}
    >
      {mark.label}
    </span>
  )
}
