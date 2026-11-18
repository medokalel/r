import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  AttendeeRecord,
  AuditExecutionData,
  AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { AttendanceSignaturePanel } from '@/components/cab/auditPlanning/AttendanceSignaturePanel'
import { IsoDateField, formatIcascoDate } from '@/components/cab/auditPlanning/shared'
import { Checkbox } from '@/components/ui/Checkbox'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

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
  const om = execution.openingMeeting
  const update = (patch: Partial<AuditExecutionData['openingMeeting']>) =>
    onUpdateExecution({ ...execution, openingMeeting: { ...om, ...patch } })

  const hasSignedClient = om.attendees.some(
    (a) => a.organization === 'Client' && Boolean(a.signatureValue),
  )
  const hasTeamAttendee = om.attendees.some((a) => a.organization === 'Audit team')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">Opening meeting</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Confirm the agenda and confidentiality, test the remote tools and record who attended.
        </p>
      </div>

      {/* Opening meeting confirmations */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Opening meeting</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Introduce the team, confirm the plan, the scope and the rules of the audit.
          </p>
        </div>

        <div className="space-y-2.5 text-[13px]">
          <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
            <Checkbox
              checked={om.agendaConfirmed}
              onChange={() => update({ agendaConfirmed: !om.agendaConfirmed })}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-neutral-900">Agenda confirmed with the client</p>
              <p className="text-[12px] text-neutral-500">Times, interviewees and guides are agreed.</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
            <Checkbox
              checked={om.confidentialityGiven}
              onChange={() => update({ confidentialityGiven: !om.confidentialityGiven })}
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-neutral-900">Confidentiality statement given</p>
              <p className="text-[12px] text-neutral-500">
                The client was told how information obtained during the audit is protected.
              </p>
            </div>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-neutral-800">
            Opening meeting notes
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
        <h3 className="text-[15px] font-bold text-neutral-900">Agenda</h3>
        {plan.agendaActivities.length === 0 ? (
          <p className="text-[13px] text-neutral-500">The plan has no agenda yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
            <table className="w-full border-collapse text-start text-[14px]">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Date</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Time (AST)</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Activity</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Auditor(s)</th>
                  <th className="px-4 py-3.5 text-start text-[13px] font-medium">Duration</th>
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
        title="Opening meeting attendance"
        attendees={om.attendees}
        onAddAttendee={(att: AttendeeRecord) => update({ attendees: [...om.attendees, att] })}
        onRemoveAttendee={(id: string) =>
          update({ attendees: om.attendees.filter((a) => a.id !== id) })
        }
      />

      {/* To complete this step */}
      <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <p className="font-bold text-[#92400e]">To complete this step</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
            {!om.agendaConfirmed && <li>Confirm the agenda with the client.</li>}
            {!om.confidentialityGiven && <li>Confirm the confidentiality statement.</li>}
            {!hasSignedClient && <li>At least one client attendee must sign the attendance.</li>}
            {!hasTeamAttendee && <li>Add the audit team to the attendance.</li>}
            {om.agendaConfirmed && om.confidentialityGiven && hasSignedClient && hasTeamAttendee && (
              <li>All opening meeting requirements are satisfied.</li>
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
        >
          Complete: Opening meeting
        </button>
      </div>
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
  const [wrapDate, setWrapDate] = useState(plan.proposedStartDate)
  const [wrapNotes, setWrapNotes] = useState('')
  const tr = execution.teamReview

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
        <h2 className="text-[20px] font-bold text-neutral-900">Team review</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Record the daily wrap-ups and agree the grading of the findings.
        </p>
      </div>

      {/* Findings raised */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-bold text-neutral-900">Findings raised</h3>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Findings of the audit report. Edit or submit them in the reporting workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.cabAuditReporting)}
            className="text-[13px] font-semibold text-[#1236a3] hover:underline"
          >
            Open reporting workspace
          </button>
        </div>

        {nonconformingItems === 0 ? (
          <p className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] py-4 text-center text-[13px] text-neutral-400">
            No finding raised.
          </p>
        ) : (
          <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] p-3 text-[13px] font-medium text-[#b91c1c]">
            {nonconformingItems} nonconforming checklist item(s) recorded during Conduct.
          </div>
        )}
      </section>

      {/* Daily wrap-ups */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Daily wrap-ups</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            What the team agreed at the end of each audit day.
          </p>
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
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Date</label>
            <IsoDateField value={wrapDate} onChange={setWrapDate} className="[&_button]:h-10" />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Wrap-up</label>
            <textarea
              value={wrapNotes}
              onChange={(e) => setWrapNotes(e.target.value)}
              rows={2}
              placeholder="Summarize daily progress, evidence gaps, and next-day priorities..."
              className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[8px] border border-[#1236a3] bg-white px-4 text-[13px] font-semibold text-[#1236a3] hover:bg-[#f3f6fd]"
          >
            Add wrap-up
          </button>
        </form>
      </section>

      {/* Grading consensus */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h3 className="text-[15px] font-bold text-neutral-900">Grading consensus</h3>

        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3 text-[13px]">
          <Checkbox
            checked={tr.gradingConsensus}
            onChange={() => update({ gradingConsensus: !tr.gradingConsensus })}
            className="mt-0.5"
          />
          <div>
            <p className="font-semibold text-neutral-900">
              The team agrees on the grading of every finding
            </p>
            <p className="text-[12px] text-neutral-500">
              Major, minor, observation or opportunity, per the scheme rules.
            </p>
          </div>
        </label>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            Team review notes
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
      <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <p className="font-bold text-[#92400e]">To complete this step</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
            {tr.dailyWrapUps.length === 0 && <li>Record at least one team wrap-up.</li>}
            {!tr.gradingConsensus && <li>Confirm the team agreed the grading of the findings.</li>}
            {tr.dailyWrapUps.length > 0 && tr.gradingConsensus && (
              <li>All team review requirements are satisfied.</li>
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
        >
          Complete: Team review
        </button>
      </div>
    </div>
  )
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
  const cm = execution.closingMeeting
  const update = (patch: Partial<AuditExecutionData['closingMeeting']>) =>
    onUpdateExecution({ ...execution, closingMeeting: { ...cm, ...patch } })

  const plannedDays = plan.reviewedDurationDays || 2.5
  const diffPercent =
    daysSpent === 0 ? 0 : Math.round(((daysSpent - plannedDays) / plannedDays) * 100)
  const hasSignedClient = cm.attendees.some(
    (a) => a.organization === 'Client' && Boolean(a.signatureValue),
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">Closing meeting</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Present the findings, record the client's position, the response deadline and the signatures.
        </p>
      </div>

      {/* Closing meeting details */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Closing meeting</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Present the findings and the conclusions, agree the next steps and the response deadline.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3 text-[13px]">
          <Checkbox
            checked={cm.findingsPresented}
            onChange={() => update({ findingsPresented: !cm.findingsPresented })}
            className="mt-0.5"
          />
          <div>
            <p className="font-semibold text-neutral-900">
              Findings presented to the client ({nonconformingItems})
            </p>
            <p className="text-[12px] text-neutral-500">
              Each finding, its grading and the evidence were explained.
            </p>
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-neutral-800">
            Client's position on the findings
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
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            Client comments
          </label>
          <textarea
            value={cm.clientComments}
            onChange={(e) => update({ clientComments: e.target.value })}
            rows={2}
            placeholder="Record any disagreement and how it was resolved or left open."
            className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              Nonconformity response due by
            </label>
            <IsoDateField
              value={cm.ncResponseDueBy}
              onChange={(val) => update({ ncResponseDueBy: val })}
              className="[&_button]:h-10"
            />
          </div>
          <span className="text-[13px] font-semibold text-neutral-700">
            Nonconformities raised: {nonconformingItems}
          </span>
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            Closing meeting notes
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
          <h3 className="text-[15px] font-bold text-neutral-900">Audit time check</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Time delivered against the planned audit days (IAF MD 5).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-4 text-center">
          <div>
            <span className="block text-[12px] text-neutral-500">Planned days</span>
            <span className="mt-1 block text-[18px] font-bold text-neutral-900">{plannedDays}</span>
          </div>
          <div>
            <span className="block text-[12px] text-neutral-500">Days spent</span>
            <span className="mt-1 block text-[18px] font-bold text-[#1236a3]">{daysSpent}</span>
          </div>
          <div>
            <span className="block text-[12px] text-neutral-500">Difference</span>
            <span className="mt-1 block text-[18px] font-bold text-neutral-900">{diffPercent}%</span>
          </div>
        </div>
      </section>

      {/* Closing meeting attendance */}
      <AttendanceSignaturePanel
        title="Closing meeting attendance"
        attendees={cm.attendees}
        onAddAttendee={(att: AttendeeRecord) => update({ attendees: [...cm.attendees, att] })}
        onRemoveAttendee={(id: string) =>
          update({ attendees: cm.attendees.filter((a) => a.id !== id) })
        }
      />

      {/* To complete this step */}
      <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <p className="font-bold text-[#92400e]">To complete this step</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
            {!cm.findingsPresented && <li>Confirm the findings were presented to the client.</li>}
            {!cm.clientPosition && <li>Record whether the client agrees with the findings.</li>}
            {!hasSignedClient && (
              <li>At least one client attendee must sign the closing meeting attendance.</li>
            )}
            {execution.timeSpent.length === 0 && <li>Record the time spent by the audit team.</li>}
          </ul>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
        >
          Complete: Closing meeting
        </button>
      </div>
    </div>
  )
}

interface ExecutionReportStepProps {
  execution: AuditExecutionData
  onUpdateExecution: (next: AuditExecutionData) => void
  onFinalize: () => void
}

export function ExecutionReportStep({
  execution,
  onUpdateExecution,
  onFinalize,
}: ExecutionReportStepProps) {
  const navigate = useNavigate()
  const openingCompleted = execution.completedSteps.includes(2)
  const rpt = execution.report
  const update = (patch: Partial<AuditExecutionData['report']>) =>
    onUpdateExecution({ ...execution, report: { ...rpt, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">Report</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          The stage report is generated from the audit, reviewed, approved and issued to the client.
        </p>
      </div>

      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Stage report</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Generated from the plan, the checklist results and the findings.
          </p>
        </div>

        {!openingCompleted ? (
          <div className="rounded-[8px] border border-dashed border-[#e2e2e2] bg-[#f9fafc] p-5 text-[13px] text-neutral-500">
            The report opens when the opening meeting is completed.
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                Executive summary
              </label>
              <textarea
                value={rpt.executiveSummary}
                onChange={(e) => update({ executiveSummary: e.target.value })}
                rows={3}
                placeholder="Summarize the audit scope, strengths, areas of concern, and overall readiness..."
                className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                Lead auditor recommendation
              </label>
              <textarea
                value={rpt.recommendation}
                onChange={(e) => update({ recommendation: e.target.value })}
                rows={2}
                className="w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f0] pt-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.cabAuditReporting)}
                className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Open Audit Reporting register
              </button>

              <button
                type="button"
                onClick={onFinalize}
                className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
              >
                Finalize & submit report
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
