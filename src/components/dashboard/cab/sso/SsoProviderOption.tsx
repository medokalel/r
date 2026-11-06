import { useTranslation } from 'react-i18next'
import type { SsoProvider } from '@/lib/api/ssoTypes'
import { cn } from '@/lib/utils'
import { SsoProviderMark } from '@/components/dashboard/cab/sso/SsoProviderMark'

interface SsoProviderOptionProps {
  provider: SsoProvider
  onSelect: () => void
  /** Pass for a choice that stays marked; leave out for a tile that acts immediately. */
  selected?: boolean
  disabled?: boolean
}

/** One identity provider as a tile: mark, name and a one-line hint. */
export function SsoProviderOption({ provider, onSelect, selected, disabled }: SsoProviderOptionProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-sm)] border-2 bg-white p-3 text-start',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected
          ? 'border-dashed border-primary bg-primary-subtle'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50',
      )}
    >
      <SsoProviderMark provider={provider} />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold leading-[1.4] text-neutral-900">
          {t(`cab.sso.providers.${provider}`)}
        </span>
        <span className="mt-0.5 block text-[12px] leading-[1.6] text-neutral-500">
          {t(`cab.sso.providerHints.${provider}`)}
        </span>
      </span>
    </button>
  )
}
