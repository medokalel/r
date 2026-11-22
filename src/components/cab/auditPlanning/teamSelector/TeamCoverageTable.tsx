import { useTranslation } from 'react-i18next'
import { ROLE_LABELS } from '@/lib/teamSelection/catalog'
import type { TeamCoverage } from '@/lib/teamSelection/types'
import { cn } from '@/lib/utils'
import { useTeamLanguage } from './teamSelectorUtils'

/** Which team member covers each standard and IAF code (A = auditor, E = technical expert). */
export function TeamCoverageTable({ coverage }: { coverage: TeamCoverage }) {
  const { t } = useTranslation()
  const { language } = useTeamLanguage()
  const members = coverage.members.filter((member) => member.role !== 'OBSERVER')
  if (!members.length || (!coverage.standards.length && !coverage.iafCodes.length)) return null

  const rows = [
    ...coverage.standards.map((standard) => ({
      key: `s-${standard.key}`,
      label: standard.label,
      critical: false,
      cells: members.map((member) => (standard.coveredBy.includes(member.personId ?? '') ? 'A' : '')),
      covered: standard.coveredBy.length > 0,
    })),
    ...coverage.iafCodes.map((code) => ({
      key: `c-${code.code}`,
      label: `IAF ${code.code}`,
      critical: code.critical,
      cells: members.map((member) => {
        const via = code.coveredBy.find((entry) => entry.personId === member.personId)
        return via ? (via.via === 'auditor' ? 'A' : 'E') : ''
      }),
      covered: code.coveredBy.length > 0,
    })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-[12px] border border-neutral-100">
        <table className="w-full min-w-[420px] text-[12px]">
          <caption className="sr-only">{t('cab.auditPlanning.team.coverage.title', 'Team coverage')}</caption>
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold text-neutral-700">
                {t('cab.auditPlanning.team.coverage.scope', 'Standard or IAF code')}
              </th>
              {members.map((member) => (
                <th key={member.personId ?? member.name} scope="col" className="px-2 py-2 text-center font-semibold text-neutral-700">
                  <span className="block max-w-[110px] truncate">{member.name}</span>
                  <span className="block text-[11px] font-normal text-neutral-500">{ROLE_LABELS[member.role][language]}</span>
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-center font-semibold text-neutral-700">
                {t('cab.auditPlanning.team.coverage.status', 'Coverage')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-neutral-50">
                <th scope="row" className="whitespace-nowrap px-3 py-2 text-start font-medium text-neutral-800" dir="ltr">
                  {row.label}
                  {row.critical && (
                    <span className="ms-1 rounded-[4px] bg-[#fffbeb] px-1 text-[11px] text-[#92400e]">
                      {t('cab.auditPlanning.team.coverage.critical', 'critical')}
                    </span>
                  )}
                </th>
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-2 py-2 text-center">
                    {cell && (
                      <span
                        className={cn(
                          'inline-flex size-6 items-center justify-center rounded-full font-bold',
                          cell === 'A' ? 'bg-[#e8edfc] text-[#1236a3]' : 'bg-[#eff6ff] text-[#1d4ed8]',
                        )}
                        title={
                          cell === 'A'
                            ? t('cab.auditPlanning.team.coverage.auditor', 'Approved as auditor')
                            : t('cab.auditPlanning.team.coverage.expert', 'Technical expert (sector knowledge)')
                        }
                      >
                        {cell === 'A'
                          ? t('cab.auditPlanning.team.coverage.auditorShort', 'A')
                          : t('cab.auditPlanning.team.coverage.expertShort', 'E')}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span
                    className={cn(
                      'rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold',
                      row.covered ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fef2f2] text-[#b91c1c]',
                    )}
                  >
                    {row.covered
                      ? t('cab.auditPlanning.team.coverage.covered', 'Covered')
                      : t('cab.auditPlanning.team.coverage.missing', 'Not covered')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-neutral-600">
        {t(
          'cab.auditPlanning.team.coverage.legend',
          'A: approved auditor for that standard and code. E: technical expert, counts for sector knowledge only. Every code in scope needs a competent member.',
        )}
      </p>
    </div>
  )
}
