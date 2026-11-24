import { useEffect, useState } from 'react'
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

interface RescheduleAuditPlanModalProps {
  isOpen: boolean
  startDate: string
  endDate: string
  onClose: () => void
  onConfirm: (startDate: string, endDate: string, reason: string) => void | Promise<void>
}

export function RescheduleAuditPlanModal({
  isOpen,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: RescheduleAuditPlanModalProps) {
  const { t } = useTranslation()
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDraftStart(startDate)
      setDraftEnd(endDate)
      setReason('')
    }
  }, [isOpen, startDate, endDate])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const datesValid = Boolean(draftStart) && Boolean(draftEnd) && draftEnd >= draftStart
  const canConfirm = datesValid && reason.trim().length > 0 && !submitting

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSubmitting(true)
    try {
      await onConfirm(draftStart, draftEnd, reason.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-plan-title"
        className="w-full max-w-[520px] rounded-[16px] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef0f4] pb-4">
          <h3 id="reschedule-plan-title" className="text-[17px] font-bold text-neutral-900">
            {t('cab.buildAuditPlan.reschedule.title', 'Reschedule audit plan')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cab.buildAuditPlan.reschedule.close', 'Close')}
            className="text-[20px] leading-none text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-medium text-neutral-800">
              {t('cab.buildAuditPlan.reschedule.startDate', 'New start date')} <span className="text-red-600">*</span>
            </label>
            <IsoDateField value={draftStart} onChange={setDraftStart} />
          </div>
          <div>
            <label className="mb-1 block font-medium text-neutral-800">
              {t('cab.buildAuditPlan.reschedule.endDate', 'New end date')} <span className="text-red-600">*</span>
            </label>
            <IsoDateField value={draftEnd} onChange={setDraftEnd} />
          </div>
        </div>
        {draftStart && draftEnd && draftEnd < draftStart && (
          <p className="mt-2 text-[12px] text-red-600">
            {t('cab.buildAuditPlan.reschedule.invalidDates', 'The end date must be on or after the start date.')}
          </p>
        )}

        <div className="mt-4">
          <label className="mb-1 block text-[13px] font-medium text-neutral-800">
            {t('cab.buildAuditPlan.reschedule.reasonLabel', 'Reason for rescheduling')} <span className="text-red-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t('cab.buildAuditPlan.reschedule.reasonPlaceholder', 'Why are the dates changing?')}
            className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef0f4] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#1236a3]"
          >
            {t('cab.buildAuditPlan.reschedule.confirm', 'Confirm reschedule')}
          </button>
        </div>
      </div>
    </div>
  )
}
