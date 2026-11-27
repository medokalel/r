import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AgreementSectionCard,
  NewAgreementSectionDrawer,
  type EditableFieldKey,
} from '@/components/dashboard/cab/agreements/AgreementSectionCard'
import { AgreementTermsPreview } from '@/components/dashboard/cab/agreements/AgreementTermsPreview'
import { AgreementVariablesPanel } from '@/components/dashboard/cab/agreements/AgreementVariablesPanel'
import {
  AddCircleIcon,
  AppIcon,
  CheckIcon,
  FileTextIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import {
  AGREEMENT_VARIABLES,
  DEFAULT_AGREEMENT_TERMS,
  fetchAgreementTerms,
  persistAgreementTerms,
  type AgreementSection,
  type AgreementTermsState,
  type AgreementVariable,
  type AuditPlanGateMode,
} from '@/lib/api/cabAgreementTermsApi'
import { fetchAgreementPreviewValues, type CertificationAgreementValues } from '@/lib/api/cabCertificationAgreementsApi'
import { listAllCabAuditClients, type CabAuditClientListItem } from '@/lib/api/clientRegistrationApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabAgreementTermsPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  const [state, setState] = useState<AgreementTermsState>(DEFAULT_AGREEMENT_TERMS)
  const [expandedId, setExpandedId] = useState<string | null>(state.sections[0]?.id ?? null)
  const [activeField, setActiveField] = useState<{ sectionId: string | 'new'; field: EditableFieldKey } | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState<Omit<AgreementSection, 'id'>>({ titleEn: '', titleAr: '', textEn: '', textAr: '' })
  const [presetKey, setPresetKey] = useState('')
  const [clients, setClients] = useState<CabAuditClientListItem[]>([])
  // What was fetched for one client; it only counts while that client is still selected.
  const [preview, setPreview] = useState<{ clientId: string; values?: CertificationAgreementValues; failed?: boolean } | null>(null)
  const currentPreview = preview?.clientId === presetKey ? preview : null
  const [showPreview, setShowPreview] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  // false until the backend has a saved version, so the first Save persists even with no edits.
  const [persisted, setPersisted] = useState(false)

  // Show what the CAB saved; the default text until it saves its own version.
  useEffect(() => {
    let active = true
    fetchAgreementTerms()
      .then((saved) => {
        if (!active || !saved) return
        setState(saved)
        setExpandedId(saved.sections[0]?.id ?? null)
        setPersisted(true)
      })
      .catch((error) => active && toast.error(getUserErrorMessage(error, t)))
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, [])

  // Every registered audit client of this CAB can fill the preview.
  useEffect(() => {
    let active = true
    listAllCabAuditClients()
      .then((items) => active && setClients(items))
      .catch(() => undefined) // the preview still works with the sample values
    return () => {
      active = false
    }
  }, [])

  const presetOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: `${client.name || client.tradeName || client.id}${client.city ? ` · ${client.city}` : ''}`,
      })),
    [clients]
  )

  // The preview shows what the backend would put into a new agreement for the selected client.
  useEffect(() => {
    if (!showPreview || !presetKey) return
    let active = true
    fetchAgreementPreviewValues(presetKey)
      .then((values) => active && setPreview({ clientId: presetKey, values }))
      .catch(() => active && setPreview({ clientId: presetKey, failed: true }))
    return () => {
      active = false
    }
  }, [showPreview, presetKey])

  const handleGateChange = (gate: AuditPlanGateMode) => {
    setState((prev) => ({ ...prev, auditPlanGate: gate }))
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleUpdateSection = (sectionId: string, field: EditableFieldKey, value: string) => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => (sec.id === sectionId ? { ...sec, [field]: value } : sec)),
    }))
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleOpenNewSection = () => {
    setIsAddingNew(true)
    setNewDraft({ titleEn: '', titleAr: '', textEn: '', textAr: '' })
    setActiveField({ sectionId: 'new', field: isAr ? 'titleAr' : 'titleEn' })
  }

  const handleConfirmAddSection = () => {
    if (!newDraft.titleAr.trim() && !newDraft.titleEn.trim() && !newDraft.textAr.trim() && !newDraft.textEn.trim()) {
      setIsAddingNew(false)
      return
    }
    const created: AgreementSection = {
      id: `sec-${Date.now()}`,
      titleEn: newDraft.titleEn.trim() || newDraft.titleAr.trim(),
      titleAr: newDraft.titleAr.trim() || newDraft.titleEn.trim(),
      textEn: newDraft.textEn.trim(),
      textAr: newDraft.textAr.trim(),
    }
    setState((prev) => ({ ...prev, sections: [created, ...prev.sections] }))
    setIsAddingNew(false)
    setExpandedId(created.id)
    setActiveField({ sectionId: created.id, field: isAr ? 'textAr' : 'textEn' })
    setIsDirty(true)
    setJustSaved(false)
  }

  const persistSectionsUpdate = async (
    nextSections: AgreementSection[],
    successMessage: string,
  ) => {
    const previousState = state
    const nextState = { ...state, sections: nextSections }
    setState(nextState)
    setSaving(true)
    try {
      setState(await persistAgreementTerms(nextState))
      setPersisted(true)
      setIsDirty(false)
      setJustSaved(true)
      toast.success(successMessage)
    } catch (error) {
      setState(previousState)
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const handleMoveSection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= state.sections.length) return
    const next = [...state.sections]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    void persistSectionsUpdate(
      next,
      isAr ? 'تم تغيير ترتيب البند وحفظ التغييرات' : 'Section order updated and saved',
    )
  }

  const handleDeleteSection = (sectionId: string) => {
    if (expandedId === sectionId) setExpandedId(null)
    void persistSectionsUpdate(
      state.sections.filter((sec) => sec.id !== sectionId),
      isAr ? 'تم حذف البند وحفظ التغييرات' : 'Section deleted and saved',
    )
  }

  /** Puts the token at the caret of the field being edited (the chips keep focus); appends when no field is focused. */
  const withToken = (current: string, token: string) => {
    const el = document.activeElement
    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.value === current) {
      const start = el.selectionStart ?? current.length
      const end = el.selectionEnd ?? start
      requestAnimationFrame(() => el.setSelectionRange(start + token.length, start + token.length))
      return `${current.slice(0, start)}${token}${current.slice(end)}`
    }
    return `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}`
  }

  const handleInsertVariable = (variable: AgreementVariable) => {
    if (isAddingNew || activeField?.sectionId === 'new') {
      const targetField: EditableFieldKey = activeField?.sectionId === 'new' ? activeField.field : isAr ? 'textAr' : 'textEn'
      const token = targetField === 'titleAr' || targetField === 'textAr' ? variable.tokenAr : variable.tokenEn
      setNewDraft((prev) => {
        return { ...prev, [targetField]: withToken(prev[targetField], token) }
      })
      return
    }
    const targetSectionId = activeField?.sectionId ?? expandedId ?? state.sections[0]?.id
    if (!targetSectionId) return
    const targetField: EditableFieldKey = activeField?.field ?? (isAr ? 'textAr' : 'textEn')
    const token = targetField === 'titleAr' || targetField === 'textAr' ? variable.tokenAr : variable.tokenEn
    setExpandedId(targetSectionId)
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id !== targetSectionId) return sec
        return { ...sec, [targetField]: withToken(sec[targetField], token) }
      }),
    }))
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleSave = async () => {
    if (!isDirty && persisted) {
      setJustSaved(true)
      return
    }
    setSaving(true)
    try {
      setState(await persistAgreementTerms(state))
      setPersisted(true)
      setIsDirty(false)
      setJustSaved(true)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setSaving(false)
    }
  }

  const kpiCards = [
    { icon: ShieldIcon, iconClass: 'bg-[#e8edfc] text-primary', label: isAr ? 'المرجع القياسي' : 'Standard compliance', value: 'ISO/IEC 17021-1 (5.1.2)', ltr: true },
    { icon: TaskSquareIcon, iconClass: 'bg-[#e8edfc] text-primary', label: t('cab.agreementTerms.sectionsTitle', 'Sections'), value: `${state.sections.length} ${isAr ? 'بنداً ثنائي اللغة' : 'bilingual clauses'}` },
    { icon: FileTextIcon, iconClass: 'bg-[#e8edfc] text-primary', label: t('cab.agreementTerms.variables.title', 'Variables'), value: `${AGREEMENT_VARIABLES.length} ${isAr ? 'متغيراً تلقائياً' : 'auto-filled fields'}` },
    { icon: SuccessCircleIcon, iconClass: 'bg-[#eafaf1] text-[#16a34a]', label: isAr ? 'الإصدار الحالي' : 'Active version', value: `${isAr ? `الإصدار ${state.version}` : `Version ${state.version}`}${state.savedAt ? ` (${state.savedAt})` : isAr ? ' (النص الافتراضي)' : ' (default text)'}` },
  ]

  const gateOptions = [
    { mode: 'block' as const, title: t('cab.agreementTerms.gate.blockTitle', 'Block (recommended)'), badge: isAr ? 'موصى به' : 'Recommended', desc: t('cab.agreementTerms.gate.blockDesc', 'The plan cannot be sent until the agreement is active.') },
    { mode: 'warn' as const, title: t('cab.agreementTerms.gate.warnTitle', 'Warn'), badge: isAr ? 'مرن' : 'Flexible', desc: t('cab.agreementTerms.gate.warnDesc', 'The plan is sent and a warning is shown.') },
  ]

  if (!loaded) {
    return (
      <CabLayout>
        <CabHeader title={t('cab.agreementTerms.title', 'Agreement terms')} />
      </CabLayout>
    )
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.agreementTerms.title', 'Agreement terms')} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">{t('cab.agreementTerms.breadcrumbHub', 'Application Hub')}</Link>
          <Chevron />
          <span className="font-light text-neutral-400">{t('cab.agreementTerms.breadcrumbSettings', 'Settings')}</span>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.agreementTerms.title', 'Agreement terms')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{t('cab.agreementTerms.title', 'Agreement terms')}</h1>
            <p className="mt-1 text-[14px] text-neutral-500">{t('cab.agreementTerms.subtitle', 'The certification agreement your clients sign: bilingual sections with variables, filled for each client.')}</p>
          </div>
          <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={saving} icon={justSaved ? <AppIcon icon={CheckIcon} size={18} /> : undefined} className="h-11 rounded-[10px] px-5 text-[14px]">
            {justSaved ? t('cab.agreementTerms.saved', 'Saved') : t('cab.agreementTerms.save', 'Save')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card, i) => (
            <div key={i} className="flex items-center gap-3.5 rounded-[16px] border border-[#ececec] bg-white p-4">
              <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-[12px]', card.iconClass)}>
                <AppIcon icon={card.icon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-neutral-500">{card.label}</p>
                <p className="mt-0.5 truncate text-[14px] font-bold text-neutral-900" dir={card.ltr ? 'ltr' : undefined}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.agreementTerms.gate.title', 'Audit plan gate')}</h2>
              <p className="mt-1 text-[13px] text-neutral-500">{t('cab.agreementTerms.gate.subtitle', 'What happens when a Stage 1, Stage 2 or recertification plan is sent and the client has no active agreement.')}</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-[12px] font-bold', state.auditPlanGate === 'block' ? 'bg-[#e8edfc] text-primary' : 'bg-[#fef3c6] text-[#a58401]')}>
              {state.auditPlanGate === 'block' ? gateOptions[0].title : gateOptions[1].title}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {gateOptions.map((option) => {
              const isSelected = state.auditPlanGate === option.mode
              return (
                <button key={option.mode} type="button" onClick={() => handleGateChange(option.mode)} className={cn('flex items-start gap-3 rounded-[12px] border p-4 text-start transition-all', isSelected ? 'border-primary bg-[#f4f7ff] ring-1 ring-primary/20' : 'border-[#e5e7eb] bg-white hover:border-[#b9c8e4]')}>
                  <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border', isSelected ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white')}>
                    {isSelected && <AppIcon icon={CheckIcon} size={12} />}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[15px] font-bold', isSelected ? 'text-primary' : 'text-neutral-900')}>{option.title}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', isSelected ? 'bg-primary/10 text-primary' : 'bg-neutral-100 text-neutral-600')}>{option.badge}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-neutral-500">{option.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          <div className="flex flex-col gap-3.5 xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#ececec] bg-white px-5 py-4">
              <div>
                <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.agreementTerms.sectionsTitle', 'Sections')} ({state.sections.length})</h2>
                <p className="mt-0.5 text-[12px] text-neutral-500">{isAr ? 'اضغط على أي بند لتعديل النص العربي والإنجليزي أو إعادة ترتيبه' : 'Click any section to edit its English and Arabic text or reorder it'}</p>
              </div>
              <Button type="button" variant="primary" onClick={handleOpenNewSection} icon={<AppIcon icon={AddCircleIcon} size={18} />} className="h-10 rounded-[10px] px-4 text-[13px]">
                {t('cab.agreementTerms.addSection', 'Add section')}
              </Button>
            </div>

            {isAddingNew && (
              <NewAgreementSectionDrawer
                draft={newDraft}
                onChange={setNewDraft}
                onFocusField={(field) => setActiveField({ sectionId: 'new', field })}
                onSave={handleConfirmAddSection}
                onCancel={() => setIsAddingNew(false)}
              />
            )}

            <div className="flex flex-col gap-2.5">
              {state.sections.map((sec, idx) => (
                <AgreementSectionCard
                  key={sec.id}
                  section={sec}
                  index={idx}
                  total={state.sections.length}
                  isExpanded={expandedId === sec.id}
                  onToggle={() => setExpandedId(expandedId === sec.id ? null : sec.id)}
                  onMove={(dir) => handleMoveSection(idx, dir)}
                  onDelete={() => handleDeleteSection(sec.id)}
                  onFocusField={(field) => setActiveField({ sectionId: sec.id, field })}
                  onUpdateField={(field, val) => handleUpdateSection(sec.id, field, val)}
                  onInsertVariable={handleInsertVariable}
                />
              ))}
            </div>
          </div>

          <div className="xl:col-span-4">
            <AgreementVariablesPanel
              presetKey={presetKey}
              presetOptions={presetOptions}
              onPresetChange={setPresetKey}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview((p) => !p)}
              onInsertVariable={handleInsertVariable}
            />
          </div>
        </div>

        {showPreview && presetKey && (
          <AgreementTermsPreview
            sections={state.sections}
            values={currentPreview?.values ?? null}
            failed={Boolean(currentPreview?.failed)}
            isAr={Boolean(isAr)}
            onClose={() => setShowPreview(false)}
          />
        )}
      </main>
    </CabLayout>
  )
}

export default CabAgreementTermsPage
