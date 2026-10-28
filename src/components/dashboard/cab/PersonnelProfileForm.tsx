import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import { AppIcon, PhoneIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { SelectField } from '@/components/ui/Select'
import { fieldInputClassName, fieldHeightClassName, fieldLabelClassName } from '@/components/ui/fieldStyles'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getCountryOptions } from '@/lib/countries'
import { isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { CAB_ACTIVITY_OPTIONS, getSchemeOptions } from '@/lib/api/cabSetupApi'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SECTOR_OPTIONS } from '@/components/dashboard/companyProfile/constants'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getIafCodeOptions } from '@/lib/iafCodes'
import type { CompetencePerson } from '@/lib/api/cabCompetenceApi'
import {
  createCabEmployee,
  updateCabEmployee,
  uploadCabEmployeeImage,
  getCabEmployeeDetail,
  uploadCabEmployeeQualification,
  deleteCabEmployeeQualification,
  toBackendRole,
  cleanIafCodes,
  CAB_PROFESSIONAL_ROLES,
} from '@/lib/api/cabEmployeesApi'
import { getCabProfile } from '@/lib/api/cabApi'
import { ApiError } from '@/lib/api/client'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'

import { DatePicker } from '@/components/ui/DatePicker'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import type { TourStepConfig } from '@/context/TourContext'

const inputClass = `mt-1 ${fieldInputClassName} ${fieldHeightClassName}`

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const datePart = value.split('T')[0]
  const parsed = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function includeSavedOptions(options: { value: string; label: string }[], saved: string[]) {
  return [...options, ...[...new Set(saved)].filter((value) => value && !options.some((option) => option.value === value)).map((value) => ({ value, label: value }))]
}

function parsePersonPhone(raw?: string | null): { countryCode: CountryCode; phone: string } {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { countryCode: 'SA', phone: '' }

  const parsed = parsePhoneNumberFromString(trimmed)
  if (parsed?.country) {
    return {
      countryCode: parsed.country as CountryCode,
      phone: parsed.nationalNumber,
    }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length > 1 && parts[0].startsWith('+')) {
    const dialDigits = parts[0].replace(/\D/g, '')
    const match = getCountries().find((c) => getCountryCallingCode(c) === dialDigits)
    if (match) {
      return {
        countryCode: match as CountryCode,
        phone: parts.slice(1).join('').replace(/\D/g, ''),
      }
    }
  }

  if (trimmed.startsWith('+')) {
    for (const c of getCountries()) {
      const dial = `+${getCountryCallingCode(c)}`
      if (trimmed.startsWith(dial)) {
        return {
          countryCode: c as CountryCode,
          phone: trimmed.slice(dial.length).replace(/\D/g, ''),
        }
      }
    }
  }

  return { countryCode: 'SA', phone: trimmed.replace(/\D/g, '') }
}

export function PersonnelProfileForm({ person, onCancel, onSaved, tourSteps = [] }: {
  person?: CompetencePerson
  onCancel: () => void
  onSaved: (person: CompetencePerson) => void
  tourSteps?: TourStepConfig[]
}) {
  const { t, i18n } = useTranslation()
  const label = (key: string) => t(`cab.competence.memberProfile.${key}`)
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const initialPhone = parsePersonPhone(person?.phone)
  const [form, setForm] = useState({
    name: person?.name ?? '', role: person?.role ?? 'Auditor',
    email: person?.email ?? '',
    phoneCountryCode: initialPhone.countryCode,
    phone: initialPhone.phone,
    avatarUrl: person?.avatarUrl ?? '',
    employmentStartDate: person?.employmentStartDate ? person.employmentStartDate.split('T')[0] : localDate,
    employmentEndDate: person?.employmentEndDate ? person.employmentEndDate.split('T')[0] : '',
    iafCodes: person?.iafCodes ?? [], qualifications: person?.qualifications ?? person?.evaluation?.highestQualification ?? '',
    country: person?.country ?? '', schemes: person?.schemes ?? [],
    authorizedScope: person?.authorizedScope ?? '', expiryDate: person?.expiryDate ? person.expiryDate.split('T')[0] : '',
  })

  useEffect(() => {
    if (!person) return
    const parsedPhone = person.phone ? parsePersonPhone(person.phone) : null
    setForm((prev) => ({
      ...prev,
      name: person.name || prev.name,
      role: person.role || prev.role,
      email: person.email || prev.email,
      phoneCountryCode: parsedPhone ? parsedPhone.countryCode : prev.phoneCountryCode,
      phone: parsedPhone ? parsedPhone.phone : prev.phone,
      avatarUrl: person.avatarUrl || prev.avatarUrl,
      employmentStartDate: person.employmentStartDate ? person.employmentStartDate.split('T')[0] : '',
      employmentEndDate: person.employmentEndDate ? person.employmentEndDate.split('T')[0] : '',
      iafCodes: person.iafCodes?.length ? person.iafCodes : prev.iafCodes,
      qualifications: person.qualifications || person.evaluation?.highestQualification || prev.qualifications,
      country: person.country || prev.country,
      schemes: person.schemes?.length ? person.schemes : prev.schemes,
      authorizedScope: person.authorizedScope || prev.authorizedScope,
      expiryDate: person.expiryDate ? person.expiryDate.split('T')[0] : '',
    }))
  }, [person])
  // Preserve the register's readable string values while reusing the shared catalogs.
  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
  const countryOptions = includeSavedOptions(getCountryOptions(i18n.language).map((country) => ({
    value: countryNames.of(country.code) ?? country.name,
    label: `${country.flag} ${country.name}`,
  })), [form.country])

  const [cabSchemes, setCabSchemes] = useState<string[]>([])
  useEffect(() => {
    getCabProfile()
      .then(({ cab }) => {
        const names = (cab?.schemes ?? []).map((s) => s.schemeName).filter(Boolean)
        setCabSchemes(Array.from(new Set(names)))
      })
      .catch(() => setError('Could not load the CAB schemes. Please reload the page before saving.'))
  }, [])

  const baseSchemeOptions = [
        ...getSchemeOptions(CAB_ACTIVITY_OPTIONS.map((activity) => activity.value)).map((scheme) => ({
          value: scheme.label, label: scheme.label,
        })),
        ...STANDARD_SCHEMA_OPTIONS.map((scheme) => ({ value: scheme.name, label: `${scheme.name} — ${scheme.certificationType}` })),
        { value: 'HACCP', label: 'HACCP' },
      ]

  const schemeOptions = includeSavedOptions(baseSchemeOptions, [...cabSchemes, ...form.schemes])

  const sectorOptions = includeSavedOptions(SECTOR_OPTIONS.map((sector) => ({
    value: t(`companyProfile.profileHeader.sectors.${sector.key}`, { lng: 'en' }),
    label: t(`companyProfile.profileHeader.sectors.${sector.key}`),
  })), [form.authorizedScope])

  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState<string[]>([])
  const [readingImage, setReadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Qualification documents state (ICASCO DocumentUploadField)
  const [qualFiles, setQualFiles] = useState<UploadedDocumentFile[]>([])
  const [pendingQualFiles, setPendingQualFiles] = useState<{ id: string; file: File }[]>([])
  const [uploadingQual, setUploadingQual] = useState(Boolean(person?.id && !person.id.startsWith('per-')))
  const [savedEmployeeId, setSavedEmployeeId] = useState(person?.id)

  useEffect(() => {
    if (!person?.id || person.id.startsWith('per-')) return
    getCabEmployeeDetail(person.id)
      .then(({ employee }) => {
        if (employee?.qualifications?.length) {
          setQualFiles(
            employee.qualifications.map((q) => ({
              id: q.id,
              name: q.originalName || q.fileName || 'qualification.pdf',
              sizeLabel: formatFileSize(q.fileSize),
              dateLabel: q.uploadedAt ? new Date(q.uploadedAt).toLocaleDateString() : undefined,
              url: q.fileUrl,
            })),
          )
        }
      })
      .catch(() => setError('Could not load saved qualification documents. Please reload the page.'))
      .finally(() => setUploadingQual(false))
  }, [person?.id])

  const handleSelectQualFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20 MB limit.')
      return
    }
    setError('')

    const tempId = crypto.randomUUID()
    setPendingQualFiles((prev) => [...prev, { id: tempId, file }])
    setQualFiles((prev) => [{
      id: tempId, name: file.name, sizeLabel: formatFileSize(file.size),
      dateLabel: 'Pending save', url: URL.createObjectURL(file),
    }, ...prev])
  }

  const handleDeleteQualFile = async (docId: string) => {
    const isPending = pendingQualFiles.some((p) => p.id === docId)
    if (isPending) {
      const url = qualFiles.find((file) => file.id === docId)?.url
      if (url) URL.revokeObjectURL(url)
      setPendingQualFiles((prev) => prev.filter((p) => p.id !== docId))
      setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      return
    }
    if (savedEmployeeId) {
      setUploadingQual(true)
      try {
        await deleteCabEmployeeQualification(savedEmployeeId, docId)
        setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        }
      } finally {
        setUploadingQual(false)
      }
    } else {
      setQualFiles((prev) => prev.filter((f) => f.id !== docId))
    }
  }

  const handleOpenQualFile = (file: UploadedDocumentFile) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer')
    }
  }

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
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
    reader.onerror = () => { setError(label('imageError')); setReadingImage(false) }
    reader.readAsDataURL(file)
  }

  const phoneError =
    form.phone.trim() && !isValidPhoneNumber(form.phone, form.phoneCountryCode)
      ? t('validation.invalidMobile', 'Invalid phone number')
      : undefined

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (readingImage || isSubmitting || uploadingQual) return
    if (!form.name.trim()) { setError(label('nameRequired')); return }
    if (!person && !form.email.trim()) {
      setError(t('cab.competence.memberProfile.emailRequired', 'Email is required'))
      return
    }
    if (phoneError) {
      setError(phoneError)
      return
    }
    if (form.employmentStartDate && form.employmentEndDate && form.employmentEndDate < form.employmentStartDate) {
      setError(label('dateError'))
      return
    }

    setError('')
    setErrorDetails([])

    const resolvedSchemes = form.schemes.map(
      (s) => cabSchemes.find((cs) => cs === s || cs.startsWith(`${s} — `)) ?? s,
    )
    const missingSchemes = resolvedSchemes.filter((scheme) => !cabSchemes.includes(scheme))
    if (missingSchemes.length) {
      setError(`Configure these schemes in the CAB company profile before assigning them: ${missingSchemes.join(', ')}`)
      return
    }
    const dialCode = `+${getCountryCallingCode(form.phoneCountryCode)}`
    const cleanPhone = form.phone.replace(/\D/g, '')
    setIsSubmitting(true)
    let employeeId = savedEmployeeId
    try {
      const payload = {
        professionalRole: toBackendRole(form.role),
        ...(form.employmentStartDate ? { employmentStartDate: `${form.employmentStartDate}T00:00:00.000Z` } : {}),
        iafCodes: cleanIafCodes(form.iafCodes),
        schemes: resolvedSchemes,
      }
      const { employee } = employeeId
        ? await updateCabEmployee(employeeId, payload)
        : await createCabEmployee({
            ...payload, fullName: form.name.trim(), email: form.email.trim(),
            ...(cleanPhone ? { phone: cleanPhone, phoneCountryCode: dialCode } : {}),
          })
      employeeId = employee.id
      // Keep the created ID so retrying a failed upload cannot create another employee.
      setSavedEmployeeId(employeeId)
      let avatarUrl = employee.imageUrl || person?.avatarUrl
      if (imageFile) {
        const result = await uploadCabEmployeeImage(employeeId, imageFile)
        avatarUrl = result.employee.imageUrl || undefined
        setImageFile(null)
      }
      for (const item of pendingQualFiles) {
        const { qualification: q } = await uploadCabEmployeeQualification(employeeId, item.file, 'Qualification Document')
        setPendingQualFiles((prev) => prev.filter((pending) => pending.id !== item.id))
        setQualFiles((prev) => prev.map((file) => {
          if (file.id !== item.id) return file
          if (file.url) URL.revokeObjectURL(file.url)
          return {
            id: q.id, name: q.originalName || q.fileName || item.file.name,
            sizeLabel: formatFileSize(q.fileSize), url: q.fileUrl,
            dateLabel: new Date(q.uploadedAt).toLocaleDateString(),
          }
        }))
      }
      onSaved({
        ...person, ...form, id: employeeId,
        code: person?.code || `PER-${employeeId.slice(0, 4).toUpperCase()}`,
        schemes: employee.schemes, avatarUrl: avatarUrl || undefined,
        name: form.name.trim() || employee.user.fullName,
        email: form.email.trim() || employee.user.email,
        role: (CAB_PROFESSIONAL_ROLES.find((r) => r.value === employee.professionalRole)?.label ?? form.role) as CompetencePerson['role'],
        phone: cleanPhone ? `${dialCode} ${cleanPhone}` : '',
        status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
        statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : label('saveError')
      setError(employeeId ? `The employee is saved, but saving is incomplete: ${message}. Please retry Save to upload the remaining files.` : message)
      if (err instanceof ApiError) setErrorDetails(err.errors ?? [])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5" dir={i18n.dir()}>
      <CabTourStep steps={tourSteps} stepId="profile-personal-section">
        <div>
          <SectionHeading title={label('personalDetails')} accordion>
            <div className="grid gap-5 md:grid-cols-2">
                <label className={`block ${fieldLabelClassName}`}>{label('name')} *
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </label>
                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>{t('cab.competence.role')}</span>
                  <SelectField
                    value={toBackendRole(form.role)}
                    onChange={(val) => setForm({ ...form, role: val as CompetencePerson['role'] })}
                    options={CAB_PROFESSIONAL_ROLES.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
                  <label className={`block ${fieldLabelClassName}`}>{label('email')} {!person && '*'}
                    <input type="email" required={!person} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </label>
                  <div>
                    <label htmlFor="personnel-phone" className={`block ${fieldLabelClassName}`}>{label('phone')}</label>
                    <div className="mt-1">
                      <PhoneInputRow
                        rowClassName="gap-3"
                        value={form.phoneCountryCode}
                        onChange={(code) => setForm({ ...form, phoneCountryCode: code })}
                        aria-label={t('register.countryCode', 'Country code')}
                        className="border border-neutral-200"
                      >
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-blue-500">
                            <AppIcon icon={PhoneIcon} size={20} />
                          </span>
                          <input
                            id="personnel-phone"
                            type="tel"
                            lang="en"
                            dir="ltr"
                            placeholder="ex: 567XXXXXXXX"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className={cn(
                              fieldInputClassName,
                              fieldHeightClassName,
                              'ps-12',
                              phoneError && 'border-error-400 focus-within:ring-error-400',
                            )}
                          />
                        </div>
                      </PhoneInputRow>
                      {phoneError && <p className="mt-1 text-small-light text-error-500">{phoneError}</p>}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className={`mb-1.5 block ${fieldLabelClassName}`}>{label('image')}</span>
                  <div className="flex flex-wrap items-center gap-4 rounded-[12px] border border-dashed border-primary/30 bg-white p-4">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt={form.name} className="size-16 shrink-0 rounded-full object-cover shadow-xs" />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[16px] font-bold text-primary">
                        {(form.name || 'EM').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={readingImage}
                        onChange={uploadImage}
                        className="block w-full text-[13px] text-neutral-600 file:me-4 file:cursor-pointer file:rounded-[8px] file:border-0 file:bg-[#e8edfc] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-[#1236a3] hover:file:bg-[#dbe4fb]"
                      />
                      <span className="block text-[12px] font-normal text-neutral-500">{label('imageHelp')}</span>
                    </div>
                  </div>
                </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-employment-section">
        <div>
          <SectionHeading title={label('employmentDetails')} accordion>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={`block ${fieldLabelClassName}`}>{label('startDate')}</span>
                <div className="mt-1">
                  <DatePicker
                    value={fromIsoDate(form.employmentStartDate)}
                    onChange={(date) => setForm({ ...form, employmentStartDate: toIsoDate(date) })}
                  />
                </div>
              </div>
              <div>
                <span className={`block ${fieldLabelClassName}`}>{label('endDate')}</span>
                <div className="mt-1">
                  <DatePicker
                    value={fromIsoDate(form.employmentEndDate)}
                    onChange={(date) => setForm({ ...form, employmentEndDate: toIsoDate(date) })}
                  />
                </div>
              </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      <CabTourStep steps={tourSteps} stepId="profile-competence-section">
        <div>
          <SectionHeading title={label('competenceDetails')} accordion>
            <div className="grid gap-5 md:grid-cols-2">
                <fieldset>
                  <legend className={`mb-1 ${fieldLabelClassName}`}>{label('iafCodes')}</legend>
                  <MultiSelect tags={form.iafCodes} options={getIafCodeOptions(i18n.language)} onChange={(iafCodes) => setForm({ ...form, iafCodes })} searchable placeholder={label('iafCodes')} />
                </fieldset>
                <fieldset>
                  <legend className={`mb-1 ${fieldLabelClassName}`}>{t('cab.competence.columns.schemes')}</legend>
                  <MultiSelect tags={form.schemes} options={schemeOptions} searchable onChange={(schemes) => setForm({ ...form, schemes })} placeholder={t('cab.competence.columns.schemes')} />
                  <p className="mt-2 text-sm text-neutral-500">Additional schemes must first be configured in the <a className="text-primary underline" href="/cab/company-profile">CAB company profile</a> before they can be assigned.</p>
                </fieldset>
                <SearchableSelect id="personnel-sector" label={t('cab.competence.authorizedScope')} value={form.authorizedScope} options={sectorOptions} onChange={(authorizedScope) => setForm({ ...form, authorizedScope })} placeholder={t('cab.competence.authorizedScope')} />
                <SearchableSelect id="personnel-country" label={t('cab.competence.country')} value={form.country} options={countryOptions} onChange={(country) => setForm({ ...form, country })} placeholder={t('cab.competence.country')} />
                <div className="md:col-span-2">
                  <span className={`block ${fieldLabelClassName}`}>{t('cab.competence.memberProfile.expiryDate', 'Expiry (optional)')}</span>
                  <div className="mt-1 sm:max-w-sm">
                    <DatePicker
                      value={fromIsoDate(form.expiryDate)}
                      onChange={(date) => setForm({ ...form, expiryDate: toIsoDate(date) })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <span className={`mb-1.5 block ${fieldLabelClassName}`}>{label('qualifications')}</span>
                  <div className="rounded-[12px] border border-dashed border-primary/30 bg-white p-2">
                    <DocumentUploadField
                      title={label('qualifications')}
                      note={t('cab.competence.qualificationsDesc', 'PDF, Word, Images (max 20 MB)')}
                      files={qualFiles}
                      busy={uploadingQual || isSubmitting}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onSelectFile={handleSelectQualFile}
                      onDeleteFile={handleDeleteQualFile}
                      onOpenFile={handleOpenQualFile}
                    />
                  </div>
                  {pendingQualFiles.length > 0 && <p className="mt-2 text-sm text-neutral-500">Selected documents will upload when you save the profile.</p>}
                </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      {(error || errorDetails.length > 0) && (
        <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700 space-y-1">
          {error && <p className="font-semibold">{error}</p>}
          {errorDetails.map((msg, i) => (
            <p key={i}>• {msg}</p>
          ))}
        </div>
      )}

      <CabTourStep steps={tourSteps} stepId="profile-save-action">
        <div className="flex flex-wrap justify-end gap-3 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
          <Button variant="outline" type="button" disabled={isSubmitting || uploadingQual} onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={readingImage || isSubmitting || uploadingQual}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('cab.competence.savePerson')}
          </Button>
        </div>
      </CabTourStep>
    </form>
  )
}
