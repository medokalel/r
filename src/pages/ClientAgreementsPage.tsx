import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, DocumentFileIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'

export function ClientAgreementsPage() {
  const { t } = useTranslation()

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAgreements.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <div>
          <h2 className="text-[24px] font-bold text-neutral-900">{t('clientAgreements.pageTitle')}</h2>
          <p className="mt-1 text-[14px] text-neutral-500">{t('clientAgreements.subtitle')}</p>
        </div>

        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-[16px] border border-[#ececec] bg-white px-6 py-14 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f6fd] text-primary">
            <AppIcon icon={DocumentFileIcon} size={26} />
          </span>
          <p className="text-[18px] font-semibold text-neutral-900">{t('clientAgreements.emptyTitle')}</p>
          <p className="max-w-[460px] text-[14px] text-neutral-500">{t('clientAgreements.emptySubtitle')}</p>
        </div>
      </div>
    </AppLayout>
  )
}
