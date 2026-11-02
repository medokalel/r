import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import type { CabAvailabilityPeriod } from '@/lib/api/cabEmployeesApi'
import { cn } from '@/lib/utils'

export interface EvaluationAvailabilitySectionProps {
  availabilityPeriods: CabAvailabilityPeriod[]
}

export function EvaluationAvailabilitySection({
  availabilityPeriods,
}: EvaluationAvailabilitySectionProps) {
  const { t } = useTranslation()

  return (
    <div>
      <SectionHeading
        title={t('cab.competence.availability.sectionTitle', 'Availability & Leave Periods')}
        accordion
      >
        {availabilityPeriods.length > 0 ? (
          <div className="overflow-x-auto rounded-[12px] border border-[#ececec] bg-white">
            <table className="w-full min-w-[540px] border-collapse text-center text-[13px]">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-3 py-3 font-medium whitespace-nowrap">
                    {t('cab.competence.availability.startDate', 'Start date')}
                  </th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">
                    {t('cab.competence.availability.endDate', 'End date')}
                  </th>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">
                    {t('cab.competence.availability.reason', 'Reason')}
                  </th>
                  <th className="px-3 py-3 font-medium">
                    {t('cab.competence.availability.notes', 'Notes')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {availabilityPeriods.map((period, idx) => (
                  <tr
                    key={period.id}
                    className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                  >
                    <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                      {period.startDate?.split('T')[0] || '—'}
                    </td>
                    <td className="px-3 py-3 text-neutral-700 whitespace-nowrap" dir="ltr">
                      {period.endDate?.split('T')[0] || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-[#1236a3]">
                        {period.reason}
                      </span>
                    </td>
                    <td className="max-w-[300px] px-3 py-3 text-neutral-600">
                      {period.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[10px] border border-dashed border-[#e2e2e2] bg-white py-4 text-center text-[13px] text-neutral-500">
            {t(
              'cab.competence.availability.noPeriods',
              'No availability or leave periods recorded yet.'
            )}
          </p>
        )}
      </SectionHeading>
    </div>
  )
}
