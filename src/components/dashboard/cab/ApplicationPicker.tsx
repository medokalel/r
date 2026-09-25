import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  listCabApplications,
  type ApplicationRegisterItem,
  type ApplicationRegisterStatus,
} from '@/lib/api/cabApplicationRegisterApi'

const STATUS_LABEL_KEYS: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

interface ApplicationPickerProps {
  title: string
  hint: string
  actionLabel: string
  allowedStatuses?: ApplicationRegisterStatus[]
  extraAction?: { label: string; onClick: () => void }
  onSelect: (application: ApplicationRegisterItem) => void
}

export function ApplicationPicker({
  title,
  hint,
  actionLabel,
  allowedStatuses,
  extraAction,
  onSelect,
}: ApplicationPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [applications, setApplications] = useState<ApplicationRegisterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const statusFilter = allowedStatuses?.join(',') ?? ''

  useEffect(() => {
    let cancelled = false
    listCabApplications()
      .then((items) => {
        if (cancelled) return
        const filtered = allowedStatuses?.length
          ? items.filter((item) => allowedStatuses.includes(item.status))
          : items
        setApplications(filtered)
      })
      .catch(() => {
        if (!cancelled) setError(t('cab.applicationRegister.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [statusFilter, t])

  const options = useMemo(
    () =>
      applications.map((application) => ({
        value: application.id,
        label: `${application.applicationCode} — ${application.clientName} (${t(
          `cab.applicationRegister.status.${STATUS_LABEL_KEYS[application.status]}`,
        )})`,
      })),
    [applications, t],
  )

  const selected = applications.find((application) => application.id === selectedId)

  return (
    <section className="mx-auto w-full max-w-[640px] rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
      <h2 className="text-[20px] font-semibold text-neutral-900">{title}</h2>
      <p className="mb-5 mt-1 text-[14px] text-neutral-500">{hint}</p>

      <SearchableSelect
        value={selectedId}
        onChange={setSelectedId}
        options={options}
        placeholder={t('cab.applicationRegister.selectPlaceholder')}
        searchPlaceholder={t('cab.applicationRegister.filters.searchPlaceholder')}
        disabled={loading || applications.length === 0}
      />

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-error-500">
          {error}
        </p>
      )}
      {!loading && applications.length === 0 && !error && (
        <p className="mt-3 text-[13px] text-neutral-500">{t('cab.applicationRegister.empty')}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate('/cab/applications')}>
          {t('cab.applicationSubmission.backToRegister')}
        </Button>
        <Button variant="primary" disabled={!selected} onClick={() => selected && onSelect(selected)}>
          {actionLabel}
        </Button>
        {extraAction && (
          <Button variant="outline" onClick={extraAction.onClick}>
            {extraAction.label}
          </Button>
        )}
      </div>
    </section>
  )
}
