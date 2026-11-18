import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import type {
  AuditExecutionData,
  AuditPlan,
  ChecklistItem,
  ChecklistResultValue,
} from '@/lib/api/cabAuditPlanningApi'
import { IcascoFileDropzone, IsoDateField, formatIcascoDate } from '@/components/cab/auditPlanning/shared'
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
  return result === 'Minor NC' || result === 'Major NC'
}

export function isAuditedResult(result: ChecklistResultValue) {
  return result !== '' && result !== 'Not audited'
}

interface ExecutionConductStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  totalItems: number
  auditedItems: number
  nonconformingItems: number
  mandatoryUnauditedCount: number
  daysSpent: number
  onUpdateItem: (sectionId: string, itemId: string, patch: Partial<ChecklistItem>) => void
  onMarkAllConforming: (sectionId: string) => void
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
  mandatoryUnauditedCount,
  daysSpent,
  onUpdateItem,
  onMarkAllConforming,
  onAddTimeEntry,
  onComplete,
}: ExecutionConductStepProps) {
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
  const [timeActivity, setTimeActivity] = useState('On-site audit, document review')
  const [timeRemote, setTimeRemote] = useState(false)

  const activeSection = useMemo(
    () => execution.checklists.find((c) => c.id === activeChecklistId) || execution.checklists[0] || null,
    [execution.checklists, activeChecklistId],
  )

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
        <h2 className="text-[20px] font-bold text-neutral-900">Conduct</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Fill the checklists with results and evidence, take photos and raise findings.
        </p>
      </div>

      {/* Progress Card */}
      <section className="space-y-2.5 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h3 className="text-[15px] font-bold text-neutral-900">Progress</h3>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-neutral-600">
            {auditedItems} of {totalItems} items audited
          </span>
          <span className="font-semibold text-neutral-700">
            Nonconforming items: {nonconformingItems}
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
            <h3 className="text-[15px] font-bold text-neutral-900">Live checklists</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Record a result for each requirement with the evidence seen. Changes save as you go.
            </p>
          </div>
          <span className="rounded-[6px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[11px] font-semibold text-[#15803d]">
            iCASCO library, approved
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
              Assigned to:{' '}
              <span className="font-semibold text-neutral-800">{activeSection.assignedAuditor}</span>
            </p>

            {/* Search, Filter Pills & Mark all as conforming */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clause or requirement"
                  className="h-10 w-60 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-800 focus:border-[#1236a3] focus:outline-none"
                />

                {[
                  { key: 'all', label: 'All' },
                  { key: 'unaudited', label: 'Not yet audited' },
                  { key: 'nonconforming', label: 'Nonconforming' },
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
                <span>✓</span>
                <span>Mark all as conforming</span>
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
                        {showGuidance ? 'Hide guidance' : 'Guidance and evidence prompts'}
                      </button>

                      {showGuidance && (
                        <div className="mt-2 space-y-2 rounded-[8px] border border-[#e8edfc] bg-[#f8faff] p-3.5 text-[12px]">
                          <p className="text-neutral-700">
                            <strong className="text-neutral-900">What to look for:</strong>{' '}
                            {item.whatToLookFor}
                          </p>
                          <div>
                            <p className="font-semibold text-neutral-900">Evidence to ask for</p>
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
                        Result
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
                              {resOpt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                          Evidence notes
                        </label>
                        <textarea
                          value={item.evidenceNotes}
                          onChange={(e) =>
                            onUpdateItem(activeSection.id, item.id, { evidenceNotes: e.target.value })
                          }
                          placeholder="What you saw, heard and read"
                          rows={2}
                          className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                            Documents sampled
                          </label>
                          <input
                            type="text"
                            value={item.documentsSampled}
                            onChange={(e) =>
                              onUpdateItem(activeSection.id, item.id, {
                                documentsSampled: e.target.value,
                              })
                            }
                            placeholder="Separate with commas"
                            className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                            People interviewed
                          </label>
                          <input
                            type="text"
                            value={item.peopleInterviewed}
                            onChange={(e) =>
                              onUpdateItem(activeSection.id, item.id, {
                                peopleInterviewed: e.target.value,
                              })
                            }
                            placeholder="Separate with commas"
                            className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1">
                        <label className="mb-1.5 block text-[12px] font-medium text-neutral-700">
                          Take or add photo
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
                          hint="PNG or JPG up to 5 MB"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredItems.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-[#e2e2e2] py-8 text-center text-[13px] text-neutral-500">
                  No checklist items match your filter.
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
            <h3 className="text-[15px] font-bold text-neutral-900">Time spent</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Record the team's time each day. It is compared with the planned audit days (IAF MD 5) and added to the competence audit log.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-neutral-600">
              Spent: <strong className="text-neutral-900">{daysSpent} days</strong>
            </span>
            <span className="text-neutral-600">
              Planned: <strong className="text-[#1236a3]">{plan.reviewedDurationDays} days</strong>
            </span>
          </div>
        </div>

        {execution.timeSpent.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] py-4 text-center text-[13px] text-neutral-400">
            No time recorded
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
            <table className="w-full border-collapse text-start text-[14px]">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Auditor</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Date</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Hours</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Activity</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Mode</th>
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
                        {entry.remote ? 'Remote' : 'On-site'}
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
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Auditor</label>
            <SelectField
              value={timeAuditor}
              onChange={setTimeAuditor}
              options={plan.auditTeam}
              className="h-10"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Date</label>
            <IsoDateField value={timeDate} onChange={setTimeDate} className="[&_button]:h-10" />
          </div>

          <div className="sm:col-span-1">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Hours</label>
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
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Activity</label>
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
              <span>Remote</span>
            </label>
            <button
              type="submit"
              className="h-10 whitespace-nowrap rounded-[8px] bg-[#1236a3] px-3.5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
            >
              Add time
            </button>
          </div>
        </form>
      </section>

      {/* To complete this step */}
      <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <p className="font-bold text-[#92400e]">To complete this step</p>
          <p className="mt-1 text-[12px] text-[#b45309]">
            Mandatory checklist items without a result: <strong>{mandatoryUnauditedCount}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
        >
          Complete: Conduct
        </button>
      </div>
    </div>
  )
}
