import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AuthStepActionsProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextType?: 'button' | 'submit'
  showBack?: boolean
  className?: string
}

export function AuthStepActions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextType = 'button',
  showBack = true,
  className,
}: AuthStepActionsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex gap-5 pt-2', className)}>
      {showBack && onBack && (
        <Button
          type="button"
          variant="secondary"
          className="flex-1 h-12 rounded-[var(--radius-sm)] text-[16px] font-medium"
          onClick={onBack}
        >
          {t('common.back')}
        </Button>
      )}
      <Button
        type={nextType}
        variant="primary"
        className={cn(
          'h-12 rounded-[var(--radius-sm)] text-body-2-semibold',
          showBack && onBack ? 'flex-1' : 'w-full'
        )}
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel ?? t('common.next')}
      </Button>
    </div>
  )
}
