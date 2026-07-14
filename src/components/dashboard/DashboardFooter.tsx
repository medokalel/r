import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DashboardFooterProps {
  onBack?: () => void
  onNext?: () => void
  backDisabled?: boolean
  nextDisabled?: boolean
  nextLabel?: string
  startContent?: ReactNode
  className?: string
}

export function DashboardFooter({
  onBack,
  onNext,
  backDisabled = true,
  nextDisabled = false,
  nextLabel,
  startContent,
  className,
}: DashboardFooterProps) {
  const { t } = useTranslation()

  return (
    <footer
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-4 border-t-2 border-[#ececec] bg-white px-6 py-3',
        startContent ? 'justify-between' : 'justify-end',
        className
      )}
    >
      {startContent}
      <div className="flex flex-wrap gap-5">
        <Button
          variant="secondary"
          disabled={backDisabled}
          onClick={onBack}
          className="min-w-[200px] rounded-[var(--radius-sm)] disabled:opacity-50"
        >
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          disabled={nextDisabled}
          onClick={onNext}
          className="min-w-[200px] rounded-[var(--radius-sm)] disabled:opacity-50"
        >
          {nextLabel ?? t('common.next')}
        </Button>
      </div>
    </footer>
  )
}
