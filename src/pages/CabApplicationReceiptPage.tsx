import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { WorkflowProgressCard } from '@/components/dashboard/cab/WorkflowProgressCard'
import {
  AppIcon,
  DownloadIcon,
  ExternalLinkArrowIcon,
  FileTextIcon,
  MailIcon,
  NotificationIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  getCabApplicationReceipt,
  type CabApplicationReceipt,
  type WorkflowStepStatus,
} from '@/lib/api/cabApplicationReceiptApi'
import { useCabSidebar } from '@/context/CabSidebarContext'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useFitScale } from '@/lib/useFitScale'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

function StatusBadge({
  label,
  variant,
  className,
}: {
  label: string
  variant: 'received' | 'inProgress' | 'pending' | 'completed'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none',
        variant === 'received' && 'bg-[#eafaf1] text-[#2ecc70]',
        variant === 'inProgress' && 'bg-[#e8edfc] text-[#1236a3]',
        variant === 'pending' && 'bg-[#f3f4f6] text-[#6b7280]',
        variant === 'completed' && 'bg-[#eafaf1] text-[#2ecc70]',
        className
      )}
    >
      {label}
    </span>
  )
}

function ClientSummaryRowField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-x-2 sm:gap-x-3">
      <span className="w-[96px] shrink-0 text-[11px] font-bold leading-snug text-[#8a96a8] sm:w-[112px]">
        {label}
      </span>
      <div className="min-w-0 break-words text-[11px] font-bold leading-snug text-[#464646]">{value}</div>
    </div>
  )
}

function ClientSummaryStackField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] font-bold leading-tight text-[#8a96a8]">{label}</span>
      <div className="text-[11px] font-bold leading-snug text-[#464646]">{value}</div>
    </div>
  )
}

function ClientLeafIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.5C9.2 4.5 7 7.4 7 10.5C7 14.8 12 19.5 12 19.5C12 19.5 17 14.8 17 10.5C17 7.4 14.8 4.5 12 4.5Z"
        fill="white"
      />
      <path
        d="M12 8.5V16.5"
        stroke="#1a6b45"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DetailField({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: React.ReactNode
  variant?: 'default' | 'applicationDetails'
}) {
  const isApplicationDetails = variant === 'applicationDetails'

  return (
    <div className={cn('flex flex-col', isApplicationDetails ? 'gap-1.5' : 'gap-1')}>
      <span
        className={cn(
          isApplicationDetails ? 'text-[12px] font-bold text-[#8a96a8]' : 'text-[12px] font-normal text-[#989898]'
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          'text-[#464646]',
          isApplicationDetails ? 'text-[13px] font-bold leading-snug' : 'text-[13px] font-semibold'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function SummaryMetaItem({
  icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  iconClassName?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className={cn('mt-0.5 shrink-0 text-[#64748b]', iconClassName)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold leading-none text-[#6b7280]">{label}</p>
        <div className="mt-1 break-words text-[13px] font-semibold leading-snug text-[#464646]">{value}</div>
      </div>
    </div>
  )
}

function PrimaryStandardsTags({ standards }: { standards: string[] }) {
  const { expanded } = useCabSidebar()

  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full items-center gap-1.5',
        expanded ? 'flex-wrap' : 'flex-nowrap'
      )}
    >
      {standards.map((standard) => (
        <span
          key={standard}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-[#eef1f6] font-semibold text-[#464646]',
            expanded ? 'px-2 py-1 text-[11px]' : 'shrink-0 px-1.5 py-1 text-[10px]'
          )}
        >
          {standard}
        </span>
      ))}
    </div>
  )
}

function ReceiptSummaryCard({ receipt }: { receipt: CabApplicationReceipt }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
          <ReceiptDocIcon />
        </span>
        <span className="text-[18px] font-bold leading-none text-[#464646] sm:text-[20px]">
          {receipt.applicationId}
        </span>
        <StatusBadge
          label={t('cab.applications.receipt.status.received')}
          variant="received"
        />
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-5">
        <SummaryMetaItem
          icon={<UsersOutlineIcon />}
          label={t('cab.applications.receipt.summary.client')}
          value={receipt.clientName}
        />
        <SummaryMetaItem
          icon={<ClipboardOutlineIcon />}
          label={t('cab.applications.receipt.summary.applicationType')}
          value={receipt.applicationType}
        />
        <SummaryMetaItem
          icon={<GearOutlineIcon />}
          label={t('cab.applications.receipt.summary.certificationBody')}
          value={receipt.certificationBody}
        />
        <SummaryMetaItem
          iconClassName="mt-1.5"
          icon={
            <span className="flex size-7 items-center justify-center rounded-full bg-[#7c3aed] text-[10px] font-bold text-white">
              {receipt.receivedByInitials}
            </span>
          }
          label={t('cab.applications.receipt.summary.receivedBy')}
          value={receipt.receivedBy}
        />
        <SummaryMetaItem
          icon={<CalendarOutlineIcon />}
          label={t('cab.applications.receipt.summary.receivedOn')}
          value={
            <>
              <span className="block font-bold">{receipt.receivedOnDate}</span>
              <span className="block text-[12px] font-semibold text-[#464646]">
                {receipt.receivedOnTime}
              </span>
            </>
          }
        />
      </div>
    </section>
  )
}

function NextStepIcon({ stepKey, active }: { stepKey: string; active: boolean }) {
  const stroke = active ? 'white' : '#9ca3af'
  const common = {
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  }

  if (stepKey === 'informationRequired') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" {...common} />
        <path d="M12 11V16M12 8H12.01" {...common} />
      </svg>
    )
  }

  if (stepKey === 'technicalFeasibility') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M14 2H7C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V7L14 2Z" {...common} />
        <path d="M14 2V7H19M9 13H15M9 17H13" {...common} />
      </svg>
    )
  }

  if (stepKey === 'proceedToQuotation') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path d="M14 2H7C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V7L14 2Z" {...common} />
        <path d="M14 2V7H19M9 14L11 16L15 12" {...common} />
      </svg>
    )
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M14 2H7C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V7L14 2Z" {...common} />
      <path d="M14 2V7H19M9 12H15M9 16H13" {...common} />
    </svg>
  )
}

function NextStepItem({
  stepKey,
  label,
  status,
  isLast,
}: {
  stepKey: string
  label: string
  status: WorkflowStepStatus
  isLast: boolean
}) {
  const { t } = useTranslation()
  const active = status === 'inProgress'
  const statusLabel = active
    ? t('cab.applications.receipt.workflow.inProgress')
    : t('cab.applications.receipt.workflow.pending')

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center">
      {!isLast && (
        <span
          className="absolute start-1/2 top-6 z-0 hidden h-px w-full bg-[#dbe3ef] sm:block"
          aria-hidden
        />
      )}
      <div
        className={cn(
          'relative z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white',
          active ? 'border-[#b6d0ff]' : 'border-[#e5e7eb]'
        )}
      >
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full',
            active ? 'bg-[#1236a3]' : 'bg-white'
          )}
        >
          <NextStepIcon stepKey={stepKey} active={active} />
        </span>
      </div>
      <p
        className={cn(
          'mt-3 px-1 text-center text-[12px] font-bold leading-snug sm:text-[13px]',
          active ? 'text-[#1236a3]' : 'text-[#464646]'
        )}
      >
        {label}
      </p>
      <span
        className={cn(
          'mt-1.5 text-center text-[11px] font-medium',
          active ? 'text-[#1236a3]' : 'text-[#9ca3af]'
        )}
      >
        {statusLabel}
      </span>
    </div>
  )
}

export function CabApplicationReceiptPage() {
  const { t } = useTranslation()
  const scale = useFitScale()
  const [receipt, setReceipt] = useState<CabApplicationReceipt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCabApplicationReceipt().then((data) => {
      if (!cancelled) {
        setReceipt(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading || !receipt) {
    return (
      <CabLayout className="bg-white">
        <div className="flex flex-1 items-center justify-center p-6 text-[14px] text-neutral-500">
          {t('common.loading')}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout className="bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ececec] bg-white px-3 py-3 sm:gap-4 sm:px-5">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] sm:text-[13px]" aria-label="breadcrumb">
          <Link to="/cab/dashboard" className="font-light text-[#989898] hover:text-primary">
            {t('cab.applications.receipt.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#989898]">
            {t('cab.applications.receipt.breadcrumb.applications')}
          </span>
          <Chevron />
          <span className="font-light text-[#989898]">{receipt.applicationId}</span>
          <Chevron />
          <span className="font-bold text-[#464646]">
            {t('cab.applications.receipt.breadcrumb.current')}
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border border-[#ececec] text-[#1236a3]"
            aria-label={t('cab.applications.receipt.help')}
          >
            ?
          </button>
          <button
            type="button"
            className="relative flex size-9 items-center justify-center text-neutral-600"
            aria-label={t('cab.header.notifications')}
          >
            <AppIcon icon={NotificationIcon} size={24} />
            <span className="absolute end-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#1236a3] text-[10px] font-semibold text-white">
              3
            </span>
          </button>
          <LanguageToggle variant="icon" />
          <div className="flex items-center gap-2">
            <UserAvatar alt="Arjun Verma" className="size-10 border-2" />
            <div className="hidden text-end sm:block">
              <p className="text-[13px] font-semibold text-[#464646]">Arjun Verma</p>
              <p className="text-[12px] text-[#989898]">Lead Auditor</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 overflow-hidden bg-white">
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
          <div className="flex min-w-0 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:p-6">
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5" style={{ zoom: scale }}>
            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[18px] font-bold text-[#464646] sm:text-[22px]">
                    {t('cab.applications.receipt.title')}
                  </h1>
                  <StatusBadge
                    label={t('cab.applications.receipt.status.received')}
                    variant="received"
                  />
                </div>
                <p className="mt-1 text-[14px] text-[#989898]">
                  {t('cab.applications.receipt.subtitle')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#464646]"
                >
                  <AppIcon icon={DownloadIcon} size={16} />
                  {t('cab.applications.receipt.actions.downloadReceipt')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#464646]"
                >
                  <PrintIcon />
                  {t('cab.applications.receipt.actions.printReceipt')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-[8px] border-[#ececec] px-3 text-[12px] font-medium text-[#464646]"
                >
                  {t('cab.applications.receipt.actions.moreActions')} ▾
                </Button>
              </div>
            </div>

            <ReceiptSummaryCard receipt={receipt} />

            <div className="flex items-start gap-3 rounded-[8px] bg-[#f0fdf4] px-5 py-4">
              <SuccessAlertCheckIcon />
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-snug text-[#464646]">
                  {t('cab.applications.receipt.successTitle')}
                </p>
                <p className="mt-0.5 text-[13px] font-normal leading-snug text-[#6b7280]">
                  {t('cab.applications.receipt.successDescription')}
                </p>
              </div>
            </div>

            <section className={cn(cardClassName, 'min-w-0 overflow-hidden p-3 sm:p-5')}>
              <h2 className="mb-5 text-[15px] font-bold text-[#464646]">
                {t('cab.applications.receipt.sections.applicationDetails')}
              </h2>
              <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-0">
                <div className="flex min-w-0 max-w-full flex-col gap-5 overflow-hidden lg:pr-4 xl:pr-8">
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.applicationType')}
                    value={receipt.applicationType}
                  />
                  <div className="flex min-w-0 max-w-full flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-[#8a96a8]">
                      {t('cab.applications.receipt.fields.primaryStandard')}
                    </span>
                    <PrimaryStandardsTags standards={receipt.primaryStandards} />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <DetailField
                      variant="applicationDetails"
                      label={t('cab.applications.receipt.fields.requestedCertificationDate')}
                      value={receipt.requestedCertificationDate}
                    />
                    <DetailField
                      variant="applicationDetails"
                      label={t('cab.applications.receipt.fields.numberOfSites')}
                      value={receipt.numberOfSites}
                    />
                  </div>
                </div>

                <div className="hidden bg-[#ececec] lg:block" aria-hidden />

                <div className="flex min-w-0 flex-col gap-5 lg:px-4 xl:px-8">
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.certificationBody')}
                    value={receipt.certificationBody}
                  />
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.accreditationBody')}
                    value={receipt.accreditationBody}
                  />
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.auditLanguage')}
                    value={receipt.auditLanguage}
                  />
                </div>

                <div className="hidden bg-[#ececec] lg:block" aria-hidden />

                <div className="flex min-w-0 flex-col gap-5 lg:pl-4 xl:pl-8">
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.applicationDate')}
                    value={receipt.applicationDate}
                  />
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.applicationReceivedDate')}
                    value={receipt.applicationReceivedDate}
                  />
                  <DetailField
                    variant="applicationDetails"
                    label={t('cab.applications.receipt.fields.referenceNo')}
                    value={receipt.referenceNo}
                  />
                </div>
              </div>
            </section>

            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
              <section className={cn(cardClassName, 'min-w-0 p-4')}>
                <h2 className="mb-3 text-[15px] font-bold text-[#464646]">
                  {t('cab.applications.receipt.sections.clientSummary')}
                </h2>

                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:gap-0">
                  <div className="min-w-0 md:pe-5">
                    <div className="flex items-start gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[7px] bg-[#1a6b45]">
                        <ClientLeafIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold leading-tight text-[#464646]">
                          {receipt.client.name}
                        </p>
                        <div className="mt-1">
                          <StatusBadge
                            label={t('cab.applications.receipt.client.registeredClient')}
                            variant="received"
                            className="rounded-[6px] font-medium text-[#26a65b]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2.5">
                      <ClientSummaryRowField
                        label={t('cab.applications.receipt.client.clientId')}
                        value={receipt.client.clientId}
                      />
                      <ClientSummaryRowField
                        label={t('cab.applications.receipt.client.organizationType')}
                        value={receipt.client.organizationType}
                      />
                      <ClientSummaryRowField
                        label={t('cab.applications.receipt.client.country')}
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            <img
                              src={`https://flagcdn.com/w40/${receipt.client.countryCode.toLowerCase()}.png`}
                              alt=""
                              className="h-3.5 w-[21px] shrink-0 rounded-[2px] object-cover"
                              aria-hidden
                            />
                            {receipt.client.country}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  <div className="hidden bg-[#ececec] md:block" aria-hidden />

                  <div className="flex min-w-0 flex-col gap-3.5 md:ps-5">
                    <ClientSummaryStackField
                      label={t('cab.applications.receipt.client.legalEntityName')}
                      value={receipt.client.legalEntityName}
                    />
                    <ClientSummaryStackField
                      label={t('cab.applications.receipt.client.registrationLicenseNo')}
                      value={receipt.client.registrationLicenseNo}
                    />
                    <ClientSummaryStackField
                      label={t('cab.applications.receipt.client.industry')}
                      value={receipt.client.industry}
                    />
                  </div>
                </div>
              </section>

              <section className={cn(cardClassName, 'flex h-full min-w-0 flex-col p-5')}>
                <h2 className="mb-3 text-[16px] font-bold text-[#1a1c21]">
                  {t('cab.applications.receipt.sections.scopeOfCertification')}
                </h2>
                <p className="text-[12px] font-normal leading-[1.5] text-[#464646]">
                  {receipt.scopeSummary}
                </p>
                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-1.5 self-start rounded-[6px] border border-[#d0d5dd] bg-white px-3.5 py-2 text-[13px] font-medium text-[#1236a3] transition-colors hover:bg-[#f9fafb]"
                >
                  {t('cab.applications.receipt.actions.viewFullScope')}
                  <AppIcon icon={ExternalLinkArrowIcon} size={13} className="text-[#1236a3]" />
                </button>
              </section>
            </div>

            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
              <div className="flex min-w-0 flex-col gap-3">
                <section className="min-w-0 overflow-hidden rounded-[16px] border border-[#e8edfc] bg-[#f7f9fc] p-4 sm:p-5">
                  <div className="mb-5 flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1236a3] text-[12px] font-bold text-white">
                      !
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-bold text-[#1236a3] sm:text-[16px]">
                        {t('cab.applications.receipt.sections.nextSteps')}
                      </h2>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280] sm:text-[13px]">
                        {t('cab.applications.receipt.nextStepsDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">
                    {receipt.nextSteps.map((step, index) => (
                      <NextStepItem
                        key={step.key}
                        stepKey={step.key}
                        label={t(`cab.applications.receipt.nextStepsList.${step.key}`)}
                        status={step.status}
                        isLast={index === receipt.nextSteps.length - 1}
                      />
                    ))}
                  </div>
                </section>

                <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-[10px] border border-[#b6d0ff] bg-[#e8edfc] px-2.5 py-2 sm:px-3">
                  <AppIcon icon={MailIcon} size={14} className="shrink-0 text-[#1236a3]" />
                  <p
                    className="min-w-0 truncate whitespace-nowrap text-[9px] font-bold leading-none tracking-tight text-[#111827]"
                    title={t('cab.applications.receipt.emailConfirmation', {
                      email1: receipt.confirmationEmails[0],
                      email2: receipt.confirmationEmails[1],
                    })}
                  >
                    {t('cab.applications.receipt.emailConfirmation', {
                      email1: receipt.confirmationEmails[0],
                      email2: receipt.confirmationEmails[1],
                    })}
                  </p>
                </div>
              </div>

              <DocumentsSummaryCard receipt={receipt} />
            </div>
            </div>

            <aside className="hidden min-h-0 xl:flex xl:h-full xl:flex-col">
              <ReceiptSidebarPanels receipt={receipt} />
            </aside>

            <div className="xl:hidden">
              <ReceiptSidebarPanels receipt={receipt} />
            </div>
          </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#ececec] bg-white px-3 py-3 sm:px-6">
            <p className="text-[12px] text-[#989898]">
              {t('cab.applications.receipt.footer.copyright')}
            </p>
            <div className="flex items-center gap-4 text-[12px]">
              <Link to={ROUTES.privacyPolicy} className="text-[#1236a3] hover:underline">
                {t('cab.applications.receipt.footer.privacyPolicy')}
              </Link>
              <span className="text-[#989898]">{t('cab.applications.receipt.footer.termsOfUse')}</span>
            </div>
          </footer>
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-6 end-6 flex size-12 items-center justify-center rounded-full bg-[#1236a3] text-white shadow-lg"
        aria-label={t('cab.applications.receipt.chat')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 11.5C21 16.75 16.75 21 11.5 21C9.9 21 8.4 20.6 7.1 19.9L3 21L4.1 16.9C3.4 15.6 3 14.1 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 7.25 21 11.5Z"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </CabLayout>
  )
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9V2H18V9M6 18H4C3.45 18 3 17.55 3 17V11C3 10.45 3.45 10 4 10H20C20.55 10 21 10.45 21 11V17C21 17.55 20.55 18 20 18H18M6 14H18V22H6V14Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReceiptSidebarPanels({ receipt }: { receipt: CabApplicationReceipt }) {
  const { t } = useTranslation()

  return (
    <WorkflowProgressCard
      steps={receipt.workflowSteps.map((step) => ({
        key: step.key,
        status: step.status,
        label: t(`cab.applications.receipt.workflowSteps.${step.key}`),
        description: t(`cab.applications.receipt.workflowStepDescriptions.${step.key}`),
      }))}
      title={t('cab.applications.receipt.sections.workflowProgress')}
      viewFullLabel={t('cab.applications.receipt.actions.viewFullWorkflow')}
      statusLabels={{
        completed: t('cab.applications.receipt.workflow.completed'),
        inProgress: t('cab.applications.receipt.workflow.inProgress'),
        pending: t('cab.applications.receipt.workflow.pending'),
      }}
    />
  )
}

function DocumentsSummaryCard({ receipt }: { receipt: CabApplicationReceipt }) {
  const { t } = useTranslation()

  return (
    <section className={cn(cardClassName, 'flex h-full min-w-0 flex-col p-4 shadow-sm')}>
      <h2 className="mb-4 text-[14px] font-bold text-[#464646]">
        {t('cab.applications.receipt.sections.documentsSummary')}
      </h2>
      <div className="flex flex-1 flex-col gap-3.5">
        <DocumentRow
          label={t('cab.applications.receipt.documents.total')}
          value={receipt.documents.total}
          icon="total"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.uploaded')}
          value={receipt.documents.uploaded}
          icon="uploaded"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.pending')}
          value={receipt.documents.pending}
          icon="pending"
        />
        <DocumentRow
          label={t('cab.applications.receipt.documents.rejected')}
          value={receipt.documents.rejected}
          icon="rejected"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 h-9 w-full gap-1.5 rounded-[8px] border-[#1236a3] text-[12px] font-semibold text-[#1236a3]"
      >
        <AppIcon icon={FileTextIcon} size={14} className="text-[#1236a3]" />
        {t('cab.applications.receipt.actions.viewAllDocuments')}
      </Button>
    </section>
  )
}

function SuccessAlertCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="10" fill="#22c55e" />
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReceiptDocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6C5.45 2 5 2.45 5 3V21C5 21.55 5.45 22 6 22H18C18.55 22 19 21.55 19 21V8L14 2Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V8H19" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13H15M9 17H13" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  )
}

function UsersOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21V19C17 17.34 15.66 16 14 16H6C4.34 16 3 17.34 3 19V21M13 7C13 9.21 11.21 11 9 11C6.79 11 5 9.21 5 7C5 4.79 6.79 3 9 3C11.21 3 13 4.79 13 7ZM23 21V19C22.99 17.64 22.12 16.43 20.8 16.04M16 3.13C17.44 3.5 18.5 4.78 18.5 6.3C18.5 7.82 17.44 9.1 16 9.47"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ClipboardOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15M9 5C9 6.1 9.9 7 11 7H13C14.1 7 15 6.1 15 5M9 5C9 3.9 9.9 3 11 3H13C14.1 3 15 3.9 15 5M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function GearOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01131 9.77251C4.28062 9.5799 4.48568 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2V5M16 2V5M3 9H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocumentRow({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: 'total' | 'uploaded' | 'pending' | 'rejected'
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-medium text-[#666]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="min-w-[1ch] text-end text-[13px] font-bold text-[#464646]">{value}</span>
        {icon !== 'total' ? (
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
              icon === 'uploaded' && 'bg-[#eafaf1] text-[#22c55e]',
              icon === 'pending' && 'bg-[#fff7e6] text-[#d97706]',
              icon === 'rejected' && 'bg-[#fde8e8] text-[#e74c3c]'
            )}
            aria-hidden
          >
            {icon === 'uploaded' ? '✓' : icon === 'rejected' ? '✕' : '◷'}
          </span>
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  )
}
