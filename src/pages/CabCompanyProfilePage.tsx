import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabProfileStep } from '@/components/auth/cab/setup/CabProfileStep'
import { CabLocationsStep } from '@/components/auth/cab/setup/CabLocationsStep'
import { CabAccreditationStatusStep } from '@/components/auth/cab/setup/CabAccreditationStatusStep'
import { CabAccreditationRecordsStep } from '@/components/auth/cab/setup/CabAccreditationRecordsStep'
import { CabSchemesServicesStep } from '@/components/auth/cab/setup/CabSchemesServicesStep'
import { CabScopeStep } from '@/components/auth/cab/setup/CabScopeStep'
import { CabMarksStep } from '@/components/auth/cab/setup/CabMarksStep'
import { CabCertificateStep } from '@/components/auth/cab/setup/CabCertificateStep'
import { SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui'
import { ApiError } from '@/lib/api/client'
import {
  getCabProfile,
  saveCabSetupDraft,
  type CabProfile,
} from '@/lib/api/cabApi'
import { mapFormToCabSetupDraft, mergeCabProfileIntoForm } from '@/lib/cabSetupMapper'
import { getAuthSession } from '@/lib/authStorage'
import { emptyUnifiedOnboardingForm, type UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'
import type { CabSetupForm } from '@/lib/cabSetupForm'
import { cn } from '@/lib/utils'

const PROFILE_SECTIONS = [
  'profile',
  'locations',
  'accreditationStatus',
  'accreditationRecords',
  'schemes',
  'scope',
  'marks',
  'certificate',
] as const

export function CabCompanyProfilePage() {
  const { t } = useTranslation()
  const session = getAuthSession()
  const [form, setForm] = useState<UnifiedOnboardingForm | null>(null)
  const [cab, setCab] = useState<CabProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const hydrate = (profile: CabProfile) => {
    setCab(profile)
    setForm(mergeCabProfileIntoForm(emptyUnifiedOnboardingForm, profile))
  }

  useEffect(() => {
    let cancelled = false
    getCabProfile()
      .then(({ cab: profile }) => {
        if (!cancelled) hydrate(profile)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof ApiError ? loadError.message : t('errors.generic'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const onPatch = (fields: Partial<UnifiedOnboardingForm>) => {
    setForm((prev) => (prev ? { ...prev, ...fields } : prev))
    setSuccess(null)
  }

  const onPatchSetup = (fields: Partial<CabSetupForm>) => {
    setForm((prev) => (prev ? { ...prev, cabSetup: { ...prev.cabSetup, ...fields } } : prev))
    setSuccess(null)
  }

  const save = async () => {
    if (!form || saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await saveCabSetupDraft(mapFormToCabSetupDraft(form, cab))
      const { cab: profile } = await getCabProfile()
      hydrate(profile)
      setSuccess(t('cab.companyProfile.saved'))
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  const setupProps = form
    ? { form, onPatch, onPatchSetup }
    : null

  return (
    <CabLayout>
      <CabHeader title={t('cab.companyProfile.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-8 overflow-auto bg-[var(--cab-canvas)] p-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--cab-ink)]">{t('cab.companyProfile.title')}</h1>
          <p className="mt-1 text-[16px] text-[var(--cab-muted)]">{t('cab.companyProfile.subtitle')}</p>
        </div>

        {loading ? (
          <p className="text-[14px] text-[var(--cab-muted)]">{t('common.loading')}</p>
        ) : !form || !setupProps ? (
          <p className="text-[14px] text-error-500">{error ?? t('errors.generic')}</p>
        ) : (
          <>
            <SetupSection title={t('cab.companyProfile.sections.account')}>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <TextField
                  id="cab-profile-email"
                  label={t('cab.companyProfile.email')}
                  type="email"
                  value={session?.user?.email ?? ''}
                  disabled
                />
                <TextField
                  id="cab-profile-phone"
                  label={t('cab.companyProfile.phone')}
                  type="text"
                  value={session?.user?.phone ?? ''}
                  disabled
                />
              </div>
              <p className="mt-3 text-[12px] text-[var(--cab-muted)]">{t('cab.companyProfile.accountNote')}</p>
            </SetupSection>

            {PROFILE_SECTIONS.map((section) => (
              <section key={section} className="space-y-4">
                <div>
                  <h2 className="text-[20px] font-bold text-[var(--cab-ink)]">
                    {t(`cab.setup.${section}.title`)}
                  </h2>
                  <p className="mt-1 text-[14px] text-[var(--cab-muted)]">
                    {t(`cab.setup.${section}.subtitle`)}
                  </p>
                </div>
                {section === 'profile' && <CabProfileStep {...setupProps} />}
                {section === 'locations' && <CabLocationsStep {...setupProps} />}
                {section === 'accreditationStatus' && <CabAccreditationStatusStep {...setupProps} />}
                {section === 'accreditationRecords' && <CabAccreditationRecordsStep {...setupProps} />}
                {section === 'schemes' && <CabSchemesServicesStep {...setupProps} />}
                {section === 'scope' && <CabScopeStep {...setupProps} />}
                {section === 'marks' && <CabMarksStep {...setupProps} />}
                {section === 'certificate' && <CabCertificateStep {...setupProps} />}
              </section>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={cn('text-[14px]', error ? 'text-error-500' : 'text-[#26a65b]')}>
                {error ?? success}
              </p>
              <Button variant="primary" size="lg" onClick={() => void save()} disabled={saving} className="min-w-[180px]">
                {saving ? t('common.saving') : t('cab.companyProfile.save')}
              </Button>
            </div>
          </>
        )}
      </main>
    </CabLayout>
  )
}
