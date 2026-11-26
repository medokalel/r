import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type {
  AttendeeRecord,
  AuditExecutionData,
  AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { getStepBlockers, isNonconformingResult } from '@/lib/api/auditExecutionGates'
import { AttendanceSignaturePanel } from '@/components/cab/auditPlanning/AttendanceSignaturePanel'
import {
  ExecutionGateFooter,
  IsoDateField,
  formatIcascoDate,
} from '@/components/cab/auditPlanning/shared'
import { Checkbox } from '@/components/ui/Checkbox'
import { cabAuditReportingPath, cabStageReportPath } from '@/lib/routes'
import type { StageReportStatus } from '@/lib/api/stageReport'
import { cn } from '@/lib/utils'

/** Stored checklist result values stay English; labels map to locale keys. */
export const RESULT_LABEL_KEYS: Record<string, string> = {
  Conforming: 'conforming',
  Observation: 'observation',
  OFI: 'ofi',
  'Minor NC': 'minorNc',
  'Major NC': 'majorNc',
  'Not audited': 'notAudited',
  'N/A': 'notApplicable',
}

interface ExecutionOpeningStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  onUpdateExecution: (next: AuditExecutionData) => void
  onComplete: () => void
}

export function ExecutionOpeningStep({
  plan,
  execution,
  onUpdateExecution,
  onComplete,
}: ExecutionOpeningStepProps) {
  const { t } = useTranslation()
  const om = execution.openingMeeting
  const blockers = getStepBlockers(execution, 2)
  const update = (patch: Partial<AuditExecutionData['openingMeeting']>) =>
    onUpdateExecution({ ...execution, openingMeeting: { ...om, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.2')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.opening')}</p>
      </div>

      {/* Opening meeting confirmations */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.opening.title')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.opening.description')}</p>
        </div>

        <div className="space-y-2.5 text-[13px]">
          <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
            <Checkbox
              checked={om.agendaConfirmed}
              onChange={() => update({ agendaConfirmed: !om.agendaConfirmed })}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-neutral-900">{t('execution.opening.agendaConfirmed')}</p>
              <p className="text-[12px] text-neutral-500">{t('execution.opening.agendaConfirmedHint')}</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
            <Checkbox
              checked={om.confidentialityGiven}
              onChange={() => update({ confidentialityGiven: !om.confidentialityGiven })}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-neutral-900">{t('execution.opening.confidentiality')}</p>
              <p className="text-[12px] text-neutral-500">{t('execution.opening.confidentialityHint')}</p>
            </div>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-neutral-800">
            {t('execution.opening.notes')}
          </label>
          <textarea
            value={om.meetingNotes}
            onChange={(e) => update({ meetingNotes: e.target.value })}
            rows={3}
            className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px]"
          />
        </div>
      </section>

      {/* Agenda summary */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.opening.agendaTitle')}</h3>
        {plan.agendaActivities.length === 0 ? (
          <p className="text-[13px] text-neutral-500">{t('execution.opening.noAgenda')}</p>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
            <table className="w-full border-collapse text-start text-[14px]">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.opening.columns.date')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.opening.columns.time')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.opening.columns.activity')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.opening.columns.auditors')}</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">{t('execution.opening.columns.duration')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {plan.agendaActivities.map((act, idx) => (
                  <tr
                    key={act.id}
                    className={cn(
                      'transition-colors hover:bg-[#e8edfc]/40',
                      idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white',
                    )}
                  >
                    <td className="px-4 py-3.5 text-start text-[14px] font-medium text-neutral-800" dir="ltr">
                      {formatIcascoDate(act.date)}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[13px] text-neutral-600" dir="ltr">
                      {act.startTime} – {act.endTime}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[14px] font-medium text-neutral-900">
                      {act.activity}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[13px] text-neutral-700">
                      {act.auditors.join(', ')}
                    </td>
                    <td className="px-4 py-3.5 text-start text-[13px] font-semibold text-primary">
                      {act.durationHours.toFixed(1)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Opening meeting attendance */}
      <AttendanceSignaturePanel
        title={t('execution.attendance.titleOpening')}
        attendees={om.attendees}
        onAddAttendee={(att: AttendeeRecord) => update({ attendees: [...om.attendees, att] })}
        onRemoveAttendee={(id: string) =>
          update({ attendees: om.attendees.filter((a) => a.id !== id) })
        }
      />

      {/* To complete this step */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.complete', { step: t('execution.steps.2') })}
        onComplete={onComplete}
      />
    </div>
  )
}

interface ExecutionTeamReviewStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  nonconformingItems: number
  onUpdateExecution: (next: AuditExecutionData) => void
  onComplete: () => void
}

export function ExecutionTeamReviewStep({
  plan,
  execution,
  nonconformingItems,
  onUpdateExecution,
  onComplete,
}: ExecutionTeamReviewStepProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [wrapDate, setWrapDate] = useState(plan.proposedStartDate)
  const [wrapNotes, setWrapNotes] = useState('')
  const tr = execution.teamReview
  const blockers = getStepBlockers(execution, 4)

  const ncItems = execution.checklists.flatMap((sec) =>
    sec.items
      .filter((item) => isNonconformingResult(item.result))
      .map((item) => ({ section: sec.title, ...item })),
  )
  void nonconformingItems

  const update = (patch: Partial<AuditExecutionData['teamReview']>) =>
    onUpdateExecution({ ...execution, teamReview: { ...tr, ...patch } })

  const handleAddWrapUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wrapNotes.trim()) return
    update({
      dailyWrapUps: [
        ...tr.dailyWrapUps,
        { id: `wu-${Date.now()}`, date: wrapDate, notes: wrapNotes.trim() },
      ],
    })
    setWrapNotes('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.4')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.teamReview')}</p>
      </div>

      {/* Findings raised */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.teamReview.findingsTitle')}</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.teamReview.findingsDescription')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(cabAuditReportingPath(plan.planNumber))}
            className="text-[13px] font-semibold text-[#1236a3] hover:underline"
          >
            {t('execution.teamReview.openWorkspace')}
          </button>
        </div>

        {ncItems.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] py-4 text-center text-[13px] text-neutral-400">
            {t('execution.teamReview.noFindings')}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="execution-findings">
            {ncItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#ececec] px-3.5 py-2.5 text-[13px]"
              >
                <div className="min-w-0">
                  <span className="me-2 inline-block rounded-[4px] bg-[#eef2ff] px-2 py-0.5 text-[11px] font-bold text-[#1236a3]">
                    {item.clauseRef}
                  </span>
                  <span className="font-medium text-neutral-900">{item.title}</span>
                  <span className="ms-2 text-[12px] text-neutral-500">
                    {t(`execution.results.${RESULT_LABEL_KEYS[item.result] ?? 'notAudited'}`)}
                  </span>
                </div>
                {item.findingCode ? (
                  <span className="inline-flex items-center rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-[12px] font-semibold text-[#b91c1c]">
                    {t('execution.conduct.finding', { code: item.findingCode })}
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-[#b45309]">
                    {t('execution.blockers.ncWithoutFinding', { count: 1 })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Daily wrap-ups */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.teamReview.wrapUpsTitle')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.teamReview.wrapUpsDescription')}</p>
        </div>

        {tr.dailyWrapUps.length > 0 && (
          <div className="space-y-2">
            {tr.dailyWrapUps.map((w) => (
              <div key={w.id} className="rounded-[8px] border border-[#ececec] bg-[#f9fafc] p-3 text-[13px]">
                <span className="font-bold text-[#1236a3]" dir="ltr">{formatIcascoDate(w.date)}</span>
                <p className="mt-1 text-neutral-800">{w.notes}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddWrapUp} className="space-y-3">
          <div className="max-w-xs">
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.teamReview.date')}</label>
            <IsoDateField value={wrapDate} onChange={setWrapDate} className="[&_button]:h-10" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('execution.teamReview.wrapUp')}</label>
            <textarea
              value={wrapNotes}
              onChange={(e) => setWrapNotes(e.target.value)}
              rows={2}
              placeholder={t('execution.teamReview.wrapUpPlaceholder')}
              className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[8px] border border-[#1236a3] bg-white px-4 text-[13px] font-semibold text-[#1236a3] hover:bg-[#f3f6fd]"
          >
            {t('execution.teamReview.addWrapUp')}
          </button>
        </form>
      </section>

      {/* Grading consensus */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.teamReview.consensusTitle')}</h3>

        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3 text-[13px]">
          <Checkbox
            checked={tr.gradingConsensus}
            onChange={() => update({ gradingConsensus: !tr.gradingConsensus })}
            className="mt-0.5"
          />
          <div>
            <p className="font-semibold text-neutral-900">{t('execution.teamReview.consensus')}</p>
            <p className="text-[12px] text-neutral-500">{t('execution.teamReview.consensusHint')}</p>
          </div>
        </label>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            {t('execution.teamReview.notes')}
          </label>
          <textarea
            value={tr.internalTeamNotes}
            onChange={(e) => update({ internalTeamNotes: e.target.value })}
            rows={3}
            className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
          />
        </div>
      </section>

      {/* To complete this step */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.complete', { step: t('execution.steps.4') })}
        onComplete={onComplete}
      />
    </div>
  )
}

/** Stored client-position values stay English; labels map to locale keys. */
const CLIENT_POSITION_LABEL_KEYS: Record<string, string> = {
  Agrees: 'agreed',
  'Partly agrees': 'partiallyAgreed',
  Disagrees: 'disagreed',
}

interface ExecutionClosingStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  nonconformingItems: number
  daysSpent: number
  onUpdateExecution: (next: AuditExecutionData) => void
  onComplete: () => void
}

export function ExecutionClosingStep({
  plan,
  execution,
  nonconformingItems,
  daysSpent,
  onUpdateExecution,
  onComplete,
}: ExecutionClosingStepProps) {
  const { t } = useTranslation()
  const cm = execution.closingMeeting
  const blockers = getStepBlockers(execution, 5)
  const update = (patch: Partial<AuditExecutionData['closingMeeting']>) =>
    onUpdateExecution({ ...execution, closingMeeting: { ...cm, ...patch } })

  const plannedDays = plan.reviewedDurationDays || 2.5
  const diffPercent =
    daysSpent === 0 ? 0 : Math.round(((daysSpent - plannedDays) / plannedDays) * 100)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.5')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.closing')}</p>
      </div>

      {/* Closing meeting details */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.closing.title')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.closing.description')}</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3 text-[13px]">
          <Checkbox
            checked={cm.findingsPresented}
            onChange={() => update({ findingsPresented: !cm.findingsPresented })}
            className="mt-0.5"
          />
          <div>
            <p className="font-semibold text-neutral-900">
              {t('execution.closing.findingsPresented', { count: nonconformingItems })}
            </p>
            <p className="text-[12px] text-neutral-500">{t('execution.closing.findingsPresentedHint')}</p>
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-800">
            {t('execution.closing.clientPosition')}
          </span>
          <div className="flex flex-wrap gap-2">
            {(['Agrees', 'Partly agrees', 'Disagrees'] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => update({ clientPosition: pos })}
                className={cn(
                  'rounded-[8px] border px-4 py-2 text-[13px] font-semibold transition',
                  cm.clientPosition === pos
                    ? 'border-[#1236a3] bg-[#eef2ff] text-[#1236a3]'
                    : 'border-[#e2e2e2] bg-white text-neutral-700 hover:bg-neutral-50',
                )}
              >
                {t(`execution.closing.positions.${CLIENT_POSITION_LABEL_KEYS[pos]}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            {t('execution.closing.clientComments')}
          </label>
          <textarea
            value={cm.clientComments}
            onChange={(e) => update({ clientComments: e.target.value })}
            rows={2}
            placeholder={t('execution.closing.clientCommentsHint')}
            className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('execution.closing.ncDueDate')}
            </label>
            <IsoDateField
              value={cm.ncResponseDueBy}
              onChange={(val) => update({ ncResponseDueBy: val })}
              className="[&_button]:h-10"
            />
          </div>
          <span className="text-[13px] font-semibold text-neutral-700">
            {t('execution.closing.ncDueDateHint', { count: nonconformingItems })}
          </span>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            {t('execution.closing.notes')}
          </label>
          <textarea
            value={cm.closingNotes}
            onChange={(e) => update({ closingNotes: e.target.value })}
            rows={3}
            className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
          />
        </div>
      </section>

      {/* Audit time check */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.closing.timeTitle')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.closing.timeDescription')}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-4 text-center">
          <div>
            <span className="block text-[12px] text-neutral-500">{t('execution.closing.plannedDays')}</span>
            <span className="mt-1 block text-[18px] font-bold text-neutral-900">{plannedDays}</span>
          </div>
          <div>
            <span className="block text-[12px] text-neutral-500">{t('execution.closing.actualDays')}</span>
            <span className="mt-1 block text-[18px] font-bold text-[#1236a3]">{daysSpent}</span>
          </div>
          <div>
            <span className="block text-[12px] text-neutral-500">{t('execution.closing.variance')}</span>
            <span className="mt-1 block text-[18px] font-bold text-neutral-900">{diffPercent}%</span>
          </div>
        </div>
      </section>

      {/* Closing meeting attendance */}
      <AttendanceSignaturePanel
        title={t('execution.attendance.titleClosing')}
        attendees={cm.attendees}
        onAddAttendee={(att: AttendeeRecord) => update({ attendees: [...cm.attendees, att] })}
        onRemoveAttendee={(id: string) =>
          update({ attendees: cm.attendees.filter((a) => a.id !== id) })
        }
      />

      {/* To complete this step */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.complete', { step: t('execution.steps.5') })}
        onComplete={onComplete}
      />
    </div>
  )
}

interface ExecutionReportStepProps {
  execution: AuditExecutionData
  /** Plan number the stage report page opens for. */
  planNumber: string
  /** Stage report state once it exists (draft, in review, approved, issued...). */
  reportStatus?: StageReportStatus
  /** Hand-off data the stage report page (phase 3) will open with. */
  totalItems: number
  auditedItems: number
  findingsCount: number
  daysSpent: number
  onUpdateExecution: (next: AuditExecutionData) => void
  onComplete: () => void
}

export function ExecutionReportStep({
  execution,
  planNumber,
  reportStatus,
  totalItems,
  auditedItems,
  findingsCount,
  daysSpent,
  onUpdateExecution,
  onComplete,
}: ExecutionReportStepProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const openingCompleted = execution.completedSteps.includes(2)
  const blockers = getStepBlockers(execution, 6)
  const rpt = execution.report
  const update = (patch: Partial<AuditExecutionData['report']>) =>
    onUpdateExecution({ ...execution, report: { ...rpt, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.6')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.report')}</p>
      </div>

      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.reportStep.title')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.reportStep.description')}</p>
        </div>

        {!openingCompleted ? (
          <div className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] p-5 text-[13px] text-neutral-500">
            {t('execution.reportStep.noReport', 'The report opens when the opening meeting is completed.')}
          </div>
        ) : (
          <>
            {/* Hand-off to the Stage Report page: the data it will open with */}
            <dl
              className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-4 sm:grid-cols-3"
              data-testid="report-handoff"
            >
              <div>
                <dt className="text-[12px] text-neutral-500">
                  {t('execution.reportStep.checklistCoverage', 'Checklist coverage')}
                </dt>
                <dd className="mt-0.5 text-[13px] font-semibold text-neutral-900">
                  {t('execution.reportStep.coverageValue', { answered: auditedItems, total: totalItems })}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">
                  {t('execution.reportStep.findings', 'Findings')}
                </dt>
                <dd className="mt-0.5 text-[13px] font-semibold text-neutral-900">{findingsCount}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-neutral-500">
                  {t('execution.reportStep.timeDelivered', 'Time delivered')}
                </dt>
                <dd className="mt-0.5 text-[13px] font-semibold text-neutral-900">
                  {t('execution.reportStep.daysValue', { days: daysSpent })}
                </dd>
              </div>
            </dl>

            {rpt.handoffReady && (
              <p
                data-testid="handoff-ready"
                className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5 text-[13px] font-medium text-[#15803d]"
              >
                {t('execution.reportStep.handoffReadyState')}
              </p>
            )}

            <div>
              <button
                type="button"
                disabled={!rpt.handoffReady}
                onClick={() => navigate(cabStageReportPath(planNumber))}
                data-testid="open-stage-report"
                className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('execution.reportStep.open', 'Open stage report')}
              </button>
              {reportStatus ? (
                <p className="mt-1 text-[12px] font-medium text-neutral-600" data-testid="stage-report-state">
                  {t('execution.reportStep.reportState', { status: t(`stageReport.status.${reportStatus}`) })}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-neutral-400">
                  {rpt.handoffReady
                    ? t('execution.reportStep.openReadyHint')
                    : t('execution.reportStep.openPendingHint', 'Mark the hand-off ready to open the stage report.')}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                {t('execution.reportStep.executiveSummary')}
              </label>
              <textarea
                value={rpt.executiveSummary}
                onChange={(e) => update({ executiveSummary: e.target.value })}
                rows={3}
                placeholder={t('execution.reportStep.executiveSummaryPlaceholder')}
                className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                {t('execution.reportStep.recommendation')}
              </label>
              <textarea
                value={rpt.recommendation}
                onChange={(e) => update({ recommendation: e.target.value })}
                rows={2}
                className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#f0f0f0] pt-4">
              <button
                type="button"
                onClick={() => navigate(cabAuditReportingPath(planNumber))}
                className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {t('execution.reportStep.openRegister')}
              </button>
            </div>
          </>
        )}
      </section>

      {/* To complete this step: phase 2 prepares the hand-off only; the report
          is reviewed and issued from the stage report workspace (phase 3). */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.reportStep.markHandoffReady')}
        onComplete={onComplete}
        completeDisabled={blockers.length > 0 || rpt.handoffReady}
      />
    </div>
  )
}
