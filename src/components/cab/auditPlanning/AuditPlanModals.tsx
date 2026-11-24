import { useTranslation } from 'react-i18next'
import type { AuditStageType, AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
import { IsoDateField } from '@/components/cab/auditPlanning/shared'
import { SelectField } from '@/components/ui/Select'

interface AgendaActivityModalProps {
  isOpen: boolean
  isEditing: boolean
  planNumber: string
  auditStage: AuditStageType
  title: string
  date: string
  startTime: string
  endTime: string
  auditor: string
  duration: number
  teamMembers: AuditTeamMember[]
  onChangeTitle: (val: string) => void
  onChangeDate: (val: string) => void
  onChangeTimes: (start: string, end: string) => void
  onChangeAuditor: (val: string) => void
  onChangeDuration: (val: number) => void
  onDelete?: () => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function AgendaActivityModal({
  isOpen,
  isEditing,
  planNumber,
  auditStage,
  title,
  date,
  startTime,
  endTime,
  auditor,
  duration,
  teamMembers,
  onChangeTitle,
  onChangeDate,
  onChangeTimes,
  onChangeAuditor,
  onChangeDuration,
  onDelete,
  onClose,
  onSubmit,
}: AgendaActivityModalProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="mb-5 rounded-[12px] border-2 border-[#1236a3] bg-[#f8faff] p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between border-b border-[#dbe6ff] pb-3">
        <div>
          <h3 className="text-[16px] font-bold text-[#1236a3]">
            {isEditing ? t('cab.auditPlanning.modals.editActivity', 'Edit Agenda Activity') : t('cab.auditPlanning.modals.addActivity', 'Add Agenda Activity')}
          </h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {planNumber} · {auditStage}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[18px] font-bold text-neutral-400 hover:text-neutral-600"
        >
          ×
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            {t('cab.auditPlanning.modals.activityTitle', 'Activity Title')} <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder={t('cab.auditPlanning.modals.activityPlaceholder', 'e.g. Document review, Site tour')}
            required
            className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('cab.buildAuditPlan.agenda.columns.date', 'Date')} <span className="text-error-500">*</span>
            </label>
            <IsoDateField value={date} onChange={onChangeDate} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.modals.startAst', 'Start (AST)')} <span className="text-error-500">*</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onChangeTimes(e.target.value, endTime)}
              required
              className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.modals.endAst', 'End (AST)')} <span className="text-error-500">*</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onChangeTimes(startTime, e.target.value)}
              required
              className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.modals.auditor', 'Auditor')} <span className="text-error-500">*</span>
            </label>
            <SelectField
              value={auditor}
              onChange={onChangeAuditor}
              options={teamMembers.map((m) => ({ value: m.name, label: m.name }))}
              className="h-11"
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.modals.durationHours', 'Duration (Hours)')} <span className="text-error-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={duration}
              onChange={(e) => onChangeDuration(parseFloat(e.target.value) || 0)}
              required
              className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
            />
            <span className="mt-1 block text-[11px] text-neutral-400">{t('cab.auditPlanning.modals.durationHint', 'Set from start and end')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-[13px] font-semibold text-error-600 hover:underline"
            >
              {t('cab.auditPlanning.modals.deleteActivity', 'Delete activity')}
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
            >
              {t('cab.auditPlanning.modals.saveActivity', 'Save Activity')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

interface ChangeStageDatesModalProps {
  isOpen: boolean
  auditStage: AuditStageType
  startDate: string
  endDate: string
  reason: string
  onChangeStage: (stage: AuditStageType) => void
  onChangeStart: (val: string) => void
  onChangeEnd: (val: string) => void
  onChangeReason: (val: string) => void
  onClose: () => void
  onSave: () => void
}

export function ChangeStageDatesModal({
  isOpen,
  auditStage,
  startDate,
  endDate,
  reason,
  onChangeStage,
  onChangeStart,
  onChangeEnd,
  onChangeReason,
  onClose,
  onSave,
}: ChangeStageDatesModalProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="rounded-[12px] border-2 border-[#1236a3] bg-[#f8faff] p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#dbe6ff] pb-3">
        <h3 className="text-[15px] font-bold text-[#1236a3]">{t('cab.auditPlanning.modals.changeTitle', 'Change stage or proposed dates')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-[18px] font-bold text-neutral-400 hover:text-neutral-600"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-3">
        <div>
          <label className="mb-1 block font-medium text-neutral-800">{t('cab.auditSchedule.auditStage', 'Audit stage')}</label>
          <SelectField
            value={auditStage}
            onChange={(val) => onChangeStage(val as AuditStageType)}
            options={[
              { value: 'Stage 1', label: t('cab.auditPlanning.stages.stage1', 'Stage 1') },
              { value: 'Stage 2', label: t('cab.auditPlanning.stages.stage2', 'Stage 2') },
              { value: 'Surveillance 1', label: t('cab.auditPlanning.stages.surveillance1', 'Surveillance 1') },
              { value: 'Surveillance 2', label: t('cab.auditPlanning.stages.surveillance2', 'Surveillance 2') },
              { value: 'Recertification', label: t('cab.auditPlanning.stages.recertification', 'Recertification') },
              { value: 'Special Audit', label: t('cab.auditPlanning.stages.specialAudit', 'Special Audit') },
            ]}
            className="h-11"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-neutral-800">{t('cab.auditSchedule.startDate', 'Start date')}</label>
          <IsoDateField value={startDate} onChange={onChangeStart} />
        </div>

        <div>
          <label className="mb-1 block font-medium text-neutral-800">{t('cab.auditSchedule.endDate', 'End date')}</label>
          <IsoDateField value={endDate} onChange={onChangeEnd} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-medium text-neutral-800">
          {t('cab.auditPlanning.modals.reasonLabel', 'Reason for change (audit trail) *')}
        </label>
        <textarea
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          rows={2}
          placeholder={t('cab.auditPlanning.modals.reasonPlaceholder', 'Record why dates or stage were changed...')}
          className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700"
        >
          {t('common.cancel', 'Cancel')}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
        >
          {t('cab.auditPlanning.modals.saveChanges', 'Save changes')}
        </button>
      </div>
    </div>
  )
}
