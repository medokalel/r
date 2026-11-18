import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AgreementSectionCard,
  NewAgreementSectionDrawer,
  type EditableFieldKey,
} from '@/components/dashboard/cab/agreements/AgreementSectionCard'
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
  getAgreementTermsState,
  saveAgreementTermsState,
  type AgreementSection,
  type AgreementTermsState,
  type AgreementVariable,
  type AuditPlanGateMode,
} from '@/lib/api/cabAgreementTermsApi'
import { ROUTES } from '@/lib/routes'
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

  const [state, setState] = useState<AgreementTermsState>(() => getAgreementTermsState())
  const [expandedId, setExpandedId] = useState<string | null>(state.sections[0]?.id ?? null)
  const [activeField, setActiveField] = useState<{ sectionId: string | 'new'; field: EditableFieldKey } | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState<Omit<AgreementSection, 'id'>>({ titleEn: '', titleAr: '', textEn: '', textAr: '' })
  const [presetKey, setPresetKey] = useState('sample')
  const [showPreview, setShowPreview] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

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

  const handleMoveSection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= state.sections.length) return
    const next = [...state.sections]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    setState((prev) => ({ ...prev, sections: next }))
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleDeleteSection = (sectionId: string) => {
    setState((prev) => ({ ...prev, sections: prev.sections.filter((sec) => sec.id !== sectionId) }))
    if (expandedId === sectionId) setExpandedId(null)
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleInsertVariable = (variable: AgreementVariable) => {
    if (isAddingNew || activeField?.sectionId === 'new') {
      const targetField: EditableFieldKey = activeField?.sectionId === 'new' ? activeField.field : isAr ? 'textAr' : 'textEn'
      const token = targetField === 'titleAr' || targetField === 'textAr' ? variable.tokenAr : variable.tokenEn
      setNewDraft((prev) => {
        const current = prev[targetField]
        return { ...prev, [targetField]: `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}` }
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
        const current = sec[targetField]
        return { ...sec, [targetField]: `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}` }
      }),
    }))
    setIsDirty(true)
    setJustSaved(false)
  }

  const handleSave = () => {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const formattedTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const nextState: AgreementTermsState = {
      ...state,
      version: isDirty ? state.version + 1 : state.version,
      savedBy: 'Mohamed El Manawahly',
      savedAt: `${formattedDate} · ${formattedTime}`,
    }
    saveAgreementTermsState(nextState)
    setState(nextState)
    setIsDirty(false)
    setJustSaved(true)
  }

  const kpiCards = [
    { icon: ShieldIcon, iconClass: 'bg-[#e8edfc] text-primary', label: isAr ? 'المرجع القياسي' : 'Standard compliance', value: 'ISO/IEC 17021-1 (5.1.2)', ltr: true },
    { icon: TaskSquareIcon, iconClass: 'bg-[#e8edfc] text-primary', label: t('cab.agreementTerms.sectionsTitle', 'Sections'), value: `${state.sections.length} ${isAr ? 'بنداً ثنائي اللغة' : 'bilingual clauses'}` },
    { icon: FileTextIcon, iconClass: 'bg-[#e8edfc] text-primary', label: t('cab.agreementTerms.variables.title', 'Variables'), value: `${AGREEMENT_VARIABLES.length} ${isAr ? 'متغيراً تلقائياً' : 'auto-filled fields'}` },
    { icon: SuccessCircleIcon, iconClass: 'bg-[#eafaf1] text-[#16a34a]', label: isAr ? 'الإصدار الحالي' : 'Active version', value: `${isAr ? `الإصدار ${state.version}` : `Version ${state.version}`} (${state.savedAt})` },
  ]

  const gateOptions = [
    { mode: 'block' as const, title: t('cab.agreementTerms.gate.blockTitle', 'Block (recommended)'), badge: isAr ? 'موصى به' : 'Recommended', desc: t('cab.agreementTerms.gate.blockDesc', 'The plan cannot be sent until the agreement is active.') },
    { mode: 'warn' as const, title: t('cab.agreementTerms.gate.warnTitle', 'Warn'), badge: isAr ? 'مرن' : 'Flexible', desc: t('cab.agreementTerms.gate.warnDesc', 'The plan is sent and a warning is shown.') },
  ]

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
          <Button type="button" variant="primary" onClick={handleSave} icon={justSaved ? <AppIcon icon={CheckIcon} size={18} /> : undefined} className="h-11 rounded-[10px] px-5 text-[14px]">
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
              onPresetChange={setPresetKey}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview((p) => !p)}
              onInsertVariable={handleInsertVariable}
              sections={state.sections}
            />
          </div>
        </div>
      </main>
    </CabLayout>
  )
}

export default CabAgreementTermsPage
