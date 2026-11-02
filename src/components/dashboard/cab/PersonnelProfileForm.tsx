import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountryCallingCode } from 'libphonenumber-js'
import { Button } from '@/components/ui/Button'
import { getCountryOptions } from '@/lib/countries'
import { isValidPhoneNumber } from '@/lib/validators'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { CAB_ACTIVITY_OPTIONS, getSchemeOptions } from '@/lib/api/cabSetupApi'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SECTOR_OPTIONS } from '@/components/dashboard/companyProfile/constants'
import type { CompetencePerson } from '@/lib/api/cabCompetenceApi'
import {
  createCabEmployee,
  updateCabEmployee,
  uploadCabEmployeeImage,
  getCabEmployeeDetail,
  createCabEmployeeImpartialityDeclaration,
  listCabEmployeeImpartialityDeclarations,
  createCabEmployeeImpartialityRelationship,
  listCabEmployeeImpartialityRelationships,
  createCabEmployeeAvailabilityPeriod,
  listCabEmployeeAvailabilityPeriods,
  toBackendRole,
  cleanIafCodes,
  CAB_PROFESSIONAL_ROLES,
} from '@/lib/api/cabEmployeesApi'
import { getCabProfile } from '@/lib/api/cabApi'
import { ApiError } from '@/lib/api/client'
import type { UploadedDocumentFile } from '@/components/dashboard/DocumentUploadField'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import type { TourStepConfig } from '@/context/TourContext'
import { PersonnelPersonalDetailsSection } from '@/components/dashboard/cab/PersonnelPersonalDetailsSection'
import { PersonnelEmploymentSection } from '@/components/dashboard/cab/PersonnelEmploymentSection'
import { PersonnelCompetenceSection } from '@/components/dashboard/cab/PersonnelCompetenceSection'
import {
  PersonnelImpartialitySection,
  type StagedOrSavedDeclaration,
  type StagedOrSavedRelationship,
} from '@/components/dashboard/cab/PersonnelImpartialitySection'
import {
  PersonnelAvailabilitySection,
  type StagedOrSavedAvailabilityPeriod,
} from '@/components/dashboard/cab/PersonnelAvailabilitySection'
import {
  DEFAULT_QUAL_CATEGORIES,
  includeSavedOptions,
  loadStagedAvailabilityFromStorage,
  loadStagedCategoriesFromStorage,
  loadStagedImpartialityFromStorage,
  mapBackendQualificationToFile,
  parsePersonPhone,
  STAGED_AVAILABILITY_STORAGE_KEY,
  STAGED_IMPARTIALITY_STORAGE_KEY,
  STAGED_QUALS_STORAGE_KEY,
  toIsoDate,
  type PersonnelFormState,
  type QualificationCategoryItem,
} from '@/components/dashboard/cab/personnelFormHelpers'

export function PersonnelProfileForm({
  person,
  onCancel,
  onSaved,
  tourSteps = [],
}: {
  person?: CompetencePerson
  onCancel: () => void
  onSaved: (person: CompetencePerson) => void
  tourSteps?: TourStepConfig[]
}) {
  const { t, i18n } = useTranslation()
  const label = (key: string, fallback?: string) =>
    t(`cab.competence.memberProfile.${key}`, fallback ?? key)

  const localDate = toIsoDate(new Date())
  const initialPhone = parsePersonPhone(person?.phone)

  const [form, setForm] = useState<PersonnelFormState>({
    name: person?.name ?? '',
    role: person?.role ?? 'Auditor',
    email: person?.email ?? '',
    phoneCountryCode: initialPhone.countryCode,
    phone: initialPhone.phone,
    avatarUrl: person?.avatarUrl ?? '',
    baseCountry: person?.baseCountry ?? '',
    baseCity: person?.baseCity ?? '',
    employmentStartDate: person?.employmentStartDate
      ? person.employmentStartDate.split('T')[0]
      : localDate,
    employmentEndDate: person?.employmentEndDate
      ? person.employmentEndDate.split('T')[0]
      : '',
    currentlyWorksHere: person ? !person.employmentEndDate : true,
    iafCodes: person?.iafCodes ?? [],
    auditLanguages: person?.auditLanguages ?? [],
    qualifications:
      person?.qualifications ?? person?.evaluation?.highestQualification ?? '',
    country: person?.country ?? '',
    schemes: person?.schemes ?? [],
    authorizedScope: person?.authorizedScope ?? '',
    expiryDate: person?.expiryDate ? person.expiryDate.split('T')[0] : '',
  })

  useEffect(() => {
    if (!person) return
    const parsedPhone = person.phone ? parsePersonPhone(person.phone) : null
    const endDate = person.employmentEndDate ? person.employmentEndDate.split('T')[0] : ''
    setForm((prev) => ({
      ...prev,
      name: person.name || prev.name,
      role: person.role || prev.role,
      email: person.email || prev.email,
      phoneCountryCode: parsedPhone ? parsedPhone.countryCode : prev.phoneCountryCode,
      phone: parsedPhone ? parsedPhone.phone : prev.phone,
      avatarUrl: person.avatarUrl || prev.avatarUrl,
      baseCountry: person.baseCountry || prev.baseCountry,
      baseCity: person.baseCity || prev.baseCity,
      employmentStartDate: person.employmentStartDate
        ? person.employmentStartDate.split('T')[0]
        : '',
      employmentEndDate: endDate,
      currentlyWorksHere: !endDate,
      iafCodes: person.iafCodes?.length ? person.iafCodes : prev.iafCodes,
      auditLanguages: person.auditLanguages?.length
        ? person.auditLanguages
        : prev.auditLanguages,
      qualifications:
        person.qualifications ||
        person.evaluation?.highestQualification ||
        prev.qualifications,
      country: person.country || prev.country,
      schemes: person.schemes?.length ? person.schemes : prev.schemes,
      authorizedScope: person.authorizedScope || prev.authorizedScope,
      expiryDate: person.expiryDate ? person.expiryDate.split('T')[0] : '',
    }))
  }, [person])

  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
  const countryOptions = includeSavedOptions(
    getCountryOptions(i18n.language).map((country) => ({
      value: countryNames.of(country.code) ?? country.name,
      label: `${country.flag} ${country.name}`,
    })),
    [form.country],
  )

  const baseCountryOptions = includeSavedOptions(
    getCountryOptions(i18n.language).map((country) => ({
      value: country.code,
      label: `${country.flag} ${country.name}`,
    })),
    [form.baseCountry],
  )

  const [cabSchemes, setCabSchemes] = useState<string[]>([])
  useEffect(() => {
    getCabProfile()
      .then(({ cab }) => {
        const names = (cab?.schemes ?? []).map((s) => s.schemeName).filter(Boolean)
        setCabSchemes(Array.from(new Set(names)))
      })
      .catch(() =>
        setError('Could not load the CAB schemes. Please reload the page before saving.'),
      )
  }, [])

  const baseSchemeOptions = [
    ...getSchemeOptions(CAB_ACTIVITY_OPTIONS.map((activity) => activity.value)).map(
      (scheme) => ({
        value: scheme.label,
        label: scheme.label,
      }),
    ),
    ...STANDARD_SCHEMA_OPTIONS.map((scheme) => ({
      value: scheme.name,
      label: `${scheme.name} — ${scheme.certificationType}`,
    })),
    { value: 'HACCP', label: 'HACCP' },
  ]

  const schemeOptions = includeSavedOptions(baseSchemeOptions, [
    ...cabSchemes,
    ...form.schemes,
  ])

  const sectorOptions = includeSavedOptions(
    SECTOR_OPTIONS.map((sector) => ({
      value: t(`companyProfile.profileHeader.sectors.${sector.key}`, { lng: 'en' }),
      label: t(`companyProfile.profileHeader.sectors.${sector.key}`),
    })),
    [form.authorizedScope],
  )

  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<string[]>([])
  const [readingImage, setReadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Employee ID & sub-sections state
  const [savedEmployeeId, setSavedEmployeeId] = useState(
    person?.id && !person.id.startsWith('per-') ? person.id : undefined,
  )
  const [qualCategories, setQualCategories] = useState<QualificationCategoryItem[]>(() =>
    person?.id ? DEFAULT_QUAL_CATEGORIES : loadStagedCategoriesFromStorage(),
  )
  const [uncategorizedFiles, setUncategorizedFiles] = useState<UploadedDocumentFile[]>([])
  const [qualBusy, setQualBusy] = useState(false)
  const [loadingQuals, setLoadingQuals] = useState(
    Boolean(person?.id && !person.id.startsWith('per-')),
  )

  const initialStagedImpartiality = person?.id
    ? { declarations: [], relationships: [] }
    : loadStagedImpartialityFromStorage()
  const [declarations, setDeclarations] = useState<StagedOrSavedDeclaration[]>(
    initialStagedImpartiality.declarations,
  )
  const [relationships, setRelationships] = useState<StagedOrSavedRelationship[]>(
    initialStagedImpartiality.relationships,
  )
  const [availabilityPeriods, setAvailabilityPeriods] = useState<
    StagedOrSavedAvailabilityPeriod[]
  >(() => (person?.id ? [] : loadStagedAvailabilityFromStorage()))

  // Persist staged items on /cab/competence/persons/new across page refreshes
  useEffect(() => {
    if (savedEmployeeId || person?.id) return
    try {
      localStorage.setItem(STAGED_QUALS_STORAGE_KEY, JSON.stringify(qualCategories))
    } catch {
      // Ignore storage quota errors
    }
  }, [qualCategories, savedEmployeeId, person?.id])

  useEffect(() => {
    if (savedEmployeeId || person?.id) return
    try {
      localStorage.setItem(
        STAGED_IMPARTIALITY_STORAGE_KEY,
        JSON.stringify({ declarations, relationships }),
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [declarations, relationships, savedEmployeeId, person?.id])

  useEffect(() => {
    if (savedEmployeeId || person?.id) return
    try {
      localStorage.setItem(
        STAGED_AVAILABILITY_STORAGE_KEY,
        JSON.stringify(availabilityPeriods),
      )
    } catch {
      // Ignore storage quota errors
    }
  }, [availabilityPeriods, savedEmployeeId, person?.id])

  // Load existing employee details (qualifications, impartiality, availability, languages, residence)
  useEffect(() => {
    if (!person?.id || person.id.startsWith('per-')) return
    setLoadingQuals(true)
    getCabEmployeeDetail(person.id)
      .then(({ employee }) => {
        if (!employee) return
        setForm((prev) => ({
          ...prev,
          baseCountry: employee.baseCountry || prev.baseCountry,
          baseCity: employee.baseCity || prev.baseCity,
          auditLanguages: employee.auditLanguages?.length
            ? employee.auditLanguages
            : prev.auditLanguages,
        }))

        const backendCategories = employee.qualificationCategories ?? []
        const allFlatQuals = employee.qualifications ?? []
        const categorizedDocIds = new Set<string>()
        const mappedCategories: QualificationCategoryItem[] = backendCategories.map(
          (cat) => {
            const nestedDocs = cat.documents ?? []
            const linkedFlatDocs = allFlatQuals.filter(
              (q) => q.categoryId === cat.id && !nestedDocs.some((nd) => nd.id === q.id),
            )
            const combinedDocs = [...nestedDocs, ...linkedFlatDocs]
            const docs = combinedDocs.map((doc) => {
              categorizedDocIds.add(doc.id)
              return mapBackendQualificationToFile(doc, i18n.language)
            })
            return {
              id: cat.id,
              isPersisted: true,
              isExplicit: true,
              name:
                cat.name ||
                (cat as { categoryName?: string }).categoryName ||
                'Qualification Documents',
              documents: docs,
            }
          },
        )

        const uncategorized = allFlatQuals
          .filter((q) => !categorizedDocIds.has(q.id))
          .map((q) => mapBackendQualificationToFile(q, i18n.language))

        setUncategorizedFiles(uncategorized)
        setQualCategories(
          mappedCategories.length > 0 ? mappedCategories : DEFAULT_QUAL_CATEGORIES,
        )

        if (Array.isArray(employee.impartialityDeclarations)) {
          setDeclarations(employee.impartialityDeclarations)
        } else {
          listCabEmployeeImpartialityDeclarations(person.id)
            .then((res) => setDeclarations(res?.declarations ?? []))
            .catch(() => {})
        }

        if (Array.isArray(employee.declaredRelationships)) {
          setRelationships(employee.declaredRelationships)
        } else {
          listCabEmployeeImpartialityRelationships(person.id)
            .then((res) => setRelationships(res?.relationships ?? []))
            .catch(() => {})
        }

        if (Array.isArray(employee.availabilityPeriods)) {
          setAvailabilityPeriods(employee.availabilityPeriods)
        } else {
          listCabEmployeeAvailabilityPeriods(person.id)
            .then((res) => setAvailabilityPeriods(res?.periods ?? []))
            .catch(() => {})
        }
      })
      .catch(() =>
        setError(
          t(
            'cab.competence.messages.loadQualificationsFailed',
            'Could not load saved qualification documents. Please reload the page.',
          ),
        ),
      )
      .finally(() => setLoadingQuals(false))
  }, [person?.id, i18n.language])

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError(label('imageHelp'))
      return
    }
    setError('')
    setImageFile(file)
    setReadingImage(true)
    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, avatarUrl: String(reader.result) }))
      setReadingImage(false)
    }
    reader.onerror = () => {
      setError(label('imageError'))
      setReadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const phoneError =
    form.phone.trim() && !isValidPhoneNumber(form.phone, form.phoneCountryCode)
      ? t('validation.invalidMobile', 'Invalid phone number')
      : undefined

  const isBusy = readingImage || isSubmitting || loadingQuals || qualBusy

  const handleSectionError = (msg: string, details: string[] = []) => {
    setError(msg)
    setErrorDetails(details)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (isBusy) return
    if (!form.name.trim()) {
      setError(label('nameRequired'))
      return
    }
    if (!person && !form.email.trim()) {
      setError(t('cab.competence.memberProfile.emailRequired', 'Email is required'))
      return
    }
    if (phoneError) {
      setError(phoneError)
      return
    }
    if (
      form.employmentStartDate &&
      form.employmentEndDate &&
      form.employmentEndDate < form.employmentStartDate
    ) {
      setError(label('dateError'))
      return
    }

    setError('')
    setErrorDetails([])

    const resolvedSchemes = form.schemes.map(
      (s) => cabSchemes.find((cs) => cs === s || cs.startsWith(`${s} — `)) ?? s,
    )
    const missingSchemes = resolvedSchemes.filter(
      (scheme) => !cabSchemes.includes(scheme),
    )
    if (missingSchemes.length) {
      setError(
        `Configure these schemes in the CAB company profile before assigning them: ${missingSchemes.join(', ')}`,
      )
      return
    }

    const dialCode = `+${getCountryCallingCode(form.phoneCountryCode)}`
    const cleanPhone = form.phone.replace(/\D/g, '')
    setIsSubmitting(true)
    let employeeId = savedEmployeeId

    try {
      const hasEndDate = !form.currentlyWorksHere && Boolean(form.employmentEndDate)
      const commonFields = {
        fullName: form.name.trim(),
        email: form.email.trim(),
        ...(cleanPhone
          ? { phone: cleanPhone, phoneCountryCode: dialCode }
          : { phone: null, phoneCountryCode: null }),
        professionalRole: toBackendRole(form.role),
        ...(form.employmentStartDate
          ? { employmentStartDate: form.employmentStartDate }
          : {}),
        employmentEndDate: hasEndDate ? form.employmentEndDate : null,
        currentlyWorksHere: !hasEndDate,
        iafCodes: cleanIafCodes(form.iafCodes),
        schemes: resolvedSchemes,
        ...(form.auditLanguages.length > 0
          ? { auditLanguages: form.auditLanguages }
          : {}),
        ...(form.baseCountry.trim() ? { baseCountry: form.baseCountry.trim() } : {}),
        ...(form.baseCity.trim() ? { baseCity: form.baseCity.trim() } : {}),
        ...(form.authorizedScope ? { authorizedSectors: [form.authorizedScope] } : {}),
        ...(form.country ? { scopeCountry: form.country } : {}),
        ...(form.expiryDate ? { scopeExpiryDate: form.expiryDate } : {}),
      }

      const stagedCategoriesPayload = qualCategories
        .filter((cat) => cat.isExplicit || cat.documents.some((d) => d.uploadId))
        .map((cat) => ({
          categoryName: cat.name.trim(),
          documents: cat.documents
            .filter((d) => d.uploadId)
            .map((d) => ({
              uploadId: d.uploadId!,
              fileName: d.name,
            })),
        }))

      const { employee } = employeeId
        ? await updateCabEmployee(employeeId, commonFields)
        : await createCabEmployee({
            ...commonFields,
            ...(stagedCategoriesPayload.length > 0
              ? { qualificationCategories: stagedCategoriesPayload }
              : {}),
          })

      employeeId = employee.id
      setSavedEmployeeId(employeeId)
      try {
        localStorage.removeItem(STAGED_QUALS_STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }

      for (const stagedDecl of declarations.filter((d) => d.isStaged)) {
        await createCabEmployeeImpartialityDeclaration(employeeId, {
          declarationType: stagedDecl.declarationType,
          answer: stagedDecl.answer,
          signedBy: stagedDecl.signedBy,
          signedAt: stagedDecl.signedAt.split('T')[0],
          ...(stagedDecl.declarationType === 'AUDIT_SPECIFIC' &&
          stagedDecl.auditReference
            ? { auditReference: stagedDecl.auditReference }
            : {}),
        })
      }

      for (const stagedRel of relationships.filter((r) => r.isStaged)) {
        await createCabEmployeeImpartialityRelationship(employeeId, {
          clientId: stagedRel.clientId,
          relationshipType: stagedRel.relationshipType,
          description: stagedRel.description ?? null,
          startDate: stagedRel.startDate.split('T')[0],
          endDate: stagedRel.endDate ? stagedRel.endDate.split('T')[0] : null,
        })
      }

      try {
        localStorage.removeItem(STAGED_IMPARTIALITY_STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }

      for (const stagedPeriod of availabilityPeriods.filter((p) => p.isStaged)) {
        await createCabEmployeeAvailabilityPeriod(employeeId, {
          startDate: stagedPeriod.startDate.split('T')[0],
          endDate: stagedPeriod.endDate.split('T')[0],
          reason: stagedPeriod.reason,
          notes: stagedPeriod.notes ?? null,
        })
      }

      try {
        localStorage.removeItem(STAGED_AVAILABILITY_STORAGE_KEY)
      } catch {
        // Ignore storage errors
      }

      let avatarUrl = resolvePublicAssetUrl(employee.imageUrl) || person?.avatarUrl
      if (imageFile) {
        const result = await uploadCabEmployeeImage(employeeId, imageFile)
        avatarUrl = resolvePublicAssetUrl(result.employee.imageUrl) || undefined
        setImageFile(null)
      }

      onSaved({
        ...person,
        ...form,
        id: employeeId,
        code:
          employee.employeeCode ||
          person?.code ||
          `EMP-${employeeId.slice(0, 4).toUpperCase()}`,
        schemes: employee.schemes ?? resolvedSchemes,
        auditLanguages: employee.auditLanguages ?? form.auditLanguages,
        baseCountry: employee.baseCountry ?? form.baseCountry,
        baseCity: employee.baseCity ?? form.baseCity,
        avatarUrl: avatarUrl || undefined,
        name: form.name.trim() || employee.fullName || employee.user?.fullName || '',
        email: form.email.trim() || employee.email || employee.user?.email || '',
        role: (CAB_PROFESSIONAL_ROLES.find((r) => r.value === employee.professionalRole)
          ?.label ?? form.role) as CompetencePerson['role'],
        phone: cleanPhone ? `${dialCode} ${cleanPhone}` : '',
        status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
        statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : label('saveError')
      setError(message)
      if (err instanceof ApiError) setErrorDetails(err.errors ?? [])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" dir={i18n.dir()}>
      <CabTourStep steps={tourSteps} stepId="profile-personal-section">
        <PersonnelPersonalDetailsSection
          form={form}
          onChangeForm={setForm}
          isExistingPerson={Boolean(person)}
          phoneError={phoneError}
          readingImage={readingImage}
          onUploadImage={uploadImage}
          baseCountryOptions={baseCountryOptions}
        />
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-employment-section">
        <PersonnelEmploymentSection form={form} onChangeForm={setForm} />
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-competence-section">
        <PersonnelCompetenceSection
          form={form}
          onChangeForm={setForm}
          schemeOptions={schemeOptions}
          sectorOptions={sectorOptions}
          countryOptions={countryOptions}
          savedEmployeeId={savedEmployeeId}
          qualCategories={qualCategories}
          onChangeQualCategories={setQualCategories}
          uncategorizedFiles={uncategorizedFiles}
          onChangeUncategorizedFiles={setUncategorizedFiles}
          loadingQuals={loadingQuals}
          isSubmitting={isSubmitting}
          onBusyChange={setQualBusy}
          onError={handleSectionError}
        />
      </CabTourStep>

      <PersonnelImpartialitySection
        savedEmployeeId={savedEmployeeId}
        defaultSignedBy={form.name}
        declarations={declarations}
        relationships={relationships}
        onChangeDeclarations={setDeclarations}
        onChangeRelationships={setRelationships}
        onError={handleSectionError}
        disabled={isBusy}
      />

      <PersonnelAvailabilitySection
        savedEmployeeId={savedEmployeeId}
        periods={availabilityPeriods}
        onChangePeriods={setAvailabilityPeriods}
        onError={handleSectionError}
        disabled={isBusy}
      />

      {(error || errorDetails.length > 0) && (
        <div
          role="alert"
          className="space-y-1 rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700"
        >
          {error && <p className="font-semibold">{error}</p>}
          {errorDetails.map((msg, i) => (
            <p key={i}>• {msg}</p>
          ))}
        </div>
      )}

      <CabTourStep steps={tourSteps} stepId="profile-save-action">
        <div className="flex flex-wrap justify-end gap-3 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
          <Button
            variant="outline"
            type="button"
            disabled={isBusy}
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('cab.competence.savePerson')}
          </Button>
        </div>
      </CabTourStep>
    </form>
  )
}
