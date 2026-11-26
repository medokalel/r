import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppIcon, TrashIcon } from '@/components/icons'
import {
  LIBRARY_EXTRA_CHECKLISTS,
  type AuditExecutionData,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { getStepBlockers } from '@/lib/api/auditExecutionGates'
import type { AuditChecklist } from '@/lib/auditChecklistTypes'
import { Checkbox } from '@/components/ui/Checkbox'
import { SelectField } from '@/components/ui/Select'
import { ExecutionGateFooter } from '@/components/cab/auditPlanning/shared'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface ExecutionPreparationStepProps {
  plan: AuditPlan
  execution: AuditExecutionData
  /** The CAB's own active checklists, offered in the add-checklist picker. */
  ownChecklists: AuditChecklist[]
  onUpdateExecution: (next: AuditExecutionData) => void
  onAddChecklist: (sourceRef: string) => void
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
  ownChecklists,
  onUpdateExecution,
  onAddChecklist,
  onComplete,
}: ExecutionPreparationStepProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [selectedExtraChecklist, setSelectedExtraChecklist] = useState('')
  const { preparation } = execution
  const auditorOptions = [...new Set([plan.leadAuditor, ...plan.auditTeam].filter(Boolean))]
  const blockers = getStepBlockers(execution, 1)

  const updatePrep = (patch: Partial<AuditExecutionData['preparation']>) =>
    onUpdateExecution({ ...execution, preparation: { ...preparation, ...patch } })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-neutral-900">{t('execution.steps.1')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">{t('execution.stepHints.preparation')}</p>
      </div>

      {/* Readiness Card */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.preparation.readinessTitle')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.preparation.readinessDescription')}</p>
        </div>

        {!preparation.agreementActive && (
          <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] p-4 text-[13px]">
            <p className="font-bold text-[#b91c1c]">{t('execution.preparation.cannotSendYet')}</p>
            <p className="mt-1 text-[#991b1b]">{t('execution.preparation.cannotSendYetBody')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(ROUTES.cabCertificationAgreements)}
                className="font-semibold text-[#b91c1c] underline hover:text-[#7f1d1d]"
              >
                {t('execution.preparation.openAgreementWithId', { reference: preparation.agreementId })}
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
                {t('execution.preparation.markAgreementDemo')}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5 text-[13px]">
          <ReadinessRow
            done={preparation.planSentToClient}
            title={t('execution.preparation.planSent')}
            subtitle={t(preparation.planSentToClient ? 'execution.preparation.planSentYes' : 'execution.preparation.planSentNo')}
            actionLabel={t('execution.preparation.openPlan')}
            onAction={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
          />
          <ReadinessRow
            done={preparation.planConfirmedByClient}
            title={t('execution.preparation.clientConfirmed')}
            subtitle={
              preparation.clientResponse?.decision === 'objection'
                ? t('execution.preparation.clientObjection', {
                    name: preparation.clientResponse.memberName ?? t('execution.preparation.teamMemberFallback'),
                    reason: preparation.clientResponse.reason ?? '',
                  })
                : t(
                    preparation.planConfirmedByClient
                      ? 'execution.preparation.clientConfirmedYes'
                      : 'execution.preparation.clientConfirmedNo',
                  )
            }
          />
          <ReadinessRow
            done={preparation.declarationsCompleted}
            title={t('execution.preparation.teamDeclared')}
            subtitle={t(
              preparation.declarationsCompleted
                ? 'execution.preparation.teamDeclaredYes'
                : 'execution.preparation.teamDeclaredNo',
            )}
          />
          <ReadinessRow
            done={preparation.agreementActive}
            title={t('execution.preparation.agreement')}
            subtitle={
              preparation.agreementActive
                ? t('execution.preparation.agreementActive', { reference: preparation.agreementId })
                : t('execution.preparation.agreementMissingBlock')
            }
            actionLabel={t('execution.preparation.openAgreement')}
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
              <p className="font-semibold text-neutral-900">{t('execution.preparation.documentsReviewed')}</p>
              <p className="text-[12px] text-neutral-500">{t('execution.preparation.documentsReviewedHint')}</p>
            </div>
          </label>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="block text-[13px] font-medium text-neutral-800">{t('execution.preparation.notes')}</label>
          <textarea
            value={preparation.preparationNotes}
            onChange={(e) => updatePrep({ preparationNotes: e.target.value })}
            rows={3}
            placeholder={t('execution.preparation.notesPlaceholder')}
            className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
          />
        </div>
      </section>

      {/* Checklists and auditors */}
      <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">{t('execution.preparation.checklistsTitle')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">{t('execution.preparation.checklistsDescription')}</p>
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
                  <span className="text-neutral-500">{t('execution.preparation.itemCount', { count: chk.items.length })}</span>
                  <span className="rounded-[4px] border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-0.5 text-[11px] font-medium text-[#15803d]">
                    {chk.libraryTag}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-44">
                  <span className="mb-1 block text-[11px] text-neutral-400">{t('execution.preparation.auditor')}</span>
                  <SelectField
                    value={chk.assignedAuditor}
                    placeholder={t('execution.preparation.chooseAuditor', 'Choose an auditor')}
                    onChange={(val) => {
                      const nextChecklists = execution.checklists.map((c) =>
                        c.id === chk.id ? { ...c, assignedAuditor: val } : c,
                      )
                      onUpdateExecution({ ...execution, checklists: nextChecklists })
                    }}
                    options={auditorOptions}
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
                  title={t('execution.preparation.removeChecklist', { name: chk.title })}
                  className="mt-4 inline-flex size-9 items-center justify-center rounded-[8px] text-error-500 transition-colors hover:bg-red-50"
                >
                  <AppIcon icon={TrashIcon} size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {execution.checklists.length === 0 && (
          <p className="text-[13px] text-neutral-500">
            {t('execution.preparation.noChecklists', 'No checklist yet. Add one from the library.')}
          </p>
        )}

        <div className="pt-2">
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-700">
            {t('execution.preparation.addChecklist', 'Add a checklist')}
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="min-w-[260px] max-w-md flex-1">
              <SelectField
                value={selectedExtraChecklist}
                placeholder={t(
                  'execution.preparation.chooseChecklist',
                  'Choose from the library or your checklists',
                )}
                onChange={setSelectedExtraChecklist}
                options={[
                  ...LIBRARY_EXTRA_CHECKLISTS.map((lib) => ({
                    value: lib.id,
                    label: lib.title,
                  })),
                  ...ownChecklists.map((own) => ({
                    value: `cab:${own.id}`,
                    label: `${own.name} (${t('execution.preparation.ours', 'ours')})`,
                  })),
                ]}
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
              {t('execution.preparation.add', 'Add')}
            </button>
          </div>
        </div>
      </section>

      {/* To complete this step */}
      <ExecutionGateFooter
        blockers={blockers}
        completeLabel={t('execution.complete', { step: t('execution.steps.1') })}
        onComplete={onComplete}
      />
    </div>
  )
}
