import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, DownloadIcon, EyeIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface QuickAction {
  key: string
  icon: typeof AddCircleIcon
  bgColor: string
  iconColor: string
  titleKey: string
  descriptionKey: string
  onClick?: () => void
}

interface CabQuickActionsProps {
  onNewApplication?: () => void
  onAssignReview?: () => void
  onIssueCertificate?: () => void
}

export function CabQuickActions({
  onNewApplication,
  onAssignReview,
  onIssueCertificate,
}: CabQuickActionsProps) {
  const { t } = useTranslation()

  const actions: QuickAction[] = [
    {
      key: 'newApplication',
      icon: AddCircleIcon,
      bgColor: 'bg-[#dbeafe]',
      iconColor: 'text-[#1447e6]',
      titleKey: 'cab.dashboard.quickActions.newApplication.title',
      descriptionKey: 'cab.dashboard.quickActions.newApplication.description',
      onClick: onNewApplication,
    },
    {
      key: 'assignReview',
      icon: EyeIcon,
      bgColor: 'bg-[#fef3c6]',
      iconColor: 'text-[#a58401]',
      titleKey: 'cab.dashboard.quickActions.assignReview.title',
      descriptionKey: 'cab.dashboard.quickActions.assignReview.description',
      onClick: onAssignReview,
    },
    {
      key: 'issueCertificate',
      icon: DownloadIcon,
      bgColor: 'bg-[#ede9fe]',
      iconColor: 'text-[#6d28d9]',
      titleKey: 'cab.dashboard.quickActions.issueCertificate.title',
      descriptionKey: 'cab.dashboard.quickActions.issueCertificate.description',
      onClick: onIssueCertificate,
    },
  ]

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <h3 className="mb-3 text-[16px] font-semibold text-neutral-900">
        {t('cab.dashboard.quickActions.title')}
      </h3>

      <div className="flex flex-col gap-3">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className="flex items-center gap-3 rounded-[12px] border border-[#ececec] p-3 text-start transition-colors hover:bg-neutral-50"
          >
            <span
              className={cn('flex size-10 shrink-0 items-center justify-center rounded-[10px]', action.bgColor)}
            >
              <AppIcon icon={action.icon} size={20} className={action.iconColor} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-neutral-900">{t(action.titleKey)}</p>
              <p className="truncate text-[12px] text-neutral-500">{t(action.descriptionKey)}</p>
            </div>
            <span className="shrink-0 text-neutral-400">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}