import { useTranslation } from 'react-i18next'
import { AppIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { cn } from '@/lib/utils'

interface TravelPolicyRowActionsProps {
  confirmed: boolean
  onConfirmedChange: (confirmed: boolean) => void
  onRemove: () => void
  className?: string
}

/** "Confirmed" checkbox + remove button shared by the rows of every travel policy table. */
export function TravelPolicyRowActions({
  confirmed,
  onConfirmedChange,
  onRemove,
  className,
}: TravelPolicyRowActionsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <label className="flex items-center gap-2 whitespace-nowrap text-[13px] text-[var(--cab-ink)]">
        <Checkbox checked={confirmed} onChange={() => onConfirmedChange(!confirmed)} />
        {t('cab.travelPolicy.confirmed')}
      </label>
      <Button
        type="button"
        variant="tertiary"
        size="icon-sm"
        className="text-error-500 hover:bg-error-50 hover:text-error-600 active:text-error-700"
        aria-label={t('cab.travelPolicy.removeRow')}
        onClick={onRemove}
      >
        <AppIcon icon={TrashIcon} size={16} />
      </Button>
    </div>
  )
}
