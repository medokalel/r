import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, DocumentFileIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import {
  listClientAgreements,
  type CertificationAgreement,
  type CertificationAgreementStatus,
} from '@/lib/api/cabCertificationAgreementsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { clientAgreementDetailsPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Partial<Record<CertificationAgreementStatus, string>> = {
  sent: 'bg-[#fef3c6] text-[#a58401]',
  client_signed: 'bg-[#e8edfc] text-primary',
  active: 'bg-[#dcfce7] text-[#15803d]',
}

/** Statuses an audit client can see; the label key for the badge and for the date under it. */
const STATUS_KEYS: Partial<Record<CertificationAgreementStatus, { badge: string; date: string }>> = {
  sent: { badge: 'sent', date: 'sentOn' },
  client_signed: { badge: 'signed', date: 'signedOn' },
  active: { badge: 'active', date: 'activeSince' },
}

export function ClientAgreementsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<CertificationAgreement[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listClientAgreements()
      .then((list) => active && setItems(list))
      .catch((e) => active && setError(getUserErrorMessage(e, t)))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  const waiting = items?.filter((a) => a.status === 'sent').length ?? 0

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAgreements.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <div>
          <h2 className="text-[24px] font-bold text-neutral-900">{t('clientAgreements.pageTitle', 'Agreements')}</h2>
          <p className="mt-1 text-[14px] text-neutral-500">
            {t('clientAgreements.subtitle', 'Certification agreements from your certification body: review, sign and download.')}
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c]">
            {error}
          </p>
        )}

        {items && waiting > 0 && (
          <div role="status" className="rounded-[12px] border border-[#fde9c8] bg-[#fff8ec] px-5 py-3.5 text-[15px] font-medium text-[#8a5a00]">
            {t('clientAgreements.waiting', 'Agreements waiting for your signature: {{count}}', { count: waiting })}
          </div>
        )}

        {items === null && !error && <p className="text-[14px] text-neutral-500">{t('clientAgreements.loading', 'Loading agreements…')}</p>}

        {items && items.length === 0 && (
          <div role="status" className="flex flex-col items-center gap-3 rounded-[16px] border border-[#ececec] bg-white px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f6fd] text-primary">
              <AppIcon icon={DocumentFileIcon} size={26} />
            </span>
            <p className="text-[18px] font-semibold text-neutral-900">{t('clientAgreements.emptyTitle', 'No agreements yet')}</p>
            <p className="max-w-[460px] text-[14px] text-neutral-500">
              {t('clientAgreements.emptySubtitle', 'Your certification body sends the agreement after you accept the offer. It appears here for your signature.')}
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {items.map((agreement) => {
              const keys = STATUS_KEYS[agreement.status]
              const needsSignature = agreement.status === 'sent'
              return (
                <article key={agreement.id} className="rounded-[16px] border border-[#ececec] bg-white p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[18px] font-bold text-neutral-900">{t('clientAgreements.cardTitle', 'Certification agreement')}</h3>
                      <Link to={clientAgreementDetailsPath(agreement.id)} className="text-[15px] text-primary hover:underline" dir="ltr">
                        {agreement.reference}
                      </Link>
                    </div>
                    {keys && (
                      <span className={cn('shrink-0 rounded-[6px] px-2.5 py-1 text-[13px] font-medium', BADGE_STYLES[agreement.status])}>
                        {t(`clientAgreements.status.${keys.badge}`, keys.badge)}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[13px] text-neutral-500">{t('clientAgreements.standards', 'Standards')}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {agreement.values.standards.length === 0 ? (
                          <span className="text-[14px] text-neutral-400">—</span>
                        ) : (
                          agreement.values.standards.map((standard) => (
                            <span key={standard} dir="ltr" className="rounded-[8px] border border-[#d6e2ff] bg-[#f4f7ff] px-2.5 py-1 text-[13px] font-medium text-neutral-800">
                              {standard}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    {keys && (
                      <div>
                        <p className="text-[13px] text-neutral-500">{t(`clientAgreements.${keys.date}`, keys.date)}</p>
                        <p className="mt-1 text-[15px] text-neutral-900" dir="ltr">{agreement.lastChange}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <Button
                      type="button"
                      variant={needsSignature ? 'primary' : 'outline'}
                      onClick={() => navigate(clientAgreementDetailsPath(agreement.id))}
                      className="h-11 rounded-[10px] px-5 text-[15px]"
                    >
                      {needsSignature ? t('clientAgreements.reviewAndSign', 'Review and sign') : t('clientAgreements.view', 'View')}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
