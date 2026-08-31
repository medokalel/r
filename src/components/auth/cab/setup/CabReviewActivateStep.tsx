import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupNote } from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  isAccreditationRecordsStepComplete,
  isCertificateStepComplete,
  isKeyRolesStepComplete,
  isLocationsStepComplete,
  isMarksStepComplete,
  isProfileStepComplete,
  isSchemesStepComplete,
  isScopeStepComplete,
  requiresAccreditationRecords,
} from '@/lib/cabSetupForm'
import { cn } from '@/lib/utils'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

type RowStatus = 'READY' | 'REVIEW' | 'MISSING'

interface ReviewRow {
  key: string
  label: string
  detail: string
  status: RowStatus
  step: number
}

interface CabReviewActivateStepProps {
  form: UnifiedOnboardingForm
  /** Jumps back to the step a row belongs to. */
  onGoToStep: (step: number) => void
}

const STATUS_STYLES: Record<RowStatus, string> = {
  READY: 'bg-[#effcf7] text-[#26a65b]',
  REVIEW: 'bg-[#fff8e8] text-[#8a5a00]',
  MISSING: 'bg-[#fde8e8] text-error-500',
}

export function CabReviewActivateStep({ form, onGoToStep }: CabReviewActivateStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup

  const rows = useMemo<ReviewRow[]>(() => {
    const profileReady = isProfileStepComplete(setup, form.legalEntityName)
    const locationsReady = isLocationsStepComplete(
      setup,
      form.country,
      form.city,
      form.address,
      form.languages
    )
    const recordsReady = isAccreditationRecordsStepComplete(setup)
    const schemesReady = isSchemesStepComplete(setup)
    const scopeReady = isScopeStepComplete(setup)
    const marksReady = isMarksStepComplete(setup)
    const certificateReady = isCertificateStepComplete(setup)
    const rolesReady = isKeyRolesStepComplete(setup)

    const branchCount = setup.hasAdditionalLocations ? setup.locations.length : 0
    const schemeCount = setup.schemes.length + setup.customSchemes.filter((s) => s.name.trim()).length
    const pendingInvites = setup.roleInvites.filter((invite) => invite.status === 'INVITE').length

    return [
      {
        key: 'identity',
        label: t('cab.setup.review.rows.identity'),
        detail: form.legalEntityName.trim() || t('cab.setup.review.notProvided'),
        status: profileReady ? 'READY' : 'MISSING',
        step: 2,
      },
      {
        key: 'locations',
        label: t('cab.setup.review.rows.locations'),
        detail: t('cab.setup.review.locationsDetail', { count: branchCount }),
        status: locationsReady ? 'READY' : 'MISSING',
        step: 3,
      },
      {
        key: 'accreditation',
        label: t('cab.setup.review.rows.accreditation'),
        detail: requiresAccreditationRecords(setup)
          ? t('cab.setup.review.accreditationDetail', { count: setup.accreditationRecords.length })
          : t('cab.setup.review.unaccredited'),
        status: recordsReady ? 'READY' : 'MISSING',
        step: 5,
      },
      {
        key: 'schemes',
        label: t('cab.setup.review.rows.schemes'),
        // Two independent counts, so pluralize each fragment separately.
        detail: [
          t('cab.setup.review.schemesCount', { count: schemeCount }),
          t('cab.setup.review.scopesCount', { count: setup.scopes.length }),
        ].join(' • '),
        // Schemes are mandatory to activate; unmapped scopes only warrant a review.
        status: !schemesReady ? 'MISSING' : scopeReady ? 'READY' : 'REVIEW',
        step: 6,
      },
      {
        key: 'marks',
        label: t('cab.setup.review.rows.marks'),
        detail: marksReady && certificateReady
          ? t('cab.setup.review.configured')
          : t('cab.setup.review.needsAttention'),
        status: marksReady && certificateReady ? 'READY' : 'REVIEW',
        step: 8,
      },
      {
        key: 'roles',
        label: t('cab.setup.review.rows.roles'),
        detail: pendingInvites > 0
          ? t('cab.setup.review.rolesDetail', { count: pendingInvites })
          : t('cab.setup.review.rolesNone'),
        status: !rolesReady ? 'MISSING' : pendingInvites > 0 ? 'REVIEW' : 'READY',
        step: 10,
      },
    ]
  }, [form.address, form.city, form.country, form.languages, form.legalEntityName, setup, t])

  return (
    <div className="w-full space-y-6">

      <div className="overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-white">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => onGoToStep(row.step)}
            className="flex w-full items-center justify-between gap-4 border-b border-neutral-200 px-4 py-4 text-start transition-colors last:border-b-0 hover:bg-neutral-50"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[var(--cab-ink)]">{row.label}</p>
              <p className="truncate text-[12px] text-[var(--cab-muted)]">{row.detail}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-[12px] font-medium',
                STATUS_STYLES[row.status]
              )}
            >
              {t(`cab.setup.review.status.${row.status}`)}
            </span>
          </button>
        ))}
      </div>

      <SetupNote>{t('cab.setup.review.nextStepNote')}</SetupNote>
    </div>
  )
}
