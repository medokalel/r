import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  getRelationshipTypeLabel,
  type CabImpartialityDeclaration,
  type CabImpartialityRelationship,
} from '@/lib/api/cabEmployeesApi'
import { cn } from '@/lib/utils'

export interface EvaluationImpartialitySectionProps {
  declarations: CabImpartialityDeclaration[]
  relationships: CabImpartialityRelationship[]
}

export function EvaluationImpartialitySection({
  declarations,
  relationships,
}: EvaluationImpartialitySectionProps) {
  const { t } = useTranslation()

  return (
    <div>
      <SectionHeading
        title={t(
          'cab.competence.impartiality.sectionTitle',
          'Impartiality & Conflict of Interest'
        )}
        accordion
      >
        <div className="space-y-6">
          {/* Impartiality Declarations */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-bold text-neutral-900">
              {t('cab.competence.impartiality.declarationsTitle', 'Impartiality Declarations')}
            </h3>

            {declarations.length > 0 ? (
              <div className="overflow-x-auto rounded-[12px] border border-[#ececec] bg-white">
                <table className="w-full min-w-[640px] border-collapse text-center text-[13px]">
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
                                  'Audit-Specific'
                                )}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                              decl.answer === 'NO_CONFLICT'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            )}
                          >
                            {decl.answer === 'NO_CONFLICT'
                              ? t(
                                  'cab.competence.impartiality.answers.NO_CONFLICT',
                                  'No Conflict'
                                )
                              : t(
                                  'cab.competence.impartiality.answers.DECLARES_RELATIONSHIPS',
                                  'Declares Relationships'
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
                          {decl.signedAt ? decl.signedAt.split('T')[0] : '—'}
                        </td>
                        <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                          {decl.validUntil ? decl.validUntil.split('T')[0] : '—'}
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
                  'No impartiality declarations recorded yet.'
                )}
              </p>
            )}
          </div>

          {/* Declared Client Relationships */}
          <div className="space-y-3 border-t border-[#ececec] pt-5">
            <h3 className="text-[15px] font-bold text-neutral-900">
              {t(
                'cab.competence.impartiality.relationshipsTitle',
                'Declared Client Relationships (Conflict of Interest)'
              )}
            </h3>

            {relationships.length > 0 ? (
              <div className="space-y-2.5">
                {relationships.map((rel) => {
                  const isOngoing = rel.isOngoing ?? !rel.endDate
                  return (
                    <div
                      key={rel.id}
                      className="space-y-1.5 rounded-[12px] border border-[#ececec] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-neutral-900">
                          {rel.client?.name || rel.clientId}
                        </span>
                        <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-[#1236a3]">
                          {t(
                            `cab.competence.impartiality.relationshipTypes.${rel.relationshipType}`,
                            getRelationshipTypeLabel(rel.relationshipType)
                          )}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                            isOngoing
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-neutral-100 text-neutral-700'
                          )}
                        >
                          {isOngoing
                            ? t('cab.competence.impartiality.ongoing', 'Ongoing')
                            : t('cab.competence.impartiality.closed', 'Closed')}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500" dir="ltr">
                        {rel.startDate?.split('T')[0] || '—'} →{' '}
                        {isOngoing
                          ? t('cab.competence.impartiality.ongoing', 'Ongoing')
                          : rel.endDate?.split('T')[0] || '—'}
                      </p>
                      {rel.description && (
                        <p className="text-[13px] text-neutral-700">{rel.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-white py-4 text-center text-[13px] text-neutral-500">
                {t(
                  'cab.competence.impartiality.noRelationships',
                  'No client conflict-of-interest relationships declared.'
                )}
              </p>
            )}
          </div>
        </div>
      </SectionHeading>
    </div>
  )
}
