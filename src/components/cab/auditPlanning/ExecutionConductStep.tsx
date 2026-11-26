import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import type {
  AuditExecutionData,
  AuditPlan,
  ChecklistItem,
  ChecklistResultValue,
} from '@/lib/api/cabAuditPlanningApi'
import {
  getStepBlockers,
  isAuditedResultValue,
  isNonconformingResult,
} from '@/lib/api/auditExecutionGates'
import {
  ExecutionGateFooter,
  IcascoFileDropzone,
  IsoDateField,
  formatIcascoDate,
} from '@/components/cab/auditPlanning/shared'
import { RESULT_LABEL_KEYS } from '@/components/cab/auditPlanning/ExecutionMeetingReportSteps'
import { cn } from '@/lib/utils'

const RESULT_OPTIONS: ChecklistResultValue[] = [
  'Conforming',
  'Observation',
  'OFI',
  'Minor NC',
  'Major NC',
  'Not audited',
  'N/A',
]

export function isNonconforming(result: ChecklistResultValue) {
  return isNonconformingResult(result)
}

export function isAuditedResult(result: ChecklistResultValue) {
  return isAuditedResultValue(result)
}

interface ExecutionConductStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  totalItems: number
  auditedItems: number
  nonconformingItems: number
  daysSpent: number
  onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ChecklistItem>) => void
  onMarkAllConforming: (sectionId: string) => void
  /** Opens the Add finding form bound to this audit and checklist item. */
  onRaiseFinding: (sectionId: string, itemId: string) => void
  onAddTimeEntry: (entry: {
    auditor: string
    date: string
    hours: number
    activity: string
    remote: boolean
  }) => void
  onComplete: () => void
}

export function ExecutionConductStep({
  plan,
  execution,
  totalItems,
  auditedItems,
  nonconformingItems,
  daysSpent,
  onUpdateItem,
  onMarkAllConforming,
  onRaiseFinding,
  onAddTimeEntry,
  onComplete,
}: ExecutionConductStepProps) {
  const { t } = useTranslation()
  const blockers = getStepBlockers(execution, 3)
  const [activeChecklistId, setActiveChecklistId] = useState(
    execution.checklists[0]?.id || 'chk-stage1-readiness',
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unaudited' | 'nonconforming'>('all')
  const [expandedGuidance, setExpandedGuidance] = useState<Record<string, boolean>>({ 's1-1': true })

  // Time spent form
  const [timeAuditor, setTimeAuditor] = useState(plan.leadAuditor)
  const [timeDate, setTimeDate] = useState(plan.proposedStartDate)
  const [timeHours, setTimeHours] = useState(8)
  const [timeActivity, setTimeActivity] = useState(() => t('execution.time.activityPlaceholder'))
  const [timeRemote, setTimeRemote] = useState(false)

  const activeSection = useMemo(
    () => execution.checklists.find((c) => c.id === activeChecklistId) || execution.checklists[0] || null,
    [execution.checklists, activeChecklistId],
  )

  const openCount = activeSection
    ? activeSection.items.filter((i) => !isAuditedResult(i.result)).length
    : 0

  const filteredItems = useMemo(() => {
    if (!activeSection) return []
    const q = search.trim().toLowerCase()
    return activeSection.items.filter((item) => {
      if (filter === 'unaudited' && isAuditedResult(item.result)) return false
      if (filter === 'nonconforming' && !isNonconforming(item.result)) return false
      if (!q) return true
      return (
        item.clauseRef.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    })
  }, [activeSection, search, filter])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.3')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.conduct')}</p>
      </div>

      {/* Progress Card */}
      <section className="space-y-2.5 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.conduct.progressTitle')}</h3>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">
            {t('execution.conduct.answered', { answered: auditedItems, total: totalItems })}
          </span>
          <span className="font-semibold text-neutral-700">
            {t('execution.conduct.ncCount', { count: nonconformingItems })}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[#1236a3] transition-all"
            style={{ width: `${totalItems ? (auditedItems / totalItems) * 100 : 0}%` }}
          />
        </div>
      </section>

      {/* Live Checklists Card */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.conduct.checklistsTitle')}</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.conduct.checklistsDescription')}</p>
          </div>
          <span className="rounded-[6px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[11px] font-semibold text-[#15803d]">
            {t('execution.conduct.libraryBadge')}
          </span>
        </div>

        {/* Checklist Section Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#ececec] pb-2">
          {execution.checklists.map((sec) => {
            const secAudited = sec.items.filter((i) => isAuditedResult(i.result)).length
            const isActive = activeSection?.id === sec.id
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveChecklistId(sec.id)}
                className={cn(
                  'shrink-0 rounded-[8px] border px-3.5 py-2 text-[12px] font-semibold transition',
                  isActive
                    ? 'border-[#dce4f5] bg-[#f8faff] text-[#1236a3]'
                    : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
                )}
              >
                {sec.title} ({secAudited}/{sec.items.length})
              </button>
            )
          })}
        </div>

        {activeSection && (
          <>
            <p className="text-[12px] text-neutral-500">
              {t('execution.conduct.assignedTo', { name: activeSection.assignedAuditor })}
            </p>

            {/* Search, Filter Pills & Mark all as conforming */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('execution.conduct.search')}
                  className="h-10 w-60 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-800 focus:border-[#1236a3] focus:outline-none"
                />

                {[
                  { key: 'all', label: t('execution.conduct.filters.all') },
                  { key: 'unaudited', label: t('execution.conduct.filters.open') },
                  { key: 'nonconforming', label: t('execution.conduct.filters.nonconforming') },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key as typeof filter)}
                    className={cn(
                      'h-10 rounded-[8px] border px-3.5 text-[13px] font-medium transition',
                      filter === f.key
                        ? 'border-[#1236a3] bg-[#eef2ff] font-semibold text-[#1236a3]'
                        : 'border-[#e2e2e2] bg-white text-neutral-700 hover:bg-neutral-50',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onMarkAllConforming(activeSection.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[8px] bg-[#16a34a] px-4 text-[13px] font-semibold text-white transition hover:bg-[#15803d]"
              >
                <span>{t('execution.conduct.markAllConforming', { count: openCount })}</span>
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4 pt-2">
              {filteredItems.map((item) => {
                const showGuidance = Boolean(expandedGuidance[item.id])
                return (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-[10px] border border-[#e2e8f5] bg-white p-5"
                  >
                    <div>
                      <span className="inline-block rounded-[4px] bg-[#eef2ff] px-2.5 py-0.5 text-[11px] font-bold text-[#1236a3]">
                        {item.clauseRef}
                      </span>
                      <h4 className="mt-1.5 text-[15px] font-bold text-neutral-900">
                        {item.title}
                        {item.mandatory && <span className="ms-1 text-error-500">*</span>}
                      </h4>
                      <p className="mt-1 text-[13px] text-neutral-600">{item.description}</p>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGuidance((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                      >
                        {t(showGuidance ? 'execution.conduct.hideGuidance' : 'execution.conduct.showGuidance')}
                      </button>

                      {showGuidance && (
                        <div className="mt-2 space-y-2 rounded-[8px] border border-[#e8edfc] bg-[#f8faff] p-3.5 text-[12px]">
                          <p className="text-neutral-700">
                            <strong className="text-neutral-900">{t('execution.conduct.guidance')}:</strong>{' '}
                            {item.whatToLookFor}
                          </p>
                          <div>
                            <p className="font-semibold text-neutral-900">{t('execution.conduct.evidencePrompts')}</p>
                            <ul className="mt-1 list-disc space-y-0.5 ps-5 text-neutral-600">
                              {item.evidenceToAskFor.map((ev) => (
                                <li key={ev}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="mb-1.5 block text-[12px] font-semibold text-neutral-700">
                        {t('execution.conduct.result')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {RESULT_OPTIONS.map((resOpt) => {
                          const selected = item.result === resOpt
                          return (
                            <button
                              key={resOpt}
                              type="button"
                              onClick={() => onUpdateItem(activeSection.id, item.id, { result: resOpt })}
                              className={cn(
                                'rounded-[8px] border px-3 py-1.5 text-[12px] font-semibold transition',
                                selected
                                  ? resOpt === 'Conforming'
                                    ? 'border-[#16a34a] bg-[#dcfce7] text-[#15803d]'
                                    : isNonconforming(resOpt)
                                      ? 'border-[#dc2626] bg-[#fee2e2] text-[#b91c1c]'
                                      : 'border-[#1236a3] bg-[#eef2ff] text-[#1236a3]'
                                  : 'border-[#e2e2e2] bg-white text-neutral-700 hover:bg-neutral-50',
                              )}
                            >
                              {t(`execution.results.${RESULT_LABEL_KEYS[resOpt]}`)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                          {t('execution.conduct.notes')}
                        </label>
                        <textarea
                          value={item.evidenceNotes}
                          onChange={(e) =>
                            onUpdateItem(activeSection.id, item.id, { evidenceNotes: e.target.value })
                          }
                          placeholder={t('execution.conduct.notesPlaceholder')}
                          rows={2}
                          className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                            {t('execution.conduct.documentsSampled')}
                          </label>
                          <input
                            type="text"
                            value={item.documentsSampled}
                            onChange={(e) =>
                              onUpdateItem(activeSection.id, item.id, {
                                documentsSampled: e.target.value,
                              })
                            }
                            placeholder={t('execution.conduct.listPlaceholder')}
                            className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                            {t('execution.conduct.interviewees')}
                          </label>
                          <input
                            type="text"
                            value={item.peopleInterviewed}
                            onChange={(e) =>
                              onUpdateItem(activeSection.id, item.id, {
                                peopleInterviewed: e.target.value,
                              })
                            }
                            placeholder={t('execution.conduct.listPlaceholder')}
                            className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="mb-1.5 block text-[12px] font-medium text-neutral-700">
                          {t('execution.conduct.addPhoto')}
                        </label>
                        <IcascoFileDropzone
                          compact
                          fileName={item.photoName}
                          onSelectFile={(file) =>
                            onUpdateItem(activeSection.id, item.id, { photoName: file.name })
                          }
                          onClear={() =>
                            onUpdateItem(activeSection.id, item.id, { photoName: undefined })
                          }
                          hint={t('execution.dropzone.hintPhoto')}
                        />
                      </div>

                      {/* Raise finding: bound to this audit and checklist item */}
                      {isNonconforming(item.result) && (
                        <div className="border-t border-[#f0f0f0] pt-3">
                          {item.findingCode ? (
                            <span className="inline-flex items-center gap-1 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-[12px] font-semibold text-[#b91c1c]">
                              {t('execution.conduct.finding', { code: item.findingCode })}
                            </span>
                          ) : (
                            <button
                              type="button"
                              data-testid="raise-finding"
                              onClick={() => onRaiseFinding(activeSection.id, item.id)}
                              className="h-9 rounded-[8px] border border-[#fecaca] bg-white px-4 text-[12px] font-semibold text-[#b91c1c] transition hover:bg-[#fef2f2]"
                            >
                              {t('execution.conduct.raiseFinding', 'Raise finding')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredItems.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-[#e2e2e2] py-8 text-center text-[13px] text-neutral-500">
                  {t('execution.conduct.noMatch')}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Time Spent Card */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.time.title')}</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.time.description')}</p>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-neutral-600">
              <strong className="text-neutral-900">{t('execution.time.actual', { days: daysSpent })}</strong>
            </span>
            <span className="text-neutral-600">
              <strong className="text-[#1236a3]">{t('execution.time.planned', { days: plan.reviewedDurationDays })}</strong>
            </span>
          </div>
        </div>

        {execution.timeSpent.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] py-4 text-center text-[13px] text-neutral-400">
            {t('execution.time.notStarted')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
            <table className="w-full border-collapse text-start text-[14px]">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.time.auditor')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.time.date')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.time.hoursLabel')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.time.activity')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.time.mode')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {execution.timeSpent.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={cn(
                      'transition-colors hover:bg-[#e8edfc]/40',
                      idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white',
                    )}
                  >
                    <td className="px-4 py-3.5 text-start text-[14px] font-medium text-neutral-900">
                      {entry.auditor}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[13px] text-neutral-600" dir="ltr">
                      {formatIcascoDate(entry.date)}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[13px] font-semibold text-primary">
                      {entry.hours} h
                    </td>
                    <td className="px-4 py-3.5 text-start text-[14px] text-neutral-800">
                      {entry.activity}
                    </td>
                    <td className="px-4 py-3.5 text-start">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                          entry.remote
                            ? 'bg-[#e8edfc] text-primary'
                            : 'bg-[#ecfdf5] text-[#16a34a]',
                        )}
                      >
                        {t(entry.remote ? 'execution.time.remote' : 'execution.time.onSite')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (timeHours <= 0) return
            onAddTimeEntry({
              auditor: timeAuditor,
              date: timeDate,
              hours: timeHours,
              activity: timeActivity,
              remote: timeRemote,
            })
          }}
          className="grid grid-cols-1 gap-3 border-t border-[#f0f0f0] pt-4 sm:grid-cols-12 sm:items-end"
        >
          <div className="sm:col-span-3">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.time.auditor')}</label>
            <SelectField
              value={timeAuditor}
              onChange={setTimeAuditor}
              options={plan.auditTeam}
              className="h-10"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.time.date')}</label>
            <IsoDateField value={timeDate} onChange={setTimeDate} className="[&_button]:h-10" />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.time.hoursLabel')}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={timeHours}
              onChange={(e) => setTimeHours(parseFloat(e.target.value) || 0)}
              className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-2.5 text-[13px]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.time.activity')}</label>
            <input
              type="text"
              value={timeActivity}
              onChange={(e) => setTimeActivity(e.target.value)}
              className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[13px]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-neutral-700">
              <Checkbox checked={timeRemote} onChange={() => setTimeRemote((prev) => !prev)} />
              <span>{t('execution.time.remoteLabel')}</span>
            </label>
            <button
              type="submit"
              className="h-10 whitespace-nowrap rounded-[8px] bg-[#1236a3] px-3.5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
            >
              {t('execution.time.add')}
            </button>
          </div>
        </form>
      </section>

      {/* To complete this step */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.complete', { step: t('execution.steps.3') })}
        onComplete={onComplete}
      />
    </div>
  )
}
