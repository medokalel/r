import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppIcon, TrashIcon } from '@/components/icons'
import {
  LIBRARY_EXTRA_CHECKLISTS,
  type AuditExecutionData,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface ExecutionPreparationStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  onUpdateExecution: (next: AuditExecutionData) => void
  onAddChecklist: (libraryId: string) => void
  onComplete: () => void
}

function ReadinessRow({
  done,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  done: boolean
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border border-[#ececec] px-4 py-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
            done ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#d97706]',
          )}
        >
          {done ? '✓' : '!'}
        </span>
        <div>
          <p className="font-semibold text-neutral-900">{title}</p>
          <p className="text-[12px] text-neutral-500">{subtitle}</p>
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="font-semibold text-[#1236a3] hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function ExecutionPreparationStep({
  plan,
  execution,
  onUpdateExecution,
  onAddChecklist,
  onComplete,
}: ExecutionPreparationStepProps) {
  const navigate = useNavigate()
  const [selectedExtraChecklist, setSelectedExtraChecklist] = useState('')
  const { preparation } = execution

  const updatePrep = (patch: Partial<AuditExecutionData['preparation']>) =>
    onUpdateExecution({ ...execution, preparation: { ...preparation, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">Preparation</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Confirm the plan, the agreement and the team, review the client documents and assign the checklists.
        </p>
      </div>

      {/* Readiness Card */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Readiness</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            What must be in place before the audit starts.
          </p>
        </div>

        {!preparation.agreementActive && (
          <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] p-4 text-[13px]">
            <p className="font-bold text-[#b91c1c]">This plan cannot be sent yet</p>
            <p className="mt-1 text-[#991b1b]">
              Stage 1, Stage 2 and recertification audits need an active certification agreement with the client (signed by the client and countersigned by you).
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.cabCertificationAgreements)}
                className="font-semibold text-[#b91c1c] underline hover:text-[#7f1d1d]"
              >
                Open agreement {preparation.agreementId}
              </button>
              <button
                type="button"
                onClick={() =>
                  updatePrep({
                    agreementActive: true,
                    planSentToClient: true,
                    planConfirmedByClient: true,
                  })
                }
                className="rounded-[6px] border border-[#fecaca] bg-white px-3 py-1 text-[12px] font-semibold text-[#b91c1c] hover:bg-[#fee2e2]"
              >
                Mark agreement active (demo)
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5 text-[13px]">
          <ReadinessRow
            done={preparation.planSentToClient}
            title="Audit plan sent to the client"
            subtitle={preparation.planSentToClient ? 'Plan sent to primary contact.' : 'The plan is still a draft.'}
            actionLabel="Open plan"
            onAction={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
          />
          <ReadinessRow
            done={preparation.planConfirmedByClient}
            title="Plan confirmed by the client"
            subtitle={
              preparation.planConfirmedByClient
                ? 'Confirmed by client contact.'
                : "Waiting for the client's confirmation."
            }
          />
          <ReadinessRow
            done={preparation.declarationsCompleted}
            title="Team availability and impartiality declarations"
            subtitle={
              preparation.declarationsCompleted
                ? 'All team declarations completed on the audit plan.'
                : 'Complete the declarations on the audit plan.'
            }
          />
          <ReadinessRow
            done={preparation.agreementActive}
            title="Certification agreement"
            subtitle={
              preparation.agreementActive
                ? `Active agreement ${preparation.agreementId} countersigned.`
                : 'No active agreement: the plan cannot be sent until the client signs it.'
            }
            actionLabel="Open agreement"
            onAction={() => navigate(ROUTES.cabCertificationAgreements)}
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
            <Checkbox
              checked={preparation.clientDocumentsReviewed}
              onChange={() =>
                updatePrep({ clientDocumentsReviewed: !preparation.clientDocumentsReviewed })
              }
              className="mt-0.5"
            />
            <div>
              <p className="font-semibold text-neutral-900">Client documents reviewed</p>
              <p className="text-[12px] text-neutral-500">
                Manual, procedures, previous reports and the internal audit and management review records.
              </p>
            </div>
          </label>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="block text-[13px] font-medium text-neutral-800">Preparation notes</label>
          <textarea
            value={preparation.preparationNotes}
            onChange={(e) => updatePrep({ preparationNotes: e.target.value })}
            rows={3}
            placeholder="Record document review findings or pre-audit notes..."
            className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
          />
        </div>
      </section>

      {/* Checklists and auditors */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Checklists and auditors</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Generated from the plan's standards and stage. Assign each checklist to an auditor.
          </p>
        </div>

        <div className="space-y-2.5">
          {execution.checklists.map((chk) => (
            <div
              key={chk.id}
              className="flex flex-col justify-between gap-3 rounded-[10px] border border-[#ececec] p-3.5 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-[14px] font-bold text-neutral-900">{chk.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[12px]">
                  <span className="text-neutral-500">Items: {chk.items.length}</span>
                  <span className="rounded-[4px] border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-0.5 text-[11px] font-medium text-[#15803d]">
                    {chk.libraryTag}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-44">
                  <span className="mb-1 block text-[11px] text-neutral-400">Auditor</span>
                  <SelectField
                    value={chk.assignedAuditor}
                    onChange={(val) => {
                      const nextChecklists = execution.checklists.map((c) =>
                        c.id === chk.id ? { ...c, assignedAuditor: val } : c,
                      )
                      onUpdateExecution({ ...execution, checklists: nextChecklists })
                    }}
                    options={plan.auditTeam}
                    className="h-9 text-[13px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateExecution({
                      ...execution,
                      checklists: execution.checklists.filter((c) => c.id !== chk.id),
                    })
                  }
                  title="Remove checklist"
                  className="mt-4 inline-flex size-9 items-center justify-center rounded-[8px] text-error-500 transition-colors hover:bg-red-50"
                >
                  <AppIcon icon={TrashIcon} size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-700">Add a checklist</label>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="min-w-[260px] max-w-md flex-1">
              <SelectField
                value={selectedExtraChecklist}
                placeholder="Choose from the library or your checklists"
                onChange={setSelectedExtraChecklist}
                options={LIBRARY_EXTRA_CHECKLISTS.map((lib) => ({
                  value: lib.id,
                  label: lib.title,
                }))}
                className="h-10"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!selectedExtraChecklist) return
                onAddChecklist(selectedExtraChecklist)
                setSelectedExtraChecklist('')
              }}
              className="h-10 rounded-[8px] border border-[#dce4f5] bg-white px-4 text-[13px] font-semibold text-[#1236a3] hover:bg-[#f3f6fd]"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* To complete this step */}
      <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 sm:flex-row sm:items-center">
        <div className="text-[13px]">
          <p className="font-bold text-[#92400e]">To complete this step</p>
          <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
            {!preparation.planSentToClient && <li>Send the audit plan to the client first.</li>}
            {!preparation.declarationsCompleted && (
              <li>The audit team must confirm availability and declare no conflicts on the audit plan.</li>
            )}
            {!preparation.clientDocumentsReviewed && (
              <li>Confirm that the client documents were reviewed.</li>
            )}
            {preparation.planSentToClient &&
              preparation.declarationsCompleted &&
              preparation.clientDocumentsReviewed && <li>All preparation prerequisites are satisfied.</li>}
          </ul>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="h-10 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
        >
          Complete: Preparation
        </button>
      </div>
    </div>
  )
}
