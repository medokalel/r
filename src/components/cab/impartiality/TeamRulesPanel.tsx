import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { TextField } from '@/components/ui/TextField'
import {
  TeamSelectionError,
  getTeamSelectionSettings,
  updateTeamSelectionSettings,
} from '@/lib/api/teamSelectionApi'
import { toast } from '@/lib/toast'
import {
  RULE_NUMBER_FIELDS,
  validateRulesDraft,
  type RuleNumberKey,
  type RuleToggleKey,
} from '@/lib/teamRulesView'
import type { TeamSelectionSettings } from '@/lib/teamSelection/catalog'

const NUMBER_DEFAULTS: Record<RuleNumberKey, { label: string; hint: string }> = {
  coolingOffMonths: {
    label: 'Cooling-off period (months)',
    hint: 'After consultancy, internal audit or employment ends, the person cannot audit that client for this period.',
  },
  travelBufferDays: {
    label: 'Travel buffer (days)',
    hint: 'Free days needed between two audits of the same person.',
  },
  workloadWindowDays: {
    label: 'Workload window (days)',
    hint: 'Look-back period used to balance the workload.',
  },
  maxAuditDaysInWindow: {
    label: 'Audit days limit in the window',
    hint: 'Above this, a workload warning is shown.',
  },
  declarationValidityMonths: {
    label: 'Annual declaration validity (months)',
    hint: 'How long an annual declaration stays valid.',
  },
  expiryWarningDays: {
    label: 'Approval expiry warning (days)',
    hint: 'Warn when a competence approval expires within this many days after the audit.',
  },
}

const TOGGLE_DEFAULTS: Record<RuleToggleKey, { label: string; hint: string }> = {
  requireAnnualDeclaration: {
    label: 'Require a valid annual declaration for audit plans',
    hint: 'Blocking, but an exception can accept it.',
  },
  requireAuditDeclaration: {
    label: 'Require a declaration for each audit',
    hint: 'Blocking, but an exception can accept it. Otherwise shown as a note.',
  },
  exceptionSecondApprover: {
    label: 'Second approver for exceptions (optional)',
    hint: 'Off by default. When on, the admin who requested an exception cannot approve or reject it; another CAB admin decides.',
  },
}

const TOGGLE_ORDER: RuleToggleKey[] = ['requireAnnualDeclaration', 'requireAuditDeclaration', 'exceptionSecondApprover']

type Draft = Record<RuleNumberKey, string> & Record<RuleToggleKey, boolean>

const toDraft = (settings: TeamSelectionSettings): Draft => ({
  coolingOffMonths: String(settings.coolingOffMonths),
  travelBufferDays: String(settings.travelBufferDays),
  workloadWindowDays: String(settings.workloadWindowDays),
  maxAuditDaysInWindow: String(settings.maxAuditDaysInWindow),
  declarationValidityMonths: String(settings.declarationValidityMonths),
  expiryWarningDays: String(settings.expiryWarningDays),
  requireAnnualDeclaration: settings.requireAnnualDeclaration,
  requireAuditDeclaration: settings.requireAuditDeclaration,
  exceptionSecondApprover: settings.exceptionSecondApprover,
})

interface TeamRulesPanelProps {
  /** Called after the rules are saved so the page can refresh anything that depends on them. */
  onSaved?: (settings: TeamSelectionSettings) => void
}

/** The Rules tab of the impartiality register: the settings the team selection engine reads. */
export function TeamRulesPanel({ onSaved }: TeamRulesPanelProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<Draft | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<RuleNumberKey, string>>>({})

  useEffect(() => {
    getTeamSelectionSettings()
      .then((settings) => {
        const next = toDraft(settings)
        setDraft(next)
        setSaved(next)
      })
      .catch(() => setLoadFailed(true))
  }, [])

  if (loadFailed) {
    return (
      <p role="alert" className="rounded-[8px] border border-[#f5c6c6] bg-[#fdeeee] px-4 py-3 text-[13px] text-[#c0392b]">
        {t('cab.impartialityRegister.rules.loadFailed', 'Could not load the team selection rules.')}
      </p>
    )
  }
  if (!draft || !saved) {
    return (
      <div className="flex items-center justify-center rounded-[16px] border border-[#ececec] bg-white py-16">
        <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const errorText = (code: string, min: number, max: number) => {
    if (code === 'required') return t('cab.impartialityRegister.rules.errors.required', 'Enter a value.')
    if (code === 'integer') return t('cab.impartialityRegister.rules.errors.integer', 'Enter a whole number.')
    return t('cab.impartialityRegister.rules.errors.range', {
      min,
      max,
      defaultValue: 'Enter a number from {{min}} to {{max}}.',
    })
  }

  const save = async () => {
    const problems = validateRulesDraft(draft)
    const next: Partial<Record<RuleNumberKey, string>> = {}
    for (const problem of problems) next[problem.key] = errorText(problem.code, problem.min, problem.max)
    setErrors(next)
    if (problems.length) return
    setSaving(true)
    try {
      const result = await updateTeamSelectionSettings({
        coolingOffMonths: Number(draft.coolingOffMonths),
        travelBufferDays: Number(draft.travelBufferDays),
        workloadWindowDays: Number(draft.workloadWindowDays),
        maxAuditDaysInWindow: Number(draft.maxAuditDaysInWindow),
        declarationValidityMonths: Number(draft.declarationValidityMonths),
        expiryWarningDays: Number(draft.expiryWarningDays),
        requireAnnualDeclaration: draft.requireAnnualDeclaration,
        requireAuditDeclaration: draft.requireAuditDeclaration,
        exceptionSecondApprover: draft.exceptionSecondApprover,
      })
      const fresh = toDraft(result)
      setDraft(fresh)
      setSaved(fresh)
      toast.success(t('cab.impartialityRegister.rules.saved', 'Rules saved.'))
      onSaved?.(result)
    } catch (error) {
      toast.error(
        error instanceof TeamSelectionError
          ? error.message
          : t('cab.impartialityRegister.rules.saveFailed', 'Could not save the rules. Try again.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-[16px] border border-[#ececec] bg-white p-5">
      <div>
        <h2 className="text-[16px] font-bold text-neutral-900">
          {t('cab.impartialityRegister.rules.title', 'Team selection rules')}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          {t('cab.impartialityRegister.rules.subtitle', 'Applied to every recommendation and validation of this CAB.')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {RULE_NUMBER_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <TextField
              id={`rule-${field.key}`}
              label={t(`cab.impartialityRegister.rules.${field.key}.label`, NUMBER_DEFAULTS[field.key].label)}
              inputMode="numeric"
              value={draft[field.key]}
              error={errors[field.key]}
              onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
            />
            <p className="text-[12px] text-neutral-500">
              {t(`cab.impartialityRegister.rules.${field.key}.hint`, NUMBER_DEFAULTS[field.key].hint)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {TOGGLE_ORDER.map((key) => (
          <label key={key} htmlFor={`rule-${key}`} className="flex cursor-pointer items-start gap-3">
            <Checkbox
              aria-label={t(`cab.impartialityRegister.rules.${key}.label`, TOGGLE_DEFAULTS[key].label)}
              checked={draft[key]}
              onChange={() => setDraft({ ...draft, [key]: !draft[key] })}
              className="mt-0.5"
            />
            <span className="flex flex-col">
              <span className="text-[14px] font-semibold text-neutral-900">
                {t(`cab.impartialityRegister.rules.${key}.label`, TOGGLE_DEFAULTS[key].label)}
              </span>
              <span className="text-[12px] text-neutral-500">
                {t(`cab.impartialityRegister.rules.${key}.hint`, TOGGLE_DEFAULTS[key].hint)}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={save} disabled={saving || !dirty} className="w-full sm:w-auto">
          {t('cab.impartialityRegister.rules.save', 'Save rules')}
        </Button>
      </div>
    </section>
  )
}
