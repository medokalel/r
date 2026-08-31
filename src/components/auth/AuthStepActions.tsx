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
  /** Renders a "Save & continue later" link under the buttons when provided. */
  onSaveAndExit?: () => void
  saveAndExitLabel?: string
  className?: string
}

export function AuthStepActions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  nextType = 'button',
  showBack = true,
  onSaveAndExit,
  saveAndExitLabel,
  className,
}: AuthStepActionsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('pt-2', className)}>
      <div className="flex gap-5">
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

      {onSaveAndExit && (
        <button
          type="button"
          onClick={onSaveAndExit}
          className="mt-3 w-full text-center text-body-3-medium text-neutral-500 underline underline-offset-2 hover:text-primary"
        >
          {saveAndExitLabel ?? t('common.saveAndContinueLater')}
        </button>
      )}
    </div>
  )
}
