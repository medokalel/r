import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LEAD_STAGES,
  type LeadStageId,
  type SalesLead,
} from '@/lib/api/cabSalesHubApi'
import { cn } from '@/lib/utils'

interface SalesHubPipelineBoardProps {
  leads: SalesLead[]
  selectedLeadId: string | null
  onSelectLead: (leadId: string) => void
  onMoveStage: (leadId: string, stageId: LeadStageId) => void
}

export function SalesHubPipelineBoard({
  leads,
  selectedLeadId,
  onSelectLead,
  onMoveStage,
}: SalesHubPipelineBoardProps) {
  const { t } = useTranslation()
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStageId | null>(null)

  const sar = t('cab.salesHub.currencySar', 'SAR')

  const handleDrop = (targetStage: LeadStageId) => {
    if (draggedLeadId) {
      onMoveStage(draggedLeadId, targetStage)
    }
    setDraggedLeadId(null)
    setDragOverStage(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-neutral-500">
        {t('cab.salesHub.dragHint', 'Drag a card to another stage to move it.')}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {LEAD_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id)
          const stageValueSar = stageLeads.reduce(
            (sum, l) => sum + (Number(l.estimatedValueSar) || 0),
            0,
          )
          const isDragTarget = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragOverStage !== stage.id) setDragOverStage(stage.id)
              }}
              onDragLeave={() => {
                if (dragOverStage === stage.id) setDragOverStage(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(stage.id)
              }}
              className={cn(
                'flex min-h-[380px] flex-col gap-3 rounded-[16px] border bg-white p-4 transition-all',
                isDragTarget
                  ? 'border-primary bg-[#e8edfc]/30 ring-2 ring-primary/15'
                  : 'border-[#ececec]',
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                      stage.badgeClassName,
                    )}
                  >
                    {t(stage.labelKey, stage.defaultLabel)}
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-full bg-neutral-50 text-[12px] font-semibold text-neutral-600">
                    {stageLeads.length}
                  </span>
                </div>

                <p className="mt-2 min-h-[34px] text-[12px] leading-snug text-neutral-500">
                  {stageValueSar > 0
                    ? `${stageValueSar.toLocaleString()} ${sar}`
                    : t(stage.descriptionKey, stage.defaultDescription)}
                </p>
              </div>

              {stageLeads.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-[12px] border border-dashed border-neutral-200 bg-[#fcfcfd] px-3 text-center text-[12px] text-neutral-400">
                  {t('cab.salesHub.noLeadsHere', 'No leads here')}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {stageLeads.map((lead) => {
                    const completedCount = stage.checklist.filter((item) =>
                      lead.checklistCompleted.includes(item),
                    ).length
                    const isSelected = lead.id === selectedLeadId

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedLeadId(lead.id)}
                        onDragEnd={() => {
                          setDraggedLeadId(null)
                          setDragOverStage(null)
                        }}
                        onClick={() => onSelectLead(lead.id)}
                        className={cn(
                          'group cursor-grab rounded-[12px] border p-3.5 transition-all active:cursor-grabbing',
                          isSelected
                            ? 'border-primary bg-[#e8edfc]/35 ring-1 ring-primary'
                            : 'border-[#e2e2e2] bg-white hover:border-primary/40 hover:bg-neutral-50/40',
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-medium text-neutral-400">
                            {lead.leadCode}
                          </span>
                          <span className="text-[11px] font-medium text-neutral-500">
                            {completedCount}/{stage.checklist.length}{' '}
                            {t('cab.salesHub.tasks', 'tasks')}
                          </span>
                        </div>

                        <h3 className="mt-1 truncate text-[14px] font-semibold text-neutral-900 group-hover:text-primary">
                          {lead.companyName}
                        </h3>
                        <p className="mt-0.5 truncate text-[12px] text-neutral-500">
                          {lead.city} · {lead.owner}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {lead.standards.map((std) => (
                            <span
                              key={std}
                              className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-primary"
                            >
                              {std}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f0] pt-2.5 text-[12px]">
                          <span className="font-bold text-primary">
                            {lead.estimatedValueSar.toLocaleString()} {sar}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {lead.sites} {t('cab.salesHub.sitesLabel', 'sites')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
