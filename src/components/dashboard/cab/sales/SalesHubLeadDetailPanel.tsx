import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  AppIcon,
  CalendarIcon,
  CheckIcon,
  EditIcon,
  HistoryIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  DatePicker,
  formatDisplayDate,
  parseDisplayDate,
} from '@/components/ui/DatePicker'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import {
  LEAD_STAGES,
  type LeadStageId,
  type SalesLead,
} from '@/lib/api/cabSalesHubApi'
import { cabSalesHubEditPath, ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface SalesHubLeadDetailPanelProps {
  lead: SalesLead
  onToggleChecklist: (leadId: string, item: string) => void
  onMoveStage: (leadId: string, stageId: LeadStageId) => void
  onSaveNextAction: (leadId: string, actionText: string, actionDate: string) => void
}

type DetailTab = 'overview' | 'checklist' | 'activity'

export function SalesHubLeadDetailPanel({
  lead,
  onToggleChecklist,
  onMoveStage,
  onSaveNextAction,
}: SalesHubLeadDetailPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [nextActionInput, setNextActionInput] = useState('')
  const [nextActionDateInput, setNextActionDateInput] = useState('')

  useEffect(() => {
    setNextActionInput('')
    setNextActionDateInput('')
  }, [lead.id])

  const sar = t('cab.salesHub.currencySar', 'SAR')
  const currentStageIndex = LEAD_STAGES.findIndex((s) => s.id === lead.stage)
  const currentStage =
    LEAD_STAGES[currentStageIndex >= 0 ? currentStageIndex : 0]
  const prevStage =
    currentStageIndex > 0 ? LEAD_STAGES[currentStageIndex - 1] : null
  const nextStage =
    currentStageIndex < LEAD_STAGES.length - 1
      ? LEAD_STAGES[currentStageIndex + 1]
      : null

  const activities = lead.activities ?? []

  const handleSaveNextActionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nextActionInput.trim()) return
    onSaveNextAction(lead.id, nextActionInput.trim(), nextActionDateInput)
    setNextActionInput('')
    setNextActionDateInput('')
  }

  return (
    <section className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
      {/* Top Lead Identity & Badges */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-neutral-400">
            {lead.leadCode} · {lead.source}
          </p>
          <h2 className="mt-1 text-[24px] font-bold leading-tight text-neutral-900">
            {lead.companyName}
          </h2>

          {/* 3 Status / Value / Owner Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-[6px] px-3 py-1 text-[13px] font-semibold',
                currentStage.badgeClassName,
              )}
            >
              {t(currentStage.labelKey, currentStage.defaultLabel)}
            </span>

            <span className="inline-flex items-center rounded-[6px] bg-[#e8edfc] px-3 py-1 text-[13px] font-semibold text-primary">
              {lead.estimatedValueSar.toLocaleString()} {sar}
            </span>

            <span className="inline-flex items-center rounded-[6px] bg-[#f1f5f9] px-3 py-1 text-[13px] font-medium text-[#475569]">
              {lead.owner}
            </span>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          icon={<AppIcon icon={EditIcon} size={15} />}
        >
          <Link to={cabSalesHubEditPath(lead.id)}>
            {t('common.edit', 'Edit')}
          </Link>
        </Button>
      </div>

      {/* 6-Step Segmented Stage Progress Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {LEAD_STAGES.map((stage, idx) => {
          const isReached = idx <= currentStageIndex
          const isCurrent = idx === currentStageIndex

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onMoveStage(lead.id, stage.id)}
              className="group flex flex-col items-start text-start"
            >
              <div
                className={cn(
                  'h-2 w-full rounded-full transition-colors',
                  isReached
                    ? 'bg-primary'
                    : 'bg-neutral-200 group-hover:bg-primary/40',
                )}
              />
              <span
                className={cn(
                  'mt-2 text-[13px] leading-snug transition-colors',
                  isCurrent
                    ? 'font-bold text-neutral-900'
                    : 'font-normal text-neutral-500 group-hover:text-primary',
                )}
              >
                {t(stage.labelKey, stage.defaultLabel)}
              </span>
            </button>
          )
        })}
      </div>

      {/* iCASCO Segmented Tabs: Overview | Stage checklist | Activity (N) */}
      <div
        className="flex gap-1.5 overflow-x-auto rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-1.5"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={cn(
            'rounded-[8px] px-5 py-2 text-[14px] font-semibold transition-colors',
            activeTab === 'overview'
              ? 'bg-white text-primary shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900',
          )}
        >
          {t('cab.salesHub.tabs.overview', 'Overview')}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'checklist'}
          onClick={() => setActiveTab('checklist')}
          className={cn(
            'rounded-[8px] px-5 py-2 text-[14px] font-semibold transition-colors',
            activeTab === 'checklist'
              ? 'bg-white text-primary shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900',
          )}
        >
          {t('cab.salesHub.stageChecklist', 'Stage checklist')}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          className={cn(
            'rounded-[8px] px-5 py-2 text-[14px] font-semibold transition-colors',
            activeTab === 'activity'
              ? 'bg-white text-primary shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900',
          )}
        >
          {t('cab.salesHub.tabs.activity', 'Activity')} ({activities.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Structured Key-Value Rows */}
          <div className="divide-y divide-[#f0f0f0] rounded-[12px] border border-[#ececec] bg-white px-5">
            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.table.contact', 'Contact')}
              </span>
              <div className="text-end">
                <p className="text-[14px] font-semibold text-neutral-900">
                  {lead.contactPerson || '—'}
                </p>
                {lead.contactRole && (
                  <p className="text-[12px] text-neutral-500">
                    {lead.contactRole}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.email', 'Email')}
              </span>
              <span className="text-[14px] font-medium text-neutral-900">
                {lead.email || '—'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.phone', 'Phone')}
              </span>
              <span
                dir="ltr"
                className="text-[14px] font-medium text-neutral-900"
              >
                {lead.phone || '—'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.city', 'City')}
              </span>
              <span className="text-[14px] font-medium text-neutral-900">
                {lead.city || '—'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.sector', 'Sector')}
              </span>
              <span className="text-[14px] font-medium text-neutral-900">
                {lead.sector || '—'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.table.standards', 'Standards')}
              </span>
              <div className="flex flex-wrap justify-end gap-2">
                {lead.standards.map((std) => (
                  <span
                    key={std}
                    className="inline-flex items-center rounded-[8px] border border-[#c5d7fa] bg-[#f8faff] px-3 py-1 text-[13px] font-medium text-neutral-800"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.employees', 'Employees')}
              </span>
              <span className="text-[14px] font-semibold text-neutral-900">
                {lead.employees}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <span className="text-[14px] text-neutral-500">
                {t('cab.salesHub.modal.sites', 'Sites')}
              </span>
              <span className="text-[14px] font-semibold text-neutral-900">
                {lead.sites}
              </span>
            </div>
          </div>

          {/* Next Action Banner + Set Next Action Form (Image 1) */}
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#ececec] bg-white p-5">
            <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[#eaf1fe] px-4 py-3 text-[13px] text-[#1e3a5f]">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-4 w-1 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                <span>
                  {lead.nextAction ? (
                    <>
                      <strong className="font-semibold text-primary">
                        {t('cab.salesHub.nextAction.scheduled', 'Next action')}:
                      </strong>{' '}
                      {lead.nextAction}
                    </>
                  ) : (
                    t('cab.salesHub.nextAction.none', 'No next action')
                  )}
                </span>
              </div>
              {lead.nextActionDate && (
                <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-white px-2.5 py-0.5 text-[12px] font-medium text-primary">
                  <CalendarIcon className="size-3.5" />
                  {lead.nextActionDate}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveNextActionSubmit} className="space-y-3">
              <h3 className="text-[14px] font-semibold text-neutral-900">
                {t('cab.salesHub.nextAction.setTitle', 'Set next action')}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={nextActionInput}
                  onChange={(e) => setNextActionInput(e.target.value)}
                  placeholder={t(
                    'cab.salesHub.nextAction.placeholder',
                    'For example: follow-up call on proposal',
                  )}
                  className={cn(fieldInputClassName, fieldHeightClassName)}
                />
                <DatePicker
                  value={parseDisplayDate(nextActionDateInput)}
                  onChange={(date) =>
                    setNextActionDateInput(formatDisplayDate(date))
                  }
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={!nextActionInput.trim()}
                className="h-10 rounded-[8px] px-5 text-[14px]"
              >
                {t('common.save', 'Save')}
              </Button>
            </form>
          </div>

          {/* Current Stage Checklist & Move to Stage Side-by-Side */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-[14px] font-semibold text-neutral-900">
                {t('cab.salesHub.stageChecklist', 'Stage checklist')}
              </h3>
              <div className="mt-2.5 space-y-2">
                {currentStage.checklist.map((item) => {
                  const checked = lead.checklistCompleted.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onToggleChecklist(lead.id, item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-start text-[13px] transition-colors',
                        checked
                          ? 'border-[#bbf7d0] bg-[#eafaf1] text-[#16a34a]'
                          : 'border-[#e2e2e2] bg-white text-neutral-800 hover:bg-neutral-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-[5px] border',
                          checked
                            ? 'border-[#16a34a] bg-[#16a34a] text-white'
                            : 'border-neutral-300 bg-white',
                        )}
                      >
                        {checked && <AppIcon icon={CheckIcon} size={13} />}
                      </span>
                      <span className={cn(checked && 'line-through')}>
                        {item}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[14px] font-semibold text-neutral-900">
                {t('cab.salesHub.moveStage', 'Move to stage')}
              </h3>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {LEAD_STAGES.map((stage) => {
                  const isActive = lead.stage === stage.id
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => onMoveStage(lead.id, stage.id)}
                      className={cn(
                        'flex items-center justify-start rounded-[8px] border px-3.5 py-2.5 text-start text-[13px] font-semibold transition-colors',
                        isActive
                          ? 'border-primary bg-primary text-white'
                          : 'border-[#e2e2e2] bg-white text-neutral-700 hover:border-primary/40 hover:bg-neutral-50',
                      )}
                    >
                      {stage.stepNumber}.{' '}
                      {t(stage.labelKey, stage.defaultLabel)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL 6-STAGE CHECKLIST CARDS (Images 2, 3, 4, 5) */}
      {activeTab === 'checklist' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {LEAD_STAGES.map((stage) => {
              const completedInStage = stage.checklist.filter((item) =>
                lead.checklistCompleted.includes(item),
              ).length
              const totalInStage = stage.checklist.length
              const isAllDone = completedInStage === totalInStage
              const isCurrentStage = stage.id === lead.stage

              return (
                <div
                  key={stage.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-[16px] border bg-white p-5 transition-colors',
                    isCurrentStage
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-[#ececec]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[16px] font-bold text-neutral-900">
                      {stage.stepNumber}.{' '}
                      {t(stage.labelKey, stage.defaultLabel)}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-[6px] px-2.5 py-0.5 text-[12px] font-semibold',
                        isAllDone
                          ? 'bg-[#eafaf1] text-[#16a34a]'
                          : 'bg-[#f1f5f9] text-neutral-600',
                      )}
                    >
                      {completedInStage} / {totalInStage}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stage.checklist.map((item) => {
                      const checked = lead.checklistCompleted.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onToggleChecklist(lead.id, item)}
                          className="flex w-full items-center gap-3 rounded-[8px] py-1 text-start text-[14px] transition-colors hover:text-primary"
                        >
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                              checked
                                ? 'border-primary bg-primary text-white'
                                : 'border-neutral-300 bg-white',
                            )}
                          >
                            {checked && <AppIcon icon={CheckIcon} size={13} />}
                          </span>
                          <span
                            className={cn(
                              checked
                                ? 'text-neutral-500 line-through'
                                : 'font-medium text-neutral-800',
                            )}
                          >
                            {item}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="divide-y divide-[#f0f0f0] rounded-[12px] border border-[#ececec] bg-white px-5">
          {activities.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-neutral-400">
              {t('cab.salesHub.noActivity', 'No activity recorded yet.')}
            </p>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-4 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                    <AppIcon icon={HistoryIcon} size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900">
                      {act.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-neutral-500">
                      {act.actor}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[12px] text-neutral-400">
                  {act.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#f0f0f0] pt-4">
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-[10px] px-5 text-[14px]"
        >
          <Link to="/cab/clients/new">
            {t('cab.salesHub.actions.createAuditClient', 'Create audit client')}
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-11 rounded-[10px] px-5 text-[14px]"
        >
          <Link to={ROUTES.cabApplicationRegister}>
            {t('cab.salesHub.actions.openApplications', 'Open applications')}
          </Link>
        </Button>

        {prevStage && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onMoveStage(lead.id, prevStage.id)}
            className="h-11 rounded-[10px] px-5 text-[14px]"
          >
            {t(
              'cab.salesHub.actions.backToPreviousStage',
              'Back to previous stage',
            )}
          </Button>
        )}

        {nextStage && (
          <Button
            type="button"
            variant="primary"
            onClick={() => onMoveStage(lead.id, nextStage.id)}
            className="h-11 rounded-[10px] px-5 text-[14px]"
          >
            {t('cab.salesHub.actions.advanceStage', 'Advance to next stage')}
          </Button>
        )}
      </div>
    </section>
  )
}
