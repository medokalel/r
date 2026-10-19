import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { fieldInputClassName, fieldHeightClassName, fieldLabelClassName } from '@/components/ui/fieldStyles'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { getCountryOptions } from '@/lib/countries'
import { CAB_ACTIVITY_OPTIONS, getSchemeOptions } from '@/lib/api/cabSetupApi'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SECTOR_OPTIONS } from '@/components/dashboard/companyProfile/constants'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getIafCodeOptions } from '@/lib/iafCodes'
import { getStoredPersonnel, savePersonnelList, type CompetencePerson } from '@/lib/api/cabCompetenceApi'
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
import { getUserErrorMessage } from '@/lib/errorMessages'
import { toast } from '@/lib/toast'
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
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function includeSavedOptions(options: { value: string; label: string }[], saved: string[]) {
  return [...options, ...saved.filter((value) => value && !options.some((option) => option.value === value)).map((value) => ({ value, label: value }))]
}

export function PersonnelProfileForm({ person, onCancel, onSaved, tourSteps }: {
  person?: CompetencePerson
  onCancel: () => void
  onSaved: (person: CompetencePerson) => void
  tourSteps?: TourStepConfig[]
}) {
  const { t, i18n } = useTranslation()
  const label = (key: string) => t(`cab.competence.memberProfile.${key}`)
  const today = new Date()
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const [form, setForm] = useState({
    name: person?.name ?? '', role: person?.role ?? 'Auditor',
    email: person?.email ?? '', phone: person?.phone ?? '', avatarUrl: person?.avatarUrl ?? '',
    employmentStartDate: person?.employmentStartDate ?? localDate, employmentEndDate: person?.employmentEndDate ?? '',
    iafCodes: person?.iafCodes ?? [], qualifications: person?.qualifications ?? person?.evaluation?.highestQualification ?? '',
    country: person?.country ?? '', schemes: person?.schemes ?? [],
    authorizedScope: person?.authorizedScope ?? '', expiryDate: person?.expiryDate ?? '',
  })
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
      .catch(() => setCabSchemes([]))
  }, [])

  const baseSchemeOptions = cabSchemes.length > 0
    ? cabSchemes.map((name) => ({ value: name, label: name }))
    : [
        ...getSchemeOptions(CAB_ACTIVITY_OPTIONS.map((activity) => activity.value)).map((scheme) => ({
          value: scheme.label, label: scheme.label,
        })),
        ...STANDARD_SCHEMA_OPTIONS.map((scheme) => ({ value: scheme.name, label: `${scheme.name} — ${scheme.certificationType}` })),
        { value: 'HACCP', label: 'HACCP' },
      ]

  const schemeOptions = includeSavedOptions(baseSchemeOptions, form.schemes)

  const sectorOptions = includeSavedOptions(SECTOR_OPTIONS.map((sector) => ({
    value: t(`companyProfile.profileHeader.sectors.${sector.key}`, { lng: 'en' }),
    label: t(`companyProfile.profileHeader.sectors.${sector.key}`),
  })), [form.authorizedScope])

  const [error, setError] = useState('')
  const [readingImage, setReadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Qualification documents state (ICASCO DocumentUploadField)
  const [qualFiles, setQualFiles] = useState<UploadedDocumentFile[]>([])
  const [pendingQualFiles, setPendingQualFiles] = useState<{ id: string; file: File }[]>([])
  const [uploadingQual, setUploadingQual] = useState(false)

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
      .catch(() => {})
  }, [person?.id])

  const handleSelectQualFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError(t('cab.competence.messages.fileTooLarge'))
      return
    }
    setError('')

    if (person?.id && !person.id.startsWith('per-')) {
      setUploadingQual(true)
      try {
        const res = await uploadCabEmployeeQualification(person.id, file, 'Qualification Document')
        if (res.qualification) {
          const q = res.qualification
          setQualFiles((prev) => [
            {
              id: q.id,
              name: q.originalName || q.fileName || file.name,
              sizeLabel: formatFileSize(q.fileSize ?? file.size),
              dateLabel: q.uploadedAt ? new Date(q.uploadedAt).toLocaleDateString() : new Date().toLocaleDateString(),
              url: q.fileUrl,
            },
            ...prev,
          ])
          setForm((curr) => ({ ...curr, qualifications: file.name }))
        }
      } catch (err) {
        toast.error(getUserErrorMessage(err, t, { fallbackKey: 'cab.competence.messages.uploadFailed' }))
      } finally {
        setUploadingQual(false)
      }
    } else {
      const tempId = crypto.randomUUID()
      const objectUrl = URL.createObjectURL(file)
      setPendingQualFiles((prev) => [...prev, { id: tempId, file }])
      setQualFiles((prev) => [
        {
          id: tempId,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
          dateLabel: new Date().toLocaleDateString(),
          url: objectUrl,
        },
        ...prev,
      ])
      setForm((curr) => ({ ...curr, qualifications: file.name }))
    }
  }

  const handleDeleteQualFile = async (docId: string) => {
    const isPending = pendingQualFiles.some((p) => p.id === docId)
    if (isPending) {
      setPendingQualFiles((prev) => prev.filter((p) => p.id !== docId))
      setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      return
    }
    if (person?.id && !person.id.startsWith('per-')) {
      setUploadingQual(true)
      try {
        await deleteCabEmployeeQualification(person.id, docId)
        setQualFiles((prev) => prev.filter((f) => f.id !== docId))
      } catch (err) {
        toast.error(getUserErrorMessage(err, t, { fallbackKey: 'cab.competence.messages.deleteFailed' }))
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

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (readingImage || isSubmitting) return
    if (!form.name.trim()) { setError(label('nameRequired')); return }
    if (!person && !form.email.trim()) {
      setError(t('cab.competence.memberProfile.emailRequired', 'Email is required'))
      return
    }
    if (form.employmentStartDate && form.employmentEndDate && form.employmentEndDate < form.employmentStartDate) {
      setError(label('dateError'))
      return
    }

    setError('')

    let employeeId: string | undefined
    let employeeStatus: string | undefined
    let uploadedImageUrl: string | undefined
    const resolvedSchemes = form.schemes.map(
      (s) => cabSchemes.find((cs) => cs === s || cs.startsWith(`${s} — `)) ?? s,
    )

    if (!person) {
      setIsSubmitting(true)
      try {
        const rawPhone = form.phone.trim()
        const cleanPhone = rawPhone.startsWith('+966')
          ? rawPhone.slice(4).trim()
          : rawPhone.startsWith('00966')
            ? rawPhone.slice(5).trim()
            : rawPhone
        const formattedStartDate = form.employmentStartDate
          ? (form.employmentStartDate.includes('T') ? form.employmentStartDate : `${form.employmentStartDate}T00:00:00.000Z`)
          : undefined
        const res = await createCabEmployee({
          fullName: form.name.trim(),
          email: form.email.trim(),
          ...(cleanPhone ? { phone: cleanPhone, phoneCountryCode: '+966' } : {}),
          professionalRole: toBackendRole(form.role),
          ...(formattedStartDate ? { employmentStartDate: formattedStartDate } : {}),
          iafCodes: cleanIafCodes(form.iafCodes),
          schemes: resolvedSchemes,
        })
        employeeId = res.employee?.id
        employeeStatus = res.employee?.status

        if (imageFile && employeeId) {
          try {
            const imgRes = await uploadCabEmployeeImage(employeeId, imageFile)
            uploadedImageUrl = imgRes.imageUrl
          } catch (imgErr) {
            console.warn('Image upload failed, employee created:', imgErr)
          }
        }

        if (pendingQualFiles.length > 0 && employeeId) {
          for (const item of pendingQualFiles) {
            try {
              await uploadCabEmployeeQualification(employeeId, item.file, 'Qualification Document')
            } catch (qualErr) {
              console.warn('Qualification upload failed during creation:', qualErr)
            }
          }
        }
      } catch (err) {
        setIsSubmitting(false)
        toast.error(getUserErrorMessage(err, t, { fallbackKey: 'cab.competence.memberProfile.saveError' }))
        return
      }
      setIsSubmitting(false)
    } else {
      // Editing existing employee — call backend update
      setIsSubmitting(true)
      try {
        const formattedStartDate = form.employmentStartDate
          ? (form.employmentStartDate.includes('T') ? form.employmentStartDate : `${form.employmentStartDate}T00:00:00.000Z`)
          : undefined
        const updateRes = await updateCabEmployee(person.id, {
          professionalRole: toBackendRole(form.role),
          ...(formattedStartDate ? { employmentStartDate: formattedStartDate } : {}),
          iafCodes: cleanIafCodes(form.iafCodes),
          schemes: resolvedSchemes,
        })
        employeeId = person.id
        employeeStatus = updateRes.employee?.status || person.status

        if (imageFile) {
          try {
            const imgRes = await uploadCabEmployeeImage(person.id, imageFile)
            uploadedImageUrl = imgRes.imageUrl
          } catch (imgErr) {
            console.warn('Image upload failed during edit:', imgErr)
          }
        }
      } catch (err) {
        setIsSubmitting(false)
        toast.error(getUserErrorMessage(err, t, { fallbackKey: 'cab.competence.memberProfile.saveError' }))
        return
      }
      setIsSubmitting(false)
    }

    let saved: CompetencePerson
    try {
      const list = getStoredPersonnel()
      const existing = person ? list.find((item) => item.id === person.id) ?? person : undefined
      saved = {
        id: employeeId ?? (existing ? existing.id : crypto.randomUUID()),
        code: existing?.code ?? `PER-${String(Math.max(0, ...list.map((item) => Number(item.code.replace('PER-', '')) || 0)) + 1).padStart(4, '0')}`,
        status: (employeeStatus === 'ACTIVE' ? 'Authorized' : 'Under review'),
        statusDot: employeeStatus === 'INACTIVE' ? 'Inactive' : 'Active',
        ...existing,
        ...form,
        avatarUrl: uploadedImageUrl ?? form.avatarUrl,
        name: form.name.trim(),
        role: (CAB_PROFESSIONAL_ROLES.find((r) => r.value === toBackendRole(form.role))?.label ?? form.role) as CompetencePerson['role'],
        email: form.email.trim(),
        phone: form.phone.trim(),
      }
      const hasInList = existing ? list.some((item) => item.id === existing.id) : false
      savePersonnelList(hasInList && existing ? list.map((item) => item.id === existing.id ? saved : item) : [saved, ...list])
    } catch {
      setError(label('saveError'))
      return
    }
    onSaved(saved)
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
                <label className={`block ${fieldLabelClassName}`}>{t('cab.competence.role')}
                  <select
                    value={toBackendRole(form.role)}
                    onChange={(e) => setForm({ ...form, role: e.target.value as CompetencePerson['role'] })}
                    className={inputClass}
                  >
                    {CAB_PROFESSIONAL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-5 sm:grid-cols-2 md:col-span-2">
                  <label className={`block ${fieldLabelClassName}`}>{label('email')} {!person && '*'}
                    <input type="email" required={!person} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </label>
                  <label className={`block ${fieldLabelClassName}`}>{label('phone')}
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                  </label>
                </div>
                <label className={`block ${fieldLabelClassName}`}>{label('image')}
                  {form.avatarUrl && <img src={form.avatarUrl} alt={form.name} className="my-2 size-20 rounded-full object-cover" />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={readingImage} onChange={uploadImage} className="mt-2 block w-full rounded-[var(--radius-sm)] border border-dashed border-neutral-300 bg-white p-4 text-sm file:me-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-primary" />
                  <span className="mt-1 block text-xs font-normal text-neutral-500">{label('imageHelp')}</span>
                </label>
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
                </fieldset>
                <SearchableSelect id="personnel-sector" label={t('cab.competence.authorizedScope')} value={form.authorizedScope} options={sectorOptions} onChange={(authorizedScope) => setForm({ ...form, authorizedScope })} placeholder={t('cab.competence.authorizedScope')} />
                <SearchableSelect id="personnel-country" label={t('cab.competence.country')} value={form.country} options={countryOptions} onChange={(country) => setForm({ ...form, country })} placeholder={t('cab.competence.country')} />
                <div className="md:col-span-2">
                  <span className={`block ${fieldLabelClassName}`}>{t('cab.competence.columns.expiry')}</span>
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
                      busy={uploadingQual}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onSelectFile={handleSelectQualFile}
                      onDeleteFile={handleDeleteQualFile}
                      onOpenFile={handleOpenQualFile}
                    />
                  </div>
                </div>
            </div>
          </SectionHeading>
        </div>
      </CabTourStep>

      {error && (
        <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <CabTourStep steps={tourSteps} stepId="profile-save-action">
        <div className="flex flex-wrap justify-end gap-3 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
          <Button variant="outline" type="button" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={readingImage || isSubmitting}>
            {isSubmitting ? t('common.saving', 'Saving...') : t('cab.competence.savePerson')}
          </Button>
        </div>
      </CabTourStep>
    </form>
  )
}

