import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDirection } from '@/context/DirectionContext'
import { useTranslation } from 'react-i18next'
import { AppIcon, ChevronDownIcon, GlobeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'ar' as const, label: 'العربية' },
  { code: 'en' as const, label: 'English' },
]

interface LanguageToggleProps {
  variant?: 'default' | 'icon'
  className?: string
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
            <AppIcon icon={GlobeIcon} size={32} />
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
            <AppIcon icon={GlobeIcon} size={20} />
            <span>{lang === 'ar' ? 'عربي' : 'English'}</span>
            <AppIcon icon={ChevronDownIcon} size={14} />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[140px] rounded-[var(--radius-sm)] border border-neutral-200 bg-white shadow-lg p-1 z-50"
          sideOffset={6}
          align="start"
        >
          {languages.map(({ code, label }) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => setLanguage(code)}
              className={cn(
                'flex cursor-pointer select-none items-center rounded-[var(--radius-xs)] px-3 py-2',
                'text-neutral-900 outline-none',
                'hover:bg-neutral-50 focus:bg-neutral-50',
                lang === code && 'bg-primary-subtle'
              )}
            >
              <span
                className={cn(
                  'text-body-2-medium',
                  code === 'ar' && '[font-family:var(--font-arabic)]'
                )}
                lang={code}
              >
                {label}
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
