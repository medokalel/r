import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDirection } from '@/context/DirectionContext'
import { useTranslation } from 'react-i18next'
import { AppIcon, ChevronDownIcon, GlobeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
]

interface LanguageToggleProps {
  variant?: 'default' | 'icon'
  className?: string
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.5 10.5L8 14L15.5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LanguageToggle({ variant = 'default', className }: LanguageToggleProps) {
  const { lang, setLanguage } = useDirection()
  const { t } = useTranslation()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {variant === 'icon' ? (
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 items-center gap-1',
              'text-neutral-500 hover:text-neutral-700 transition-colors',
              'rounded-[var(--radius-sm)] hover:bg-neutral-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              className
            )}
            aria-label={t('common.language')}
          >
            <AppIcon icon={GlobeIcon} size={30} />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-default)] px-3 py-2',
              'text-small-medium text-neutral-600 hover:bg-neutral-50 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              className
            )}
            aria-label={t('common.language')}
          >
            <span className="text-[18px] leading-none">
              {lang === 'ar' ? '🇸🇦' : '🇬🇧'}
            </span>
            <span>{lang === 'ar' ? 'العربية' : 'English'}</span>
            <AppIcon icon={ChevronDownIcon} size={14} />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 min-w-[220px] overflow-hidden rounded-[16px] border border-neutral-200 bg-white p-1.5',
            'shadow-[0_12px_32px_rgba(18,54,163,0.14)]',
            'data-[state=open]:animate-[fadeInScale_0.14s_ease-out]'
          )}
          sideOffset={8}
          align="end"
        >
          {languages.map(({ code, label, flag }) => {
            const active = lang === code
            return (
              <DropdownMenu.Item
                key={code}
                onSelect={() => setLanguage(code)}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-3 rounded-[12px] px-2.5 py-2',
                  'outline-none transition-colors',
                  active
                    ? 'bg-primary-subtle'
                    : 'hover:bg-neutral-50 focus:bg-neutral-50'
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-[15px] leading-none',
                    'bg-neutral-50 ring-1 ring-inset',
                    active ? 'ring-primary/30' : 'ring-neutral-200'
                  )}
                  aria-hidden
                >
                  {flag}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 text-[14px] font-medium',
                    active ? 'text-primary' : 'text-neutral-900',
                    code === 'ar' && '[font-family:var(--font-arabic)]'
                  )}
                  lang={code}
                >
                  {label}
                </span>
                {active && (
                  <span className="shrink-0 text-primary" aria-hidden>
                    <CheckMark />
                  </span>
                )}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
