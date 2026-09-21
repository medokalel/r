import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { FormField, MultiSelect, RadioGroup, TextField, Textarea } from '@/components/ui'
import { BasicDataCard } from '@/components/dashboard/companyProfile/BasicDataCard'
import { AddressStep } from '@/components/dashboard/companyProfile/steps'
import { BranchFormFields } from '@/components/dashboard/companyProfile/BranchFormFields'
import {
  ProfileFormContext,
  useProfileForm,
} from '@/components/dashboard/companyProfile/ProfileFormContext'
import { ProfileLoadingSkeleton } from '@/components/dashboard/companyProfile/ProfileLoadingSkeleton'
import { Stepper } from '@/components/dashboard/companyProfile/Primitives'
import {
  DOC_ACCEPT,
  DOC_MAX_BYTES,
  SECTOR_OPTIONS,
  profileCardClassName,
} from '@/components/dashboard/companyProfile/constants'
import {
  branchPayloadFrom,
  formValuesFromProfile,
  payloadFromForm,
} from '@/components/dashboard/companyProfile/mappers'
import {
  EMPTY_BRANCH_FORM,
  EMPTY_PROFILE_FORM,
  STEPS,
  type BranchFormValues,
  type ProfileFormValues,
  type ProfileNotification,
  type StepKey,
} from '@/components/dashboard/companyProfile/types'
import {
  isAddressComplete,
  isBranchFormComplete,
} from '@/components/dashboard/companyProfile/validation'
import {
  createCabClientBranch,
  getCabClientProfile,
  saveCabClientCompanyProfile,
  submitCabClientProfile,
  uploadCabClientDocument,
} from '@/lib/api/clientRegistrationApi'
import type {
  OrgBranch,
  OrgDocument,
  OrgDocumentType,
} from '@/lib/api/organizationProfileApi'
import { ApiError } from '@/lib/api/client'
import { ROUTES } from '@/lib/routes'
import { formatFileSize } from '@/lib/files'
import type { CountryCode } from '@/components/auth/CountryCodeSelect'

const DOCUMENT_TYPES: Array<{ type: OrgDocumentType; key: string; required?: boolean }> = [
  { type: 'COMMERCIAL_REGISTER', key: 'commercialRegistry', required: true },
  { type: 'NATIONAL_ADDRESS_CERTIFICATE', key: 'nationalAddress' },
  { type: 'ACTIVITY_LICENSE', key: 'activityLicense' },
  { type: 'TAX_CARD', key: 'taxCard' },
  { type: 'OTHER', key: 'other' },
]

function isBasicProfileComplete(form: ProfileFormValues): boolean {
  return Boolean(
    form.organizationName.trim() &&
      form.tradeName.trim() &&
      form.commercialRegisterNumber.trim() &&
      form.unifiedNumber.trim() &&
      form.authorizedPersonName.trim() &&
      form.email.trim() &&
      form.phoneNumber.trim() &&
      form.organizationStatus &&
      form.registrationDate &&
      form.employeeCount !== '' &&
      form.industries.length > 0 &&
      (form.allProductionLinesActive || form.inactiveReason.trim())
  )
}

function isNationalAddressComplete(form: ProfileFormValues): boolean {
  const address = form.nationalAddress
  if (!address.hasNationalAddress) return true
  return Boolean(
    address.certificateNumber.trim() &&
      address.issueDate &&
      address.expiryDate &&
      address.street.trim() &&
      address.buildingNumber.trim() &&
      address.district.trim() &&
      address.postalCode.trim() &&
      address.city.trim()
  )
}

function CabBasicDataStep() {
  const { t } = useTranslation()
  const { form, update } = useProfileForm()
  return (
    <div className="space-y-5">
      <div className={profileCardClassName}>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.profileHeader.companySummaryLabel')}>
            <Textarea
              value={form.companySummary}
              onChange={(event) => update('companySummary', event.target.value)}
              placeholder={t('companyProfile.profileHeader.companySummaryPlaceholder')}
              readOnly
              className="cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] text-neutral-400"
              rows={4}
            />
          </FormField>
          <FormField label={t('companyProfile.profileHeader.industrySectorLabel')} required>
            <MultiSelect
              tags={form.industries}
              options={SECTOR_OPTIONS}
              onChange={(industries) => update('industries', industries)}
            />
          </FormField>
          <FormField label={t('cab.clientCompanyProfile.logoUrl', 'Logo URL')}>
            <TextField
              type="url"
              value={form.logoUrl ?? ''}
              onChange={(event) => update('logoUrl', event.target.value || null)}
              placeholder="https://example.com/logo.png"
            />
          </FormField>
          <FormField
            label={t(
              'cab.clientCompanyProfile.productionLines',
              'Are all production lines active?'
            )}
            required
          >
            <RadioGroup
              name="allProductionLinesActive"
              value={form.allProductionLinesActive ? 'yes' : 'no'}
              onChange={(value) => update('allProductionLinesActive', value === 'yes')}
              options={[
                { value: 'yes', label: t('common.yes', 'Yes') },
                { value: 'no', label: t('common.no', 'No') },
              ]}
            />
          </FormField>
          {!form.allProductionLinesActive && (
            <FormField
              label={t('cab.clientCompanyProfile.inactiveReason', 'Inactive reason')}
              required
            >
              <Textarea
                value={form.inactiveReason}
                onChange={(event) => update('inactiveReason', event.target.value)}
                rows={3}
              />
            </FormField>
          )}
        </div>
      </div>
      <BasicDataCard identityReadOnly />
    </div>
  )
}

function CabBranchesStep({
  clientId,
  branches,
  refresh,
  notify,
  handleError,
}: {
  clientId: string
  branches: OrgBranch[]
  refresh: () => Promise<void>
  notify: (notification: ProfileNotification) => void
  handleError: (error: unknown) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<BranchFormValues>(EMPTY_BRANCH_FORM)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))
  const countryCode: CountryCode = form.countryCode ?? 'SA'

  const saveBranch = async () => {
    setSaving(true)
    try {
      await createCabClientBranch(clientId, branchPayloadFrom(form, countryCode))
      await refresh()
      setForm(EMPTY_BRANCH_FORM)
      notify({ type: 'success', message: t('companyProfile.messages.branchSaved') })
    } catch (error) {
      handleError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className={profileCardClassName}>
        <h3 className="text-[18px] font-semibold text-primary">
          {t('companyProfile.addBranch.title')}
        </h3>
        <BranchFormFields form={form} set={set} countryCode={countryCode} />
        <Button
          variant="primary"
          size="lg"
          onClick={saveBranch}
          disabled={saving || !isBranchFormComplete(form)}
        >
          {saving ? t('common.loading') : t('companyProfile.addBranch.saveButton')}
        </Button>
      </div>
      <div className={profileCardClassName}>
        <h3 className="text-[18px] font-semibold text-primary">
          {t('companyProfile.branchesCard.title')}
        </h3>
        {branches.length === 0 ? (
          <p className="text-[14px] text-neutral-500">
            {t('companyProfile.branchesCard.empty', 'No branches added. Branches are optional.')}
          </p>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="rounded-[10px] border border-[#ececec] p-4">
                <p className="font-semibold text-neutral-900">{branch.branchName}</p>
                <p className="mt-1 text-[13px] text-neutral-500">{branch.address}</p>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {branch.commercialRegisterNumber} · {branch.branchType}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CabDocumentsStep({
  clientId,
  documents,
  refresh,
  notify,
  handleError,
}: {
  clientId: string
  documents: OrgDocument[]
  refresh: () => Promise<void>
  notify: (notification: ProfileNotification) => void
  handleError: (error: unknown) => void
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState<OrgDocumentType | null>(null)

  const upload = async (type: OrgDocumentType, file: File) => {
    if (file.size > DOC_MAX_BYTES) {
      notify({ type: 'error', message: t('validation.fileTooLarge', { size: 10 }) })
      return
    }
    setUploading(type)
    try {
      await uploadCabClientDocument(clientId, type, file)
      await refresh()
      notify({ type: 'success', message: t('companyProfile.messages.documentUploaded') })
    } catch (error) {
      handleError(error)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className={profileCardClassName}>
      <h3 className="text-[18px] font-semibold text-primary">
        {t('companyProfile.officialDocs.title')}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCUMENT_TYPES.map(({ type, key, required }) => {
          const uploaded = documents.filter((document) => document.documentType === type)
          return (
            <div key={type} className="rounded-[10px] border border-dashed border-primary/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">
                  {key === 'other'
                    ? t('companyProfile.officialDocs.otherDocsTitle')
                    : t(`companyProfile.officialDocs.docs.${key}`)}
                  {required && <span className="ms-1 text-error-500">*</span>}
                </p>
                <label className="cursor-pointer rounded-[8px] border border-primary px-3 py-2 text-[13px] font-medium text-primary">
                  {uploading === type
                    ? t('common.loading')
                    : t('companyProfile.officialDocs.selectFile')}
                  <input
                    type="file"
                    accept={DOC_ACCEPT}
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) void upload(type, file)
                    }}
                  />
                </label>
              </div>
              <div className="mt-3 space-y-2">
                {uploaded.map((document) => (
                  <p key={document.id} className="text-[13px] text-neutral-600">
                    {document.originalName ?? document.fileName ?? type}
                    {document.fileSize != null && ` · ${formatFileSize(document.fileSize)}`}
                  </p>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CabClientCompanyProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const [activeStep, setActiveStep] = useState<StepKey>('basicData')
  const [form, setForm] = useState<ProfileFormValues>(EMPTY_PROFILE_FORM)
  const [profileStatus, setProfileStatus] = useState('DRAFT')
  const [branches, setBranches] = useState<OrgBranch[]>([])
  const [documents, setDocuments] = useState<OrgDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<ProfileNotification | null>(null)

  const applyProfile = useCallback((data: Awaited<ReturnType<typeof getCabClientProfile>>) => {
    const values = formValuesFromProfile(data)
    if (!data.profile?.nationalAddress) {
      values.nationalAddress = { ...values.nationalAddress, hasNationalAddress: false }
    }
    setForm(values)
    setProfileStatus(data.status ?? 'DRAFT')
    setBranches(data.branches ?? [])
    setDocuments(data.documents ?? [])
  }, [])

  const refreshProfile = useCallback(async () => {
    applyProfile(await getCabClientProfile(clientId))
  }, [applyProfile, clientId])

  const handleError = useCallback(
    (error: unknown) => {
      setNotification({
        type: 'error',
        message:
          error instanceof ApiError
            ? [error.message, ...(error.errors ?? [])].filter(Boolean).join('. ')
            : t('errors.generic'),
      })
    },
    [t]
  )

  useEffect(() => {
    let cancelled = false
    getCabClientProfile(clientId)
      .then((data) => {
        if (!cancelled) applyProfile(data)
      })
      .catch((error) => {
        if (!cancelled) handleError(error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyProfile, clientId, handleError])

  const update = useCallback(
    <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
      setForm((previous) => ({ ...previous, [key]: value }))
    },
    []
  )

  const saveDraft = useCallback(async () => {
    setSaving(true)
    setNotification(null)
    try {
      await saveCabClientCompanyProfile(clientId, payloadFromForm(form))
      setNotification({ type: 'success', message: t('companyProfile.messages.draftSaved') })
      return true
    } catch (error) {
      handleError(error)
      return false
    } finally {
      setSaving(false)
    }
  }, [clientId, form, handleError, t])

  const submit = async () => {
    setSubmitting(true)
    setNotification(null)
    try {
      await saveCabClientCompanyProfile(clientId, payloadFromForm(form))
      const result = await submitCabClientProfile(clientId)
      setProfileStatus('COMPLETED')
      setNotification({ type: 'success', message: result.message })
      navigate(ROUTES.cabAuditClients)
    } catch (error) {
      handleError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const refreshBranches = useCallback(async () => {
    const data = await getCabClientProfile(clientId)
    setBranches(data.branches ?? [])
  }, [clientId])

  const refreshDocuments = useCallback(async () => {
    const data = await getCabClientProfile(clientId)
    setDocuments(data.documents ?? [])
  }, [clientId])

  const contextValue = useMemo(
    () => ({
      form,
      update,
      profileStatus,
      branches,
      refreshBranches,
      documents,
      refreshDocuments,
      editingBranch: null,
      setEditingBranch: () => undefined,
      refreshProfile,
      saveDraft,
      saving,
      notify: setNotification,
      handleApiError: handleError,
    }),
    [
      branches,
      documents,
      form,
      handleError,
      profileStatus,
      refreshBranches,
      refreshDocuments,
      refreshProfile,
      saveDraft,
      saving,
      update,
    ]
  )

  const commercialRegisterUploaded = documents.some(
    (document) => document.documentType === 'COMMERCIAL_REGISTER'
  )
  const stepComplete: Record<StepKey, boolean> = {
    basicData: isBasicProfileComplete(form),
    address: isAddressComplete(form) && isNationalAddressComplete(form),
    branches: true,
    officialDocs: commercialRegisterUploaded,
  }
  const isLastStep = activeStep === STEPS[STEPS.length - 1]
  const allRequiredComplete =
    stepComplete.basicData && stepComplete.address && stepComplete.officialDocs

  const goNext = () => {
    const index = STEPS.indexOf(activeStep)
    if (index < STEPS.length - 1) setActiveStep(STEPS[index + 1])
  }
  const goBack = () => {
    const index = STEPS.indexOf(activeStep)
    if (index > 0) setActiveStep(STEPS[index - 1])
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.clientCompanyProfile.title')} notificationCount={3} />
      <ProfileFormContext.Provider value={contextValue}>
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <nav className="flex items-center gap-2 text-[13px]">
            <Link to={ROUTES.cabAuditClients} className="text-neutral-400 hover:text-primary">
              {t('cab.clientRegistration.breadcrumbClientRegister')}
            </Link>
            <span className="text-neutral-400">/</span>
            <span className="font-medium text-neutral-700">
              {t('cab.clientCompanyProfile.title')}
            </span>
          </nav>
          <div>
            <h1 className="text-[26px] font-bold text-neutral-900">
              {t('cab.clientCompanyProfile.title')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t('companyProfile.stepSubtitles.' + activeStep)}
            </p>
          </div>
          <Stepper activeStep={activeStep} onStepClick={setActiveStep} />
          {notification && (
            <p
              role={notification.type === 'error' ? 'alert' : 'status'}
              className={notification.type === 'error' ? 'text-error-500' : 'text-success-600'}
            >
              {notification.message}
            </p>
          )}
          {loading ? (
            <ProfileLoadingSkeleton />
          ) : (
            <>
              {activeStep === 'basicData' && <CabBasicDataStep />}
                  {activeStep === 'address' && <AddressStep />}
              {activeStep === 'branches' && (
                <CabBranchesStep
                  clientId={clientId}
                  branches={branches}
                  refresh={refreshBranches}
                  notify={setNotification}
                  handleError={handleError}
                />
              )}
              {activeStep === 'officialDocs' && (
                <CabDocumentsStep
                  clientId={clientId}
                  documents={documents}
                  refresh={refreshDocuments}
                  notify={setNotification}
                  handleError={handleError}
                />
              )}
            </>
          )}
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[#ececec] bg-white px-6 py-3">
          <Button variant="tertiary" size="lg" onClick={() => void saveDraft()} disabled={saving || loading}>
            {saving ? t('common.loading') : t('companyProfile.footer.saveDraft')}
          </Button>
          <Button variant="secondary" size="lg" onClick={goBack} disabled={activeStep === STEPS[0]}>
            {t('companyProfile.footer.back')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={isLastStep ? submit : goNext}
            disabled={
              loading ||
              submitting ||
              (isLastStep ? !allRequiredComplete : !stepComplete[activeStep])
            }
          >
            {isLastStep
              ? submitting
                ? t('common.loading')
                : t('companyProfile.footer.submit')
              : t('companyProfile.footer.next')}
          </Button>
        </footer>
      </ProfileFormContext.Provider>
    </CabLayout>
  )
}
