import { useTranslation } from 'react-i18next'
import { AppIcon, BuildingIcon, SuccessCircleIcon } from '@/components/icons'
import { useProfileForm } from './ProfileFormContext'

export function CompanySummaryBanner({ incompleteKey = 'incompleteBranches' }: { incompleteKey?: string }) {
  const { t } = useTranslation()
  const { form } = useProfileForm()

  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-[#ececec] bg-white p-5">
      {/* Company icon */}
      <div className="flex size-[64px] shrink-0 items-center justify-center rounded-[14px] bg-[#f3f6fd]">
        <AppIcon icon={BuildingIcon} size={32} className="text-primary" />
      </div>

      {/* Name + badge row, then tags */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[18px] font-medium leading-[1.6] text-neutral-900">
            {form.organizationName || t('companyProfile.title')}
          </p>
          <div className="flex shrink-0 items-center gap-2 rounded-[8px] bg-[#f4fcf7] px-3 py-1.5">
            <AppIcon icon={SuccessCircleIcon} size={16} className="shrink-0 text-[#26a65b]" />
            <p className="text-[13px] font-medium leading-[1.6] text-[#26a65b]">
              {t(`companyProfile.completedSteps.${incompleteKey}`)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {form.industries.map((s) => (
            <span
              key={s}
              className="rounded-[8px] bg-[#f3f6fd] px-3 py-1 text-[14px] font-light text-primary"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
