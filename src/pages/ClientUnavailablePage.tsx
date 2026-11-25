import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, ShieldIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import type { ClientUnavailableSection } from '@/lib/clientPortalRouting'
import { ROUTES } from '@/lib/routes'

interface ClientUnavailablePageProps {
  section: ClientUnavailableSection
}

export function ClientUnavailablePage({ section }: ClientUnavailablePageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientUnavailable.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-[#d9dee8] bg-white px-6 py-14 text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f6fd] text-primary">
            <AppIcon icon={ShieldIcon} size={26} />
          </span>
          <p className="text-[18px] font-semibold text-neutral-900">
            {t(`clientUnavailable.${section}.title`)}
          </p>
          <p className="max-w-md text-[14px] text-neutral-500">
            {t(`clientUnavailable.${section}.description`)}
          </p>
          {section === 'notFound' && (
            <p className="max-w-full break-all text-[12px] text-neutral-400" dir="ltr">
              {location.pathname}
            </p>
          )}
          <Button variant="primary" className="mt-2 min-w-[200px]" onClick={() => navigate(ROUTES.dashboard)}>
            {t('clientUnavailable.backToDashboard')}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
