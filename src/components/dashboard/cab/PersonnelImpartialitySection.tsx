import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon, EditIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SelectField } from '@/components/ui/Select'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  fieldHeightClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import {
  CAB_RELATIONSHIP_TYPES,
  createCabEmployeeImpartialityDeclaration,
  createCabEmployeeImpartialityRelationship,
  getRelationshipTypeLabel,
  updateCabEmployeeImpartialityRelationship,
  type CabDeclarationAnswer,
  type CabDeclarationType,
  type CabImpartialityDeclaration,
  type CabImpartialityRelationship,
  type CabRelationshipType,
} from '@/lib/api/cabEmployeesApi'
import { listCabClients, type CabAuditClientListItem } from '@/lib/api/clientRegistrationApi'
import { ApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const inputClass = `mt-1 ${fieldInputClassName} ${fieldHeightClassName}`

export type StagedOrSavedDeclaration = CabImpartialityDeclaration & { isStaged?: boolean }
export type StagedOrSavedRelationship = CabImpartialityRelationship & { isStaged?: boolean }

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

export interface PersonnelImpartialitySectionProps {
  savedEmployeeId?: string
  defaultSignedBy?: string
  declarations: StagedOrSavedDeclaration[]
  relationships: StagedOrSavedRelationship[]
  onChangeDeclarations: React.Dispatch<React.SetStateAction<StagedOrSavedDeclaration[]>>
  onChangeRelationships: React.Dispatch<React.SetStateAction<StagedOrSavedRelationship[]>>
  onError: (message: string, details?: string[]) => void
  disabled?: boolean
}

export function PersonnelImpartialitySection({
  savedEmployeeId,
  defaultSignedBy = '',
  declarations,
  relationships,
  onChangeDeclarations,
  onChangeRelationships,
  onError,
  disabled = false,
}: PersonnelImpartialitySectionProps) {
  const { t, i18n } = useTranslation()

  const today = new Date()
  const localDate = toIsoDate(today)

  const [cabClients, setCabClients] = useState<CabAuditClientListItem[]>([])

  // Declaration form state
  const [declType, setDeclType] = useState<CabDeclarationType>('ANNUAL')
  const [declAnswer, setDeclAnswer] = useState<CabDeclarationAnswer>('NO_CONFLICT')
  const [declSignedBy, setDeclSignedBy] = useState(defaultSignedBy)
  const [declSignedAt, setDeclSignedAt] = useState(localDate)
  const [declAuditRef, setDeclAuditRef] = useState('')
  const [savingDeclaration, setSavingDeclaration] = useState(false)

  // Relationship form state
  const [relClientId, setRelClientId] = useState('')
  const [relType, setRelType] = useState<CabRelationshipType>('CONSULTANCY')
  const [relStartDate, setRelStartDate] = useState(localDate)
  const [relEndDate, setRelEndDate] = useState('')
  const [relIsOngoing, setRelIsOngoing] = useState(true)
  const [relDescription, setRelDescription] = useState('')
  const [savingRelationship, setSavingRelationship] = useState(false)

  // Relationship inline edit state
  const [editingRelId, setEditingRelId] = useState<string | null>(null)
  const [editRelEndDate, setEditRelEndDate] = useState('')
  const [editRelIsOngoing, setEditRelIsOngoing] = useState(true)
  const [editRelDescription, setEditRelDescription] = useState('')
  const [updatingRelId, setUpdatingRelId] = useState<string | null>(null)

  useEffect(() => {
    if (!declSignedBy && defaultSignedBy.trim()) {
      setDeclSignedBy(defaultSignedBy.trim())
    }
  }, [defaultSignedBy, declSignedBy])

  useEffect(() => {
    listCabClients({ page: 1, limit: 100 })
      .then((res) => setCabClients(res?.items ?? []))
      .catch(() => {})
  }, [])

  const formatDisplayDate = (iso?: string | null) => {
    if (!iso) return '—'
    const clean = iso.split('T')[0]
    const parsed = new Date(`${clean}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return clean
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(parsed)
  }

  const handleRecordDeclaration = async () => {
    const signedBy = (declSignedBy || defaultSignedBy).trim()
    if (!signedBy) {
      onError(
        t(
          'cab.competence.impartiality.signedByRequired',
          'Please enter the name of the person who signed the declaration.',
        ),
      )
      return
    }
    if (!declSignedAt) {
      onError(
        t('cab.competence.impartiality.signedAtRequired', 'Please select the declaration date.'),
      )
      return
    }
    if (declType === 'AUDIT_SPECIFIC' && !declAuditRef.trim()) {
      onError(
        t(
          'cab.competence.impartiality.auditRefRequired',
          'Audit reference is required for audit-specific declarations.',
        ),
      )
      return
    }

    onError('', [])

    if (savedEmployeeId) {
      setSavingDeclaration(true)
      try {
        const { declaration } = await createCabEmployeeImpartialityDeclaration(savedEmployeeId, {
          declarationType: declType,
          answer: declAnswer,
          signedBy,
          signedAt: declSignedAt,
          ...(declType === 'AUDIT_SPECIFIC' ? { auditReference: declAuditRef.trim() } : {}),
        })
        onChangeDeclarations((prev) => [declaration, ...prev])
        setDeclAuditRef('')
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message, err.errors ?? [])
        } else {
          onError(
            t(
              'cab.competence.impartiality.declarationFailed',
              'Could not record impartiality declaration.',
            ),
          )
        }
      } finally {
        setSavingDeclaration(false)
      }
    } else {
      const calcValidUntil =
        declType === 'ANNUAL'
          ? (() => {
              const d = new Date(`${declSignedAt}T00:00:00`)
              d.setFullYear(d.getFullYear() + 1)
              return toIsoDate(d)
            })()
          : null

      const stagedDecl: StagedOrSavedDeclaration = {
        id: `staged-decl-${crypto.randomUUID()}`,
        isStaged: true,
        declarationType: declType,
        answer: declAnswer,
        signedBy,
        signedAt: declSignedAt,
        validUntil: calcValidUntil,
        auditReference: declType === 'AUDIT_SPECIFIC' ? declAuditRef.trim() : null,
        createdAt: new Date().toISOString(),
      }
      onChangeDeclarations((prev) => [stagedDecl, ...prev])
      setDeclAuditRef('')
    }
  }

  const handleRecordRelationship = async () => {
    if (!relClientId) {
      onError(
        t('cab.competence.impartiality.clientRequired', 'Please select a client organisation.'),
      )
      return
    }
    if (!relStartDate) {
      onError(
        t(
          'cab.competence.impartiality.startDateRequired',
          'Please select a relationship start date.',
        ),
      )
      return
    }
    if (!relIsOngoing && relEndDate && relEndDate < relStartDate) {
      onError(
        t(
          'cab.competence.memberProfile.dateError',
          'End date must be on or after the start date.',
        ),
      )
      return
    }

    onError('', [])

    const payload = {
      clientId: relClientId,
      relationshipType: relType,
      description: relDescription.trim() || null,
      startDate: relStartDate,
      endDate: relIsOngoing || !relEndDate ? null : relEndDate,
    }

    const matchedClient = cabClients.find((c) => c.id === relClientId)

    if (savedEmployeeId) {
      setSavingRelationship(true)
      try {
        const { relationship } = await createCabEmployeeImpartialityRelationship(
          savedEmployeeId,
          payload,
        )
        const enriched: CabImpartialityRelationship = {
          ...relationship,
          client:
            relationship.client ??
            (matchedClient ? { id: matchedClient.id, name: matchedClient.name } : null),
        }
        onChangeRelationships((prev) => [enriched, ...prev])
        setRelDescription('')
        setRelEndDate('')
        setRelIsOngoing(true)
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message, err.errors ?? [])
        } else {
          onError(
            t(
              'cab.competence.impartiality.relationshipFailed',
              'Could not record impartiality relationship.',
            ),
          )
        }
      } finally {
        setSavingRelationship(false)
      }
    } else {
      const stagedRel: StagedOrSavedRelationship = {
        id: `staged-rel-${crypto.randomUUID()}`,
        isStaged: true,
        clientId: relClientId,
        client: matchedClient ? { id: matchedClient.id, name: matchedClient.name } : null,
        relationshipType: relType,
        description: relDescription.trim() || null,
        startDate: relStartDate,
        endDate: relIsOngoing || !relEndDate ? null : relEndDate,
        isOngoing: relIsOngoing || !relEndDate,
      }
      onChangeRelationships((prev) => [stagedRel, ...prev])
      setRelDescription('')
      setRelEndDate('')
      setRelIsOngoing(true)
    }
  }

  const handleStartEditRelationship = (rel: StagedOrSavedRelationship) => {
    setEditingRelId(rel.id)
    const existingEnd = rel.endDate ? rel.endDate.split('T')[0] : ''
    setEditRelEndDate(existingEnd)
    setEditRelIsOngoing(!existingEnd)
    setEditRelDescription(rel.description ?? '')
  }

  const handleSaveRelationshipUpdate = async (rel: StagedOrSavedRelationship) => {
    const startPart = rel.startDate.split('T')[0]
    if (!editRelIsOngoing && editRelEndDate && editRelEndDate < startPart) {
      onError(
        t(
          'cab.competence.memberProfile.dateError',
          'End date must be on or after the start date.',
        ),
      )
      return
    }
    onError('', [])

    const nextEndDate = editRelIsOngoing || !editRelEndDate ? null : editRelEndDate
    const nextDescription = editRelDescription.trim() || null

    if (rel.isStaged || !savedEmployeeId) {
      onChangeRelationships((prev) =>
        prev.map((item) =>
          item.id === rel.id
            ? {
                ...item,
                endDate: nextEndDate,
                isOngoing: !nextEndDate,
                description: nextDescription,
              }
            : item,
        ),
      )
      setEditingRelId(null)
      return
    }

    setUpdatingRelId(rel.id)
    try {
      const { relationship } = await updateCabEmployeeImpartialityRelationship(
        savedEmployeeId,
        rel.id,
        {
          endDate: nextEndDate,
          description: nextDescription,
        },
      )
      onChangeRelationships((prev) =>
        prev.map((item) =>
          item.id === rel.id
            ? {
                ...item,
                ...relationship,
                client: relationship.client ?? item.client,
              }
            : item,
        ),
      )
      setEditingRelId(null)
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message, err.errors ?? [])
      } else {
        onError(
          t(
            'cab.competence.impartiality.updateRelationshipFailed',
            'Could not update impartiality relationship.',
          ),
        )
      }
    } finally {
      setUpdatingRelId(null)
    }
  }

  return (
    <div>
      <SectionHeading
        title={t(
          'cab.competence.impartiality.sectionTitle',
          'Impartiality & Conflict of Interest',
        )}
        accordion
      >
        <div className="space-y-6">
          {/* 1. Impartiality Declarations */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-bold text-neutral-900">
                {t(
                  'cab.competence.impartiality.declarationsTitle',
                  'Impartiality Declarations',
                )}
              </h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {t(
                  'cab.competence.impartiality.declarationsDesc',
                  'Record annual or audit-specific impartiality declarations. Declaration history is preserved and never overwritten.',
                )}
              </p>
            </div>

            <div className="space-y-4 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.declarationType', 'Declaration type')} *
                  </span>
                  <SelectField
                    value={declType}
                    onChange={(val) => setDeclType(val as CabDeclarationType)}
                    options={[
                      {
                        value: 'ANNUAL',
                        label: t(
                          'cab.competence.impartiality.types.ANNUAL',
                          'Annual (Valid 1 Year)',
                        ),
                      },
                      {
                        value: 'AUDIT_SPECIFIC',
                        label: t(
                          'cab.competence.impartiality.types.AUDIT_SPECIFIC',
                          'Audit-Specific',
                        ),
                      },
                    ]}
                  />
                </div>

                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.answer', 'Declaration outcome')} *
                  </span>
                  <SelectField
                    value={declAnswer}
                    onChange={(val) => setDeclAnswer(val as CabDeclarationAnswer)}
                    options={[
                      {
                        value: 'NO_CONFLICT',
                        label: t(
                          'cab.competence.impartiality.answers.NO_CONFLICT',
                          'No Conflict of Interest',
                        ),
                      },
                      {
                        value: 'DECLARES_RELATIONSHIPS',
                        label: t(
                          'cab.competence.impartiality.answers.DECLARES_RELATIONSHIPS',
                          'Declares Relationships / Conflict',
                        ),
                      },
                    ]}
                  />
                </div>

                <div>
                  <label className={`block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.signedBy', 'Signed by')} *
                    <input
                      type="text"
                      maxLength={150}
                      value={declSignedBy}
                      onChange={(e) => setDeclSignedBy(e.target.value)}
                      placeholder={
                        defaultSignedBy ||
                        t('cab.competence.impartiality.signedByPlaceholder', 'Full name')
                      }
                      className={cn(inputClass, 'bg-white')}
                    />
                  </label>
                </div>

                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.signedAt', 'Signed date')} *
                  </span>
                  <DatePicker
                    value={fromIsoDate(declSignedAt)}
                    onChange={(date) => setDeclSignedAt(toIsoDate(date))}
                  />
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
                {declType === 'AUDIT_SPECIFIC' ? (
                  <div className="flex-1 sm:max-w-sm">
                    <label className={`block ${fieldLabelClassName}`}>
                      {t('cab.competence.impartiality.auditReference', 'Audit reference')} *
                      <input
                        type="text"
                        maxLength={100}
                        value={declAuditRef}
                        onChange={(e) => setDeclAuditRef(e.target.value)}
                        placeholder={t(
                          'cab.competence.impartiality.auditRefPlaceholder',
                          'e.g. AUD-0306',
                        )}
                        className={cn(inputClass, 'bg-white')}
                      />
                    </label>
                  </div>
                ) : (
                  <p className="text-[12px] text-neutral-500">
                    {t(
                      'cab.competence.impartiality.annualValidityNote',
                      'Annual declarations automatically remain valid for 1 calendar year from the signed date.',
                    )}
                  </p>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingDeclaration || disabled}
                  icon={<AppIcon icon={AddCircleIcon} size={18} />}
                  onClick={() => void handleRecordDeclaration()}
                  className="h-11 shrink-0 whitespace-nowrap"
                >
                  {savingDeclaration
                    ? t('common.saving', 'Saving...')
                    : t('cab.competence.impartiality.recordDeclaration', 'Record declaration')}
                </Button>
              </div>
            </div>

            {declarations.length > 0 ? (
              <div className="overflow-x-auto rounded-[12px] border border-[#ececec] bg-white">
                <table className="w-full min-w-[680px] border-collapse text-center text-[13px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.declarationType', 'Type')}
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.answer', 'Outcome')}
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.auditReference', 'Audit Ref')}
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.signedBy', 'Signed by')}
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.signedAt', 'Signed date')}
                      </th>
                      <th className="px-3 py-3 font-medium whitespace-nowrap">
                        {t('cab.competence.impartiality.validUntil', 'Valid until')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {declarations.map((decl, idx) => (
                      <tr
                        key={decl.id}
                        className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-[#1236a3]">
                            {decl.declarationType === 'ANNUAL'
                              ? t('cab.competence.impartiality.types.ANNUAL', 'Annual')
                              : t(
                                  'cab.competence.impartiality.types.AUDIT_SPECIFIC',
                                  'Audit-Specific',
                                )}
                          </span>
                          {decl.isStaged && (
                            <span className="ms-1.5 inline-flex items-center rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              {t('cab.competence.impartiality.stagedBadge', 'Pending Save')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                              decl.answer === 'NO_CONFLICT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700',
                            )}
                          >
                            {decl.answer === 'NO_CONFLICT'
                              ? t(
                                  'cab.competence.impartiality.answers.NO_CONFLICT',
                                  'No Conflict',
                                )
                              : t(
                                  'cab.competence.impartiality.answers.DECLARES_RELATIONSHIPS',
                                  'Declares Relationships',
                                )}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-neutral-700" dir="ltr">
                          {decl.auditReference || '—'}
                        </td>
                        <td className="px-3 py-3 font-medium text-neutral-800">
                          {decl.signedBy}
                        </td>
                        <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                          {formatDisplayDate(decl.signedAt)}
                        </td>
                        <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                          <div className="flex items-center justify-center gap-2">
                            <span>{formatDisplayDate(decl.validUntil)}</span>
                            {decl.isStaged && (
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeDeclarations((prev) =>
                                    prev.filter((d) => d.id !== decl.id),
                                  )
                                }
                                className="rounded-[6px] p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                title={t('common.delete', 'Delete')}
                              >
                                <AppIcon icon={TrashIcon} size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-white py-4 text-center text-[13px] text-neutral-500">
                {t(
                  'cab.competence.impartiality.noDeclarations',
                  'No impartiality declarations recorded yet.',
                )}
              </p>
            )}
          </div>

          {/* 2. Declared Client Relationships (Conflict of Interest) */}
          <div className="space-y-4 border-t border-[#ececec] pt-6">
            <div>
              <h3 className="text-[15px] font-bold text-neutral-900">
                {t(
                  'cab.competence.impartiality.relationshipsTitle',
                  'Declared Client Relationships (Conflict of Interest)',
                )}
              </h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {t(
                  'cab.competence.impartiality.relationshipsDesc',
                  'Declare any consultancy, employment, internal audit, or financial relationships with CAB client organisations.',
                )}
              </p>
            </div>

            <div className="space-y-4 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SearchableSelect
                  id="impartiality-client-select"
                  label={`${t('cab.competence.impartiality.clientOrganisation', 'Client organisation')} *`}
                  value={relClientId}
                  options={cabClients.map((client) => ({
                    value: client.id,
                    label: client.tradeName
                      ? `${client.name} (${client.tradeName})`
                      : client.name,
                  }))}
                  onChange={setRelClientId}
                  placeholder={t(
                    'cab.competence.impartiality.selectClient',
                    'Select client organisation...',
                  )}
                />

                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.relationshipType', 'Relationship type')} *
                  </span>
                  <SelectField
                    value={relType}
                    onChange={(val) => setRelType(val as CabRelationshipType)}
                    options={CAB_RELATIONSHIP_TYPES.map((rt) => ({
                      value: rt.value,
                      label: t(
                        `cab.competence.impartiality.relationshipTypes.${rt.value}`,
                        rt.label,
                      ),
                    }))}
                  />
                </div>

                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.startDate', 'Start date')} *
                  </span>
                  <DatePicker
                    value={fromIsoDate(relStartDate)}
                    onChange={(date) => setRelStartDate(toIsoDate(date))}
                  />
                </div>

                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.endDate', 'End date (optional)')}
                  </span>
                  <DatePicker
                    disabled={relIsOngoing}
                    value={relIsOngoing ? undefined : fromIsoDate(relEndDate)}
                    onChange={(date) => {
                      setRelIsOngoing(false)
                      setRelEndDate(toIsoDate(date))
                    }}
                  />
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3 rounded-[8px] border border-[#ececec] bg-white px-4 py-2.5 select-none">
                <Checkbox
                  checked={relIsOngoing}
                  onChange={() => {
                    setRelIsOngoing((prev) => {
                      const next = !prev
                      if (next) setRelEndDate('')
                      return next
                    })
                  }}
                />
                <span className="text-[14px] font-medium text-neutral-800">
                  {t(
                    'cab.competence.impartiality.ongoingRelationship',
                    'Ongoing relationship (no end date)',
                  )}
                </span>
              </label>

              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className={`block ${fieldLabelClassName}`}>
                    {t('cab.competence.impartiality.description', 'Description (optional)')}
                    <input
                      type="text"
                      maxLength={500}
                      value={relDescription}
                      onChange={(e) => setRelDescription(e.target.value)}
                      placeholder={t(
                        'cab.competence.impartiality.descriptionPlaceholder',
                        'e.g. Provided ISO 9001 consultancy in 2023...',
                      )}
                      className={cn(inputClass, 'bg-white')}
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingRelationship || disabled}
                  icon={<AppIcon icon={AddCircleIcon} size={18} />}
                  onClick={() => void handleRecordRelationship()}
                  className="h-11 shrink-0 whitespace-nowrap"
                >
                  {savingRelationship
                    ? t('common.saving', 'Saving...')
                    : t('cab.competence.impartiality.recordRelationship', 'Record relationship')}
                </Button>
              </div>
            </div>

            {relationships.length > 0 ? (
              <div className="space-y-3">
                {relationships.map((rel) => {
                  const isEditing = editingRelId === rel.id
                  const isOngoing = rel.isOngoing ?? !rel.endDate
                  const clientName =
                    rel.client?.name ||
                    cabClients.find((c) => c.id === rel.clientId)?.name ||
                    rel.clientId

                  return (
                    <div
                      key={rel.id}
                      className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-bold text-neutral-900">
                              {clientName}
                            </span>
                            <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-[#1236a3]">
                              {t(
                                `cab.competence.impartiality.relationshipTypes.${rel.relationshipType}`,
                                getRelationshipTypeLabel(rel.relationshipType),
                              )}
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                                isOngoing
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-neutral-100 text-neutral-700',
                              )}
                            >
                              {isOngoing
                                ? t('cab.competence.impartiality.ongoing', 'Ongoing')
                                : t('cab.competence.impartiality.closed', 'Closed')}
                            </span>
                            {rel.isStaged && (
                              <span className="inline-flex items-center rounded-[4px] bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                {t('cab.competence.impartiality.stagedBadge', 'Pending Save')}
                              </span>
                            )}
                          </div>

                          <p className="text-[12px] text-neutral-500" dir="ltr">
                            {formatDisplayDate(rel.startDate)} →{' '}
                            {isOngoing
                              ? t('cab.competence.impartiality.ongoing', 'Ongoing')
                              : formatDisplayDate(rel.endDate)}
                          </p>

                          {rel.description && !isEditing && (
                            <p className="text-[13px] text-neutral-700">{rel.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              icon={<AppIcon icon={EditIcon} size={14} />}
                              onClick={() => handleStartEditRelationship(rel)}
                            >
                              {t(
                                'cab.competence.impartiality.updateRelationship',
                                'Update / Close',
                              )}
                            </Button>
                          )}
                          {rel.isStaged && (
                            <button
                              type="button"
                              onClick={() =>
                                onChangeRelationships((prev) =>
                                  prev.filter((r) => r.id !== rel.id),
                                )
                              }
                              className="rounded-[6px] p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                              title={t('common.delete', 'Delete')}
                            >
                              <AppIcon icon={TrashIcon} size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="space-y-3 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-3.5">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <span className={`mb-1 block ${fieldLabelClassName}`}>
                                {t('cab.competence.impartiality.endDate', 'End date')}
                              </span>
                              <DatePicker
                                disabled={editRelIsOngoing}
                                value={
                                  editRelIsOngoing ? undefined : fromIsoDate(editRelEndDate)
                                }
                                onChange={(date) => {
                                  setEditRelIsOngoing(false)
                                  setEditRelEndDate(toIsoDate(date))
                                }}
                              />
                            </div>

                            <div className="flex items-end">
                              <label className="inline-flex h-11 w-full cursor-pointer items-center gap-3 rounded-[8px] border border-[#ececec] bg-white px-3.5 select-none">
                                <Checkbox
                                  checked={editRelIsOngoing}
                                  onChange={() => {
                                    setEditRelIsOngoing((prev) => {
                                      const next = !prev
                                      if (next) setEditRelEndDate('')
                                      return next
                                    })
                                  }}
                                />
                                <span className="text-[13px] font-medium text-neutral-800">
                                  {t(
                                    'cab.competence.impartiality.ongoingRelationship',
                                    'Ongoing relationship (no end date)',
                                  )}
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className={`block ${fieldLabelClassName}`}>
                              {t('cab.competence.impartiality.description', 'Description')}
                              <input
                                type="text"
                                maxLength={500}
                                value={editRelDescription}
                                onChange={(e) => setEditRelDescription(e.target.value)}
                                className={cn(inputClass, 'bg-white')}
                              />
                            </label>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={updatingRelId === rel.id}
                              onClick={() => setEditingRelId(null)}
                            >
                              {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={updatingRelId === rel.id}
                              onClick={() => void handleSaveRelationshipUpdate(rel)}
                            >
                              {updatingRelId === rel.id
                                ? t('common.saving', 'Saving...')
                                : t('common.save', 'Save')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-white py-4 text-center text-[13px] text-neutral-500">
                {t(
                  'cab.competence.impartiality.noRelationships',
                  'No client conflict-of-interest relationships declared.',
                )}
              </p>
            )}
          </div>
        </div>
      </SectionHeading>
    </div>
  )
}
