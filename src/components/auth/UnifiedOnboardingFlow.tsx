import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthStepActions } from '@/components/auth/AuthStepActions'
import { OnboardingFlowShell } from '@/components/auth/OnboardingFlowShell'
import { OrgScopeTypeStep } from '@/components/auth/OrgScopeTypeStep'
import { OnboardingModulesStep } from '@/components/auth/OnboardingModulesStep'
import { AbOrgDetailsStep } from '@/components/auth/ab/AbOrgDetailsStep'
import { AbLocationStep } from '@/components/auth/ab/AbLocationStep'
import { AbBrandingStep } from '@/components/auth/ab/AbBrandingStep'
import { CabOrgDetailsStep } from '@/components/auth/cab/CabOrgDetailsStep'
import { CabLocationStep } from '@/components/auth/cab/CabLocationStep'
import { CabAccreditationBodyStep } from '@/components/auth/cab/CabAccreditationBodyStep'
import { CabBrandingStep } from '@/components/auth/cab/CabBrandingStep'
import { AuditeeOrgDetailsStep } from '@/components/auth/auditee/AuditeeOrgDetailsStep'
import { AuditeeLocationStep } from '@/components/auth/auditee/AuditeeLocationStep'
import { AuditeeBrandingStep } from '@/components/auth/auditee/AuditeeBrandingStep'
import { OnboardingSummaryStep } from '@/components/auth/OnboardingSummaryStep'
import { saveOrganizationProfile } from '@/lib/api/organizationProfileApi'
import { ApiError } from '@/lib/api/client'
import { completePendingRegistration } from '@/lib/completePendingRegistration'
import { clearPendingRegistration, hasPendingRegistration } from '@/lib/pendingRegistrationStorage'
import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import type { OrganizationType } from '@/lib/api/authApi'
import { getAuthSession, getAuthToken, patchAuthOrganizationType } from '@/lib/authStorage'
import { loadOnboardingDraft, saveOnboardingDraft } from '@/lib/onboardingDraftStorage'
import { mapOrgScopeToBackendType } from '@/lib/orgScopeBackendMapping'
import { markOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'
import type { EntityType } from '@/lib/entityTypes'
import {
  emptyUnifiedOnboardingForm,
  isAccreditationBodyStepComplete,
  isBrandingStepComplete,
  isLocationStepComplete,
  isModulesStepComplete,
  isOrgDetailsStepComplete,
  isOrgTypeStepComplete,
  syncCabTypeFromScopeAreas,
  syncAbTypeFromScopeAreas,
  scopeCategoryToEntityType,
  type UnifiedOnboardingForm,
} from '@/lib/unifiedOnboardingForm'

function syncBackendOrganizationType(scopeCategory: OrgScopeCategory): OrganizationType {
  const backendType = mapOrgScopeToBackendType(scopeCategory)
  patchAuthOrganizationType(backendType)
  return backendType
}

function isCabEntity(entityType: EntityType | '') {
  return entityType === 'CERTIFICATION_BODY'
}

function getBrandingStep(entityType: EntityType | '') {
  return isCabEntity(entityType) ? 6 : 5
}

function getSummaryStep(entityType: EntityType | '') {
  return getBrandingStep(entityType) + 1
}

function getSuccessStep(entityType: EntityType | '') {
  return getBrandingStep(entityType) + 2
}

function createInitialForm(): UnifiedOnboardingForm {
  const organizationId = getAuthSession()?.organization?.id
  const draft = organizationId ? loadOnboardingDraft(organizationId) : null
  const scopeCategory = draft?.scopeCategory ?? ''
  const entityType =
    scopeCategory !== ''
      ? scopeCategoryToEntityType(scopeCategory as OrgScopeCategory)
      : draft?.entityType || getAuthSession()?.organization?.type || ''

  return {
    ...emptyUnifiedOnboardingForm,
    ...draft,
    entityType,
    scopeCategory,
    scopeAreas: draft?.scopeAreas ?? [],
    modules: draft?.modules ?? [],
    cabType: draft?.cabType ?? draft?.scopeAreas ?? [],
    abType: draft?.abType ?? draft?.scopeAreas ?? [],
    logoUrl: draft?.logoUrl ?? null,
  }
}

export function UnifiedOnboardingFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<UnifiedOnboardingForm>(createInitialForm)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  /** True when the user was already logged in before this onboarding session started. */
  const hadAuthAtStartRef = useRef(Boolean(getAuthToken()))

  const organizationId = getAuthSession()?.organization?.id

  useEffect(() => {
    if (getAuthToken()) {
      clearPendingRegistration()
    }
  }, [])

  useEffect(() => {
    if (!organizationId) return
    saveOnboardingDraft(organizationId, form)
  }, [form, organizationId])

  const patch = (fields: Partial<UnifiedOnboardingForm>) => {
    setForm((prev) => {
      const next = { ...prev, ...fields }

      if ('scopeCategory' in fields) {
        next.entityType = fields.scopeCategory
          ? mapOrgScopeToBackendType(fields.scopeCategory)
          : ''
      }

      next.cabType = syncCabTypeFromScopeAreas(next)
      next.abType = syncAbTypeFromScopeAreas(next)

      return next
    })

    if (fields.scopeCategory) {
      syncBackendOrganizationType(fields.scopeCategory)
    }
  }

  const finishOnboarding = (entityType: EntityType | '') => {
    const orgId = getAuthSession()?.organization?.id
    if (orgId) markOnboardingComplete(orgId)
    setStep(getSuccessStep(entityType))
  }

  const handleFinish = async () => {
    if (isSaving || !form.entityType || !form.scopeCategory) return

    if (!getAuthToken()) {
      setSaveError(t('onboarding.shared.errors.loginRequired'))
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // Persist only fields shared with the legacy registration flow.
      // All newer onboarding-only fields remain in the local draft.
      await saveOrganizationProfile({
        profile: {
          organizationName: form.legalEntityName,
        },
        address: {
          country: form.country,
          city: form.city,
          street: form.address,
        },
      })

      finishOnboarding(form.entityType)
    } catch (error) {
      // Existing accounts (logged in before onboarding) should not be blocked
      // if profile save fails — they can update details later in company profile.
      if (hadAuthAtStartRef.current && getAuthToken()) {
        finishOnboarding(form.entityType)
        return
      }

      if (error instanceof ApiError && error.status === 401) {
        setSaveError(t('onboarding.shared.errors.loginRequired'))
        return
      }

      setSaveError(error instanceof ApiError ? error.message : t('errors.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    const summaryStep = getSummaryStep(form.entityType)
    if (step === summaryStep) {
      void handleFinish()
      return
    }

    if (step === 1 && hasPendingRegistration() && !getAuthToken()) {
      if (isSaving || !isOrgTypeStepComplete(form) || !form.scopeCategory) return
      setIsSaving(true)
      setSaveError(null)
      try {
        const entityType = mapOrgScopeToBackendType(form.scopeCategory)
        await completePendingRegistration(entityType)
        setStep(2)
      } catch {
        setSaveError(t('errors.generic'))
      } finally {
        setIsSaving(false)
      }
      return
    }

    setStep((current) => current + 1)
  }

  const handleBack = () => {
    if (step <= 1) return
    setStep((current) => current - 1)
  }

  const brandingStep = getBrandingStep(form.entityType)
  const summaryStep = getSummaryStep(form.entityType)

  const nextDisabled =
    step === 1
      ? !isOrgTypeStepComplete(form) || isSaving
      : step === 2
        ? !isOrgDetailsStepComplete(form)
        : step === 3
          ? !isModulesStepComplete(form)
          : step === 4
            ? !isLocationStepComplete(form)
            : step === 5 && isCabEntity(form.entityType)
              ? !isAccreditationBodyStepComplete(form)
              : step === brandingStep
                ? !isBrandingStepComplete(form)
                : step === summaryStep
                  ? isSaving
                  : false

  const orgDisplayName = form.tradingName || form.legalEntityName
  const successStep = getSuccessStep(form.entityType)

  const renderDetailsAndBeyond = () => {
    if (form.entityType === 'CERTIFICATION_BODY') {
      return (
        <>
          {step === 2 && <CabOrgDetailsStep form={form} onPatch={patch} />}
          {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
          {step === 4 && <CabLocationStep form={form} onPatch={patch} />}
          {step === 5 && <CabAccreditationBodyStep form={form} onPatch={patch} />}
          {step === 6 && <CabBrandingStep form={form} onPatch={patch} />}
          {step === 7 && <OnboardingSummaryStep form={form} />}
        </>
      )
    }

    if (form.entityType === 'ACCREDITATION_BODY') {
      return (
        <>
          {step === 2 && <AbOrgDetailsStep form={form} onPatch={patch} />}
          {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
          {step === 4 && <AbLocationStep form={form} onPatch={patch} />}
          {step === 5 && <AbBrandingStep form={form} onPatch={patch} />}
          {step === 6 && <OnboardingSummaryStep form={form} />}
        </>
      )
    }

    if (form.entityType === 'CONSULTATION_BODY') {
      return (
        <>
          {step === 2 && <AuditeeOrgDetailsStep form={form} onPatch={patch} />}
          {step === 3 && <OnboardingModulesStep form={form} onPatch={patch} />}
          {step === 4 && <AuditeeLocationStep form={form} onPatch={patch} />}
          {step === 5 && <AuditeeBrandingStep form={form} onPatch={patch} />}
          {step === 6 && <OnboardingSummaryStep form={form} />}
        </>
      )
    }

    return null
  }

  return (
    <OnboardingFlowShell
      step={step}
      introStep={0}
      successStep={successStep}
      firstFormStep={1}
      lastFormStep={summaryStep}
      wideSteps={[1, 3]}
      brandingStep={brandingStep}
      intro={{
        title: t('onboarding.shared.intro.title'),
        description: t('onboarding.shared.intro.description'),
        estimatedTimeLabel: t('onboarding.shared.intro.estimatedTimeLabel'),
        estimatedTimeValue: t('onboarding.shared.intro.estimatedTimeValue'),
        estimatedTimeDescription: t('onboarding.shared.intro.estimatedTimeDescription'),
        howItWorksLabel: t('onboarding.shared.intro.howItWorksLabel'),
        howItWorksValue: t('onboarding.shared.intro.howItWorksValue'),
        cta: t('onboarding.shared.intro.cta'),
      }}
      onIntroStart={() => setStep(1)}
      success={{
        title: t('onboarding.shared.success.title'),
        description: t('onboarding.shared.success.description', { name: orgDisplayName }),
        back: t('onboarding.shared.success.back'),
        cta: t('onboarding.shared.success.cta'),
      }}
      onSuccessBack={() => setStep(summaryStep)}
      onSuccessContinue={() =>
        navigate(
          form.entityType === 'CERTIFICATION_BODY'
            ? ROUTES.cabDashboard
            : form.entityType === 'ACCREDITATION_BODY'
              ? ROUTES.abDashboard
              : ROUTES.dashboard
        )
      }
      error={
        saveError && (step === 1 || step === summaryStep) ? (
          <p className="text-small-light text-error-500 mt-4">{saveError}</p>
        ) : null
      }
      actions={
        step >= 1 && step <= summaryStep ? (
          <AuthStepActions
            className="ms-auto mt-6 w-full sm:max-w-[328px]"
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={
              step === 1 && isSaving
                ? t('register.creatingAccount')
                : step === summaryStep && isSaving
                  ? t('common.saving')
                  : t('common.next')
            }
            nextDisabled={nextDisabled}
            showBack={step > 1}
          />
        ) : null
      }
    >
      {step === 1 && <OrgScopeTypeStep form={form} onPatch={patch} />}
      {step >= 2 && renderDetailsAndBeyond()}
    </OnboardingFlowShell>
  )
}
