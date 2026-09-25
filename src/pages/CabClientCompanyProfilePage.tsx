import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  EyeIcon,
  DocumentFileIcon,
  DocumentTextOutlineIcon,
  TrashIcon,
} from '@/components/icons'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { SectionTitle } from '@/components/dashboard/SectionTitle'
import { FormField, MultiSelect, RadioGroup, TextField, Textarea } from '@/components/ui'
import { BasicDataCard } from '@/components/dashboard/companyProfile/BasicDataCard'
import { AddressStep } from '@/components/dashboard/companyProfile/steps'
import { BranchFormFields } from '@/components/dashboard/companyProfile/BranchFormFields'
import {
  ProfileFormContext,
  useProfileForm,
} from '@/components/dashboard/companyProfile/ProfileFormContext'
import { ProfileLoadingSkeleton } from '@/components/dashboard/companyProfile/ProfileLoadingSkeleton'
import { CardHeader, Stepper } from '@/components/dashboard/companyProfile/Primitives'
import {
  DOC_ACCEPT,
  DOC_MAX_BYTES,
  DOC_TYPE_BY_KEY,
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
  deleteCabClientDocument,
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

function toUploadedFile(doc: OrgDocument, locale: string): UploadedDocumentFile {
  const uploadedAt = doc.createdAt ?? (doc as OrgDocument & { uploadedAt?: string | null }).uploadedAt
  return {
    id: doc.id,
    name: doc.originalName ?? doc.fileName ?? '',
    sizeLabel: formatFileSize(doc.fileSize),
    dateLabel: uploadedAt ? new Date(uploadedAt).toLocaleDateString(locale) : undefined,
    url: doc.fileUrl,
  }
}

function openDocumentUrl(file: UploadedDocumentFile) {
  if (file.url) window.open(file.url, '_blank')
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
  const { t, i18n } = useTranslation()
  const addDocRef = useRef<HTMLInputElement>(null)
  const [busyType, setBusyType] = useState<OrgDocumentType | null>(null)

  const documentsOfType = (type: OrgDocumentType) =>
    documents.filter((document) => document.documentType === type)

  const upload = async (type: OrgDocumentType, file: File) => {
    if (file.size > DOC_MAX_BYTES) {
      notify({ type: 'error', message: t('validation.fileTooLarge', { size: 10 }) })
      return
    }
    setBusyType(type)
    try {
      await uploadCabClientDocument(clientId, type, file)
      await refresh()
      notify({ type: 'success', message: t('companyProfile.messages.documentUploaded') })
    } catch (error) {
      handleError(error)
    } finally {
      setBusyType(null)
    }
  }

  const remove = async (id: string) => {
    const document = documents.find((item) => item.id === id)
    setBusyType(document?.documentType ?? 'OTHER')
    try {
      await deleteCabClientDocument(clientId, id)
      await refresh()
      notify({ type: 'success', message: t('companyProfile.messages.documentDeleted') })
    } catch (error) {
      handleError(error)
    } finally {
      setBusyType(null)
    }
  }

  const onOtherFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await upload('OTHER', file)
  }

  return (
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.officialDocs.title')} />
      <div className="flex flex-col gap-3 rounded-[12px] border border-dashed border-primary/30 p-3">
        {Object.keys(DOC_TYPE_BY_KEY).map((docKey) => {
          const type = DOC_TYPE_BY_KEY[docKey]
          const files = [...documentsOfType(type)]
            .reverse()
            .map((document) => toUploadedFile(document, i18n.language))
          return (
            <DocumentUploadField
              key={docKey}
              title={t(`companyProfile.officialDocs.docs.${docKey}`)}
              required
              files={files}
              busy={busyType === type}
              accept={DOC_ACCEPT}
              onSelectFile={(file) => upload(type, file)}
              onDeleteFile={remove}
              onOpenFile={openDocumentUrl}
            />
          )
        })}
      </div>

      <SectionTitle
        title={t('companyProfile.officialDocs.otherDocsTitle')}
        subtitle={t('companyProfile.officialDocs.otherDocsSubtitle')}
      />
      {documentsOfType('OTHER').length > 0 && (
        <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-[12px] border border-[#ececec] p-3">
          {documentsOfType('OTHER').map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#eef0fb] text-primary">
                  <AppIcon icon={DocumentFileIcon} size={20} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p dir="ltr" className="text-[18px] font-medium leading-[1.6] text-neutral-900">
                    {document.originalName ?? document.fileName}
                  </p>
                  <span dir="ltr" className="text-[12px] font-light text-[#666]">
                    {formatFileSize(document.fileSize)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="preview"
                  onClick={() => document.fileUrl && window.open(document.fileUrl, '_blank')}
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#ececec] bg-white text-neutral-600 transition-colors hover:text-primary"
                >
                  <AppIcon icon={EyeIcon} size={16} />
                </button>
                <button
                  type="button"
                  aria-label="delete"
                  onClick={() => void remove(document.id)}
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#ececec] bg-white text-neutral-600 transition-colors hover:text-error-500"
                >
                  <AppIcon icon={TrashIcon} size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col items-center justify-center gap-4 rounded-[12px] border border-dashed border-primary/30 py-10">
        <AppIcon icon={DocumentTextOutlineIcon} size={40} className="text-primary" />
        <p className="text-[18px] font-medium text-neutral-900">
          {t('companyProfile.officialDocs.addDocLabel')}
        </p>
        <Button
          variant="secondary"
          className="h-12 min-w-[160px] rounded-[8px] border-neutral-200"
          onClick={() => addDocRef.current?.click()}
          disabled={busyType === 'OTHER'}
        >
          {busyType === 'OTHER' ? t('common.loading') : t('companyProfile.officialDocs.selectFile')}
        </Button>
        <input
          ref={addDocRef}
          type="file"
          className="hidden"
          accept={DOC_ACCEPT}
          onChange={(event) => void onOtherFileSelected(event)}
        />
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
