import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabProfilePagesNav } from '@/components/dashboard/cab/CabProfilePagesNav'
import { CabProfileStep } from '@/components/auth/cab/setup/CabProfileStep'
import { CabLocationsStep } from '@/components/auth/cab/setup/CabLocationsStep'
import { CabAccreditationStatusStep } from '@/components/auth/cab/setup/CabAccreditationStatusStep'
import { CabAccreditationRecordsStep } from '@/components/auth/cab/setup/CabAccreditationRecordsStep'
import { CabSchemesServicesStep } from '@/components/auth/cab/setup/CabSchemesServicesStep'
import { CabScopeStep } from '@/components/auth/cab/setup/CabScopeStep'
import { CabMarksStep } from '@/components/auth/cab/setup/CabMarksStep'
import { CabCertificateStep } from '@/components/auth/cab/setup/CabCertificateStep'
import { SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { OnboardingStepTransition } from '@/components/auth/OnboardingStepTransition'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { PricingConfigSection } from '@/components/dashboard/cab/PricingConfigSection'
import { CabTaxInvoiceSection } from '@/components/dashboard/cab/CabTaxInvoiceSection'
import { AppIcon, ArrowRightIcon } from '@/components/icons'
import { useCabCompanyProfileTourSteps } from '@/config/cabCompanyProfileTourSteps'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
import {
  getCabProfile,
  saveCabSetupDraft,
  updateCabProfile,
  type CabProfile,
} from '@/lib/api/cabApi'
import { listPricingConfigs } from '@/lib/api/cabQuotationApi'
import { mapFormToCabSetupDraft, mergeCabProfileIntoForm } from '@/lib/cabSetupMapper'
import {
  CAB_PROFILE_PAGES,
  buildCabProfileIssuesMessage,
  getCabProfileCompletion,
  getCabProfilePageIssues,
  isCabProfilePage,
  type CabProfilePage,
} from '@/lib/cabProfilePages'
import {
  CAB_TAX_FIELDS,
  CAB_TAX_FIELD_IDS,
  emptyCabTaxForm,
  isCabTaxFormChanged,
  isSaudiArabia,
  mapCabProfileToTaxForm,
  mapTaxFormToPayload,
  validateCabTaxForm,
  type CabTaxField,
  type CabTaxForm,
} from '@/lib/cabTaxProfile'
import { getAuthSession } from '@/lib/authStorage'
import { emptyUnifiedOnboardingForm, type UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'
import type { CabSetupFieldIssue, CabSetupForm } from '@/lib/cabSetupForm'

/** Scrolls a field into view and focuses it (non-focusable custom fields still scroll). */
function focusField(fieldId: string) {
  const element = document.getElementById(fieldId)
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element?.focus({ preventScroll: true })
}

export function CabCompanyProfilePage() {
  const { t } = useTranslation()
  const tourSteps = useCabCompanyProfileTourSteps()
  const session = getAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState<UnifiedOnboardingForm | null>(null)
  const [cab, setCab] = useState<CabProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [pricingConfigured, setPricingConfigured] = useState(false)
  const [tax, setTax] = useState<CabTaxForm>(emptyCabTaxForm)
  const [taxErrors, setTaxErrors] = useState<Partial<Record<CabTaxField, string>>>({})
  const [pendingFocus, setPendingFocus] = useState<{ page: CabProfilePage; fieldId: string } | null>(null)

  const pageParam = searchParams.get('page')
  const pageIndex = isCabProfilePage(pageParam) ? CAB_PROFILE_PAGES.indexOf(pageParam) : 0
  const page = CAB_PROFILE_PAGES[pageIndex]
  const isLastPage = pageIndex === CAB_PROFILE_PAGES.length - 1

  const hydrate = (profile: CabProfile) => {
    setCab(profile)
    setForm(mergeCabProfileIntoForm(emptyUnifiedOnboardingForm, profile))
    setTax(mapCabProfileToTaxForm(profile))
    setTaxErrors({})
  }

  useEffect(() => {
    let cancelled = false
    getCabProfile()
      .then(({ cab: profile }) => {
        if (!cancelled) hydrate(profile)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(getUserErrorMessage(loadError, t))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  // Pricing is saved by its own section, so re-check it whenever the page changes.
  useEffect(() => {
    let cancelled = false
    listPricingConfigs()
      .then((configs) => {
        if (!cancelled) {
          setPricingConfigured(configs.some((config) => config.isActive && config.standardId === null))
        }
      })
      .catch(() => {
        if (!cancelled) setPricingConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  // Focus the field a toast linked to, once its page has rendered.
  useEffect(() => {
    if (!pendingFocus || pendingFocus.page !== page) return
    const frame = requestAnimationFrame(() => {
      focusField(pendingFocus.fieldId)
      setPendingFocus(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingFocus, page])

  const onPatch = (fields: Partial<UnifiedOnboardingForm>) => {
    setForm((prev) => (prev ? { ...prev, ...fields } : prev))
  }

  const onPatchSetup = (fields: Partial<CabSetupForm>) => {
    setForm((prev) => (prev ? { ...prev, cabSetup: { ...prev.cabSetup, ...fields } } : prev))
  }

  const pageIssues = useMemo(
    () => (form ? getCabProfilePageIssues(form)[page] : []),
    [form, page],
  )
  const completion = useMemo(
    () => (form ? getCabProfileCompletion(form, pricingConfigured) : null),
    [form, pricingConfigured],
  )
  const completedCount = completion ? CAB_PROFILE_PAGES.filter((key) => completion[key]).length : 0
  const progressPercent = Math.round((completedCount / CAB_PROFILE_PAGES.length) * 100)

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= CAB_PROFILE_PAGES.length) return
      setDirection(index > pageIndex ? 'forward' : 'back')
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('page', CAB_PROFILE_PAGES[index])
          return next
        },
        { replace: true },
      )
    },
    [pageIndex, setSearchParams],
  )

  /**
   * Saves the whole form as a draft (pricing has its own save). The tax invoice details live on
   * the identity page and go to PATCH /cab-profile, only when they changed.
   * Returns whether it succeeded.
   */
  const savePage = async (): Promise<boolean> => {
    if (!form || saving) return false
    if (page === 'pricing') return true

    if (page === 'identity') {
      const errors = validateCabTaxForm(tax, t)
      setTaxErrors(errors)
      const firstInvalid = CAB_TAX_FIELDS.find((field) => errors[field])
      if (firstInvalid) {
        toast.error(t('cab.companyProfile.tax.fixErrors'), {
          action: {
            label: t('cab.companyProfile.issues.goToField'),
            onClick: () => focusField(CAB_TAX_FIELD_IDS[firstInvalid]),
          },
        })
        return false
      }
    }

    setSaving(true)
    try {
      await saveCabSetupDraft(mapFormToCabSetupDraft(form, cab))
      if (page === 'identity' && isCabTaxFormChanged(tax, mapCabProfileToTaxForm(cab))) {
        await updateCabProfile(mapTaxFormToPayload(tax))
      }
      const { cab: profile } = await getCabProfile()
      hydrate(profile)
      return true
    } catch (saveError) {
      toast.error(getUserErrorMessage(saveError, t))
      return false
    } finally {
      setSaving(false)
    }
  }

  /** Explains what is missing in a toast, with a link that opens the page and focuses the field. */
  const raiseIssues = (target: CabProfilePage, issues: CabSetupFieldIssue[]) => {
    const [first] = issues
    toast.error(
      buildCabProfileIssuesMessage(
        issues,
        t,
        target === page ? undefined : t(`cab.companyProfile.pages.${target}.title`),
      ),
      {
        action: {
          label: t('cab.companyProfile.issues.goToField'),
          onClick: () => {
            goToPage(CAB_PROFILE_PAGES.indexOf(target))
            setPendingFocus({ page: target, fieldId: first.fieldId })
          },
        },
      },
    )
  }

  const saveAndContinue = async () => {
    if (!form || !(await savePage())) return

    if (isLastPage) {
      // Finishing checks every page, since any of them can be reached without filling the one before.
      const allIssues = getCabProfilePageIssues(form)
      const blockedPage = CAB_PROFILE_PAGES.find((key) => allIssues[key].length > 0)
      if (blockedPage) {
        raiseIssues(blockedPage, allIssues[blockedPage])
        return
      }
      toast.success(t('cab.companyProfile.saved'))
      return
    }

    if (pageIssues.length > 0) {
      raiseIssues(page, pageIssues)
      return
    }
    goToPage(pageIndex + 1)
  }

  const setupProps = form ? { form, onPatch, onPatchSetup } : null

  const navItems = CAB_PROFILE_PAGES.map((key) => ({
    key,
    label: t(`cab.companyProfile.pages.${key}.title`),
    done: completion?.[key] ?? false,
  }))

  return (
    <CabLayout tourId="cab-company-profile" tourSteps={tourSteps}>
      <CabHeader title={t('cab.companyProfile.title')} />
      <main className="cab-setup flex flex-1 flex-col gap-6 overflow-auto bg-[var(--cab-canvas)] p-6">
        <CabTourStep steps={tourSteps} stepId="cab-company-profile-header">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-bold text-[var(--cab-ink)]">{t('cab.companyProfile.title')}</h1>
              <p className="mt-1 text-[16px] text-[var(--cab-muted)]">{t('cab.companyProfile.subtitle')}</p>
            </div>
            <div className="w-full sm:max-w-[320px]">
              <div className="mb-2 flex items-baseline justify-between text-[14px] text-[var(--cab-muted)]">
                <span>{t('cab.companyProfile.progress')}</span>
                <span className="font-semibold text-primary tabular-nums">{progressPercent}%</span>
              </div>
              <div
                className="h-[6px] w-full overflow-hidden rounded-full bg-[#e5eaf2]"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </CabTourStep>

        {loading ? (
          <p className="text-[14px] text-[var(--cab-muted)]">{t('common.loading')}</p>
        ) : !form || !setupProps ? (
          <p className="text-[14px] text-error-500">{error ?? t('errors.generic')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <CabTourStep steps={tourSteps} stepId="cab-company-profile-steps">
              <CabProfilePagesNav
                items={navItems}
                currentIndex={pageIndex}
                onSelect={goToPage}
                ariaLabel={t('cab.companyProfile.pagesLabel')}
                className="xl:sticky xl:top-0 xl:self-start"
              />
            </CabTourStep>

            <div className="flex min-w-0 flex-col gap-5">
              <CabTourStep steps={tourSteps} stepId="cab-company-profile-body">
                {/* The step transition makes its own stacking context, which would trap an open dropdown under
                    the sticky action bar. While one is open, lift the whole card above the bar. */}
                <section className="relative rounded-[var(--radius-md)] border border-[var(--cab-border)] bg-white p-4 has-[[aria-expanded=true]]:z-20 sm:p-6">
                  <OnboardingStepTransition key={page} direction={direction}>
                    <header className="mb-6 border-b border-[var(--cab-hairline)] pb-4">
                      <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-primary">
                        {t('cab.companyProfile.pageOf', {
                          current: pageIndex + 1,
                          total: CAB_PROFILE_PAGES.length,
                        })}
                      </p>
                      <h2 className="mt-1 text-[20px] font-bold text-[var(--cab-ink)]">
                        {t(`cab.companyProfile.pages.${page}.title`)}
                      </h2>
                      <p className="mt-1 text-[14px] text-[var(--cab-muted)]">
                        {t(`cab.companyProfile.pages.${page}.hint`)}
                      </p>
                    </header>

                    {page === 'identity' && (
                      <div className="space-y-6">
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
                          <p className="mt-3 text-[12px] text-[var(--cab-muted)]">
                            {t('cab.companyProfile.accountNote')}
                          </p>
                        </SetupSection>
                        <CabProfileStep {...setupProps} />
                        <CabTaxInvoiceSection
                          value={tax}
                          onChange={setTax}
                          errors={taxErrors}
                          vatRequired={isSaudiArabia(form.country)}
                        />
                      </div>
                    )}
                    {page === 'locations' && <CabLocationsStep {...setupProps} />}
                    {page === 'accreditationStatus' && <CabAccreditationStatusStep {...setupProps} />}
                    {page === 'accreditationRecords' && <CabAccreditationRecordsStep {...setupProps} />}
                    {page === 'schemes' && <CabSchemesServicesStep {...setupProps} />}
                    {page === 'scope' && <CabScopeStep {...setupProps} />}
                    {page === 'pricing' && <PricingConfigSection />}
                    {page === 'marks' && <CabMarksStep {...setupProps} />}
                    {page === 'certificate' && <CabCertificateStep {...setupProps} />}
                  </OnboardingStepTransition>
                </section>
              </CabTourStep>

              <CabTourStep steps={tourSteps} stepId="cab-company-profile-actions">
                <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--cab-border)] bg-white/95 p-3 backdrop-blur-sm sm:p-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => goToPage(pageIndex - 1)}
                    disabled={pageIndex === 0 || saving}
                    className="min-w-[120px]"
                    icon={
                      <span className="inline-flex -scale-x-100">
                        <AppIcon icon={ArrowRightIcon} size={20} />
                      </span>
                    }
                  >
                    {t('common.back')}
                  </Button>

                  <span className="hidden text-[14px] text-[var(--cab-muted)] sm:block">
                    {isLastPage
                      ? t('cab.companyProfile.lastPageHint')
                      : t('cab.companyProfile.nextHint', {
                          page: t(`cab.companyProfile.pages.${CAB_PROFILE_PAGES[pageIndex + 1]}.title`),
                        })}
                  </span>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void saveAndContinue()}
                    disabled={saving}
                    className="min-w-[180px]"
                    iconPosition="end"
                    icon={!isLastPage && !saving ? <AppIcon icon={ArrowRightIcon} size={20} /> : undefined}
                  >
                    {saving
                      ? t('common.saving')
                      : isLastPage
                        ? t('cab.companyProfile.finish')
                        : t('cab.companyProfile.saveNext')}
                  </Button>
                </div>
              </CabTourStep>
            </div>
          </div>
        )}
      </main>
    </CabLayout>
  )
}
