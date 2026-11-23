import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { AppIcon, ChevronDownIcon, MoreIcon } from '@/components/icons'
import { useDirection } from '@/context/DirectionContext'
import { cn } from '@/lib/utils'

export interface ActionMenuItem {
  key: string
  label: string
  onSelect: () => void
  disabled?: boolean
  /** Shown under the label while the item is disabled, to explain why it is unavailable. */
  hint?: string
  tone?: 'default' | 'destructive'
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  /** Text trigger (button with a chevron). Without it the trigger is the "more actions" icon button. */
  label?: string
  /** Accessible name of the icon trigger. */
  ariaLabel?: string
  triggerClassName?: string
  align?: 'start' | 'center' | 'end'
  heading?: string
}

/**
 * Shared dropdown for row / card actions. Items that are not available stay visible but
 * disabled, with a hint saying why, so people learn what the next step is.
 */
export function ActionMenu({
  items,
  label,
  ariaLabel,
  triggerClassName,
  align = 'end',
  heading,
}: ActionMenuProps) {
  const { t } = useTranslation()
  const { dir } = useDirection()

  return (
    <DropdownMenu.Root modal={false} dir={dir}>
      <DropdownMenu.Trigger asChild>
        {label ? (
          <Button type="button" variant="outline" className={triggerClassName}>
            <span>{label}</span>
            <AppIcon icon={ChevronDownIcon} size={16} />
          </Button>
        ) : (
          <button
            type="button"
            aria-label={ariaLabel ?? t('common.moreActions', 'More actions')}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors',
              'hover:bg-neutral-100 hover:text-neutral-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              triggerClassName,
            )}
          >
            <AppIcon icon={MoreIcon} size={18} />
          </button>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className="z-50 min-w-[220px] max-w-[min(320px,calc(100vw-24px))] rounded-[8px] border border-[#e2e2e2] bg-white p-1 text-start shadow-lg"
        >
          {heading && (
            <DropdownMenu.Label className="px-3 py-2 text-[12px] font-semibold text-neutral-500">
              {heading}
            </DropdownMenu.Label>
          )}

          {items.map((item) => (
            <DropdownMenu.Item
              key={item.key}
              disabled={item.disabled}
              onSelect={() => item.onSelect()}
              className={cn(
                'flex cursor-pointer select-none flex-col items-start gap-0.5 rounded-[6px] px-3 py-2.5 text-start text-[13px] outline-none',
                'data-[highlighted]:bg-[#f3f6fd] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
                item.tone === 'destructive' ? 'text-error-600' : 'text-neutral-800',
              )}
            >
              <span className="font-medium">{item.label}</span>
              {item.disabled && item.hint && (
                <span className="text-[12px] font-normal text-neutral-500">{item.hint}</span>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
