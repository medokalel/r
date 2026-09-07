import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { getCabClient, type CabClient } from '@/lib/api/clientRegistrationApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] font-medium text-neutral-500">{label}</dt>
      <dd className="mt-1 break-words text-[15px] text-neutral-900">{children || '—'}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      <h2 className="mb-5 text-[18px] font-semibold text-primary">{title}</h2>
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

export function CabClientDetailsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const [client, setClient] = useState<CabClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getCabClient(clientId)
      .then((data) => {
        if (!cancelled) setClient(data)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : t('cab.clientsPage.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, t])

  const date = client?.incorporationDate
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(client.incorporationDate))
    : '—'
  const websiteHref = client?.website
    ? /^https?:\/\//i.test(client.website) ? client.website : `https://${client.website}`
    : undefined

  return (
    <CabLayout>
      <CabHeader title={t('cab.clientDetails.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/cab/clients')} className="text-[14px] font-medium text-primary">
            {t('cab.clientDetails.backToClients')}
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/cab/clients/${clientId}/edit`)}
              className="rounded-[8px] border border-primary px-4 py-2.5 text-[14px] font-medium text-primary"
            >
              {t('cab.clientDetails.editClient')}
            </button>
            <button type="button" onClick={() => navigate('/cab/clients/new')} className="rounded-[8px] bg-primary px-4 py-2.5 text-[14px] font-medium text-white">
              {t('cab.clientsPage.addClient')}
            </button>
          </div>
        </div>

        {loading && <div className="rounded-[16px] bg-white p-8 text-center text-neutral-500">{t('common.loading')}</div>}
        {error && <div role="alert" className="rounded-[16px] bg-white p-8 text-center text-error-500">{error}</div>}

        {client && (
          <>
            <div className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[24px] font-bold text-neutral-900">{client.legalEntityName || '—'}</h1>
                  <p className="text-[14px] text-neutral-500">{client.tradingName || client.registrationNumber || '—'}</p>
                </div>
                <span className="rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
                  {t(`cab.clientsPage.status.${client.status.toLowerCase()}`)}
                </span>
              </div>
            </div>

            <Section title={t('cab.clientRegistration.sections.clientInformation')}>
              <Detail label={t('cab.clientRegistration.fields.legalEntityName')}>{client.legalEntityName}</Detail>
              <Detail label={t('cab.clientRegistration.fields.tradingName')}>{client.tradingName}</Detail>
              <Detail label={t('cab.clientRegistration.fields.organizationType')}>{client.organizationType}</Detail>
              <Detail label={t('cab.clientRegistration.fields.registrationNumber')}>{client.registrationNumber}</Detail>
              <Detail label={t('cab.clientRegistration.fields.incorporationDate')}>{date}</Detail>
              <Detail label={t('cab.clientRegistration.fields.country')}>{client.country}</Detail>
              <Detail label={t('cab.clientRegistration.fields.state')}>{client.state}</Detail>
              <Detail label={t('cab.clientRegistration.fields.city')}>{client.city}</Detail>
            </Section>

            <Section title={t('cab.clientRegistration.sections.registeredAddress')}>
              <Detail label={t('cab.clientRegistration.fields.addressLine1')}>{client.addressLine1}</Detail>
              <Detail label={t('cab.clientRegistration.fields.addressLine2')}>{client.addressLine2}</Detail>
              <Detail label={t('cab.clientRegistration.fields.landmark')}>{client.landmark}</Detail>
              <Detail label={t('cab.clientRegistration.fields.postalCode')}>{client.postalCode}</Detail>
              <Detail label={t('cab.clientRegistration.fields.country')}>{client.addressCountry}</Detail>
              <Detail label={t('cab.clientRegistration.fields.state')}>{client.addressState}</Detail>
              <Detail label={t('cab.clientRegistration.fields.city')}>{client.addressCity}</Detail>
            </Section>

            <Section title={t('cab.clientRegistration.sections.primaryContact')}>
              <Detail label={t('cab.clientRegistration.fields.fullName')}>{client.contactFullName}</Detail>
              <Detail label={t('cab.clientRegistration.fields.designation')}>{client.contactDesignation}</Detail>
              <Detail label={t('cab.clientRegistration.fields.email')}>
                {client.contactEmail && <a className="text-primary" href={`mailto:${client.contactEmail}`}>{client.contactEmail}</a>}
              </Detail>
              <Detail label={t('cab.clientRegistration.fields.phoneNumber')}>
                {[client.phoneCountryCode, client.phoneNumber].filter(Boolean).join(' ')}
              </Detail>
              <Detail label={t('cab.clientRegistration.fields.mobileNumber')}>
                {[client.mobileCountryCode, client.mobileNumber].filter(Boolean).join(' ')}
              </Detail>
            </Section>

            <Section title={t('cab.clientRegistration.sections.additionalInformation')}>
              <Detail label={t('cab.clientRegistration.fields.industry')}>{client.industry}</Detail>
              <Detail label={t('cab.clientRegistration.fields.employeeCount')}>{client.employeeCount}</Detail>
              <Detail label={t('cab.clientRegistration.fields.annualTurnover')}>{client.annualTurnover}</Detail>
              <Detail label={t('cab.clientRegistration.fields.website')}>
                {websiteHref && <a className="text-primary" href={websiteHref} target="_blank" rel="noreferrer">{client.website}</a>}
              </Detail>
              <Detail label={t('cab.clientRegistration.fields.activitiesDescription')}>{client.activitiesDescription}</Detail>
              <Detail label={t('cab.clientRegistration.fields.attachDocument')}>
                {client.supportingDocumentUrl && (
                  <a className="text-primary" href={resolvePublicAssetUrl(client.supportingDocumentUrl)} target="_blank" rel="noreferrer">
                    {client.supportingDocumentOriginalName || t('cab.clientDetails.openDocument')}
                  </a>
                )}
              </Detail>
            </Section>
          </>
        )}
      </main>
    </CabLayout>
  )
}
