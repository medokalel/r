import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AppIcon, EditIcon } from '@/components/icons'
import {
  LEAD_STAGES,
  type LeadStageId,
  type SalesLead,
} from '@/lib/api/cabSalesHubApi'
import { cabSalesHubEditPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface SalesHubListTableProps {
  leads: SalesLead[]
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
  onMoveStage: (leadId: string, stageId: LeadStageId) => void
}

export function SalesHubListTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onMoveStage,
}: SalesHubListTableProps) {
  const { t, i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))
  const sar = t('cab.salesHub.currencySar', 'SAR')

  return (
    <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <p className="mb-4 px-5 text-[13px] text-neutral-500">
        {isAr
          ? `إجمالي النتائج: ${leads.length} فرصة مبيعات`
          : `Showing ${leads.length} sales lead(s)`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-start">
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className="px-5 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.company', 'Company')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.contact', 'Contact')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.standards', 'Standards')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.stage', 'Stage')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.estimatedValue', 'Estimated value')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.owner', 'Owner')}
              </th>
              <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.source', 'Source')}
              </th>
              <th className="px-5 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                {t('cab.salesHub.table.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] text-[14px]">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[14px] text-neutral-400"
                >
                  {t('cab.salesHub.noLeadsHere', 'No leads here')}
                </td>
              </tr>
            ) : (
              leads.map((lead, index) => {
                const stageCfg =
                  LEAD_STAGES.find((s) => s.id === lead.stage) ?? LEAD_STAGES[0]
                const isSelected = lead.id === selectedLeadId

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-[#e8edfc]/40',
                      isSelected
                        ? 'bg-[#e8edfc]/60'
                        : index % 2
                          ? 'bg-[#f9fafc]'
                          : 'bg-white',
                    )}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-[15px] font-semibold text-neutral-900">
                        {lead.companyName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        <span className="font-medium text-primary" dir="ltr">
                          {lead.leadCode}
                        </span>{' '}
                        · {lead.city} · {lead.sites}{' '}
                        {t('cab.salesHub.sitesLabel', 'sites')}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-[14px] font-medium text-neutral-800">
                        {lead.contactPerson || '—'}
                      </p>
                      <p
                        className="mt-0.5 text-[12px] text-neutral-500"
                        dir="ltr"
                      >
                        {lead.email || lead.phone || '—'}
                      </p>
                    </td>
                    <td className="max-w-[240px] px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.standards.map((std) => (
                          <span
                            key={std}
                            dir="ltr"
                            className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-primary whitespace-nowrap"
                          >
                            {std}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                          stageCfg.badgeClassName,
                        )}
                      >
                        {stageCfg.stepNumber}.{' '}
                        {t(stageCfg.labelKey, stageCfg.defaultLabel)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-neutral-900 whitespace-nowrap" dir="ltr">
                      {lead.estimatedValueSar.toLocaleString()}{' '}
                      <span className="font-normal text-neutral-500">
                        {sar}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-neutral-700 whitespace-nowrap">
                      {lead.owner}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-neutral-600 whitespace-nowrap">
                      {lead.source}
                    </td>
                    <td
                      className="px-5 py-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-center gap-2">
                        <select
                          aria-label={t('cab.salesHub.moveStage', 'Move stage')}
                          value={lead.stage}
                          onChange={(e) =>
                            onMoveStage(lead.id, e.target.value as LeadStageId)
                          }
                          className="h-9 rounded-[8px] border border-[#e2e2e2] bg-white px-2.5 text-[12px] font-medium text-neutral-700 focus:border-primary focus:outline-none"
                        >
                          {LEAD_STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.stepNumber}. {t(s.labelKey, s.defaultLabel)}
                            </option>
                          ))}
                        </select>
                        <Link
                          to={cabSalesHubEditPath(lead.id)}
                          aria-label={t('common.edit', 'Edit')}
                          className="flex size-9 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white text-neutral-600 transition-colors hover:border-primary hover:text-primary"
                        >
                          <AppIcon icon={EditIcon} size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
