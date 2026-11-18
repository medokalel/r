import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  CheckIcon,
  ChevronDownIcon,
  TrashIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  AGREEMENT_VARIABLES,
  type AgreementSection,
  type AgreementVariable,
} from '@/lib/api/cabAgreementTermsApi'
import { cn } from '@/lib/utils'

export type EditableFieldKey = 'titleEn' | 'titleAr' | 'textEn' | 'textAr'

interface NewSectionDrawerProps {
  draft: Omit<AgreementSection, 'id'>
  onChange: (draft: Omit<AgreementSection, 'id'>) => void
  onFocusField: (field: EditableFieldKey) => void
  onSave: () => void
  onCancel: () => void
}

export function NewAgreementSectionDrawer({
  draft,
  onChange,
  onFocusField,
  onSave,
  onCancel,
}: NewSectionDrawerProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  return (
    <div className="rounded-[16px] border-2 border-primary bg-[#f8faff] p-5 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-[#dbe6ff] pb-3">
        <span className="inline-flex size-7 items-center justify-center rounded-[8px] bg-primary text-[12px] font-bold text-white">+</span>
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">
            {isAr ? 'إضافة بند جديد إلى الاتفاقية' : 'Add new agreement section'}
          </h3>
          <p className="text-[12px] text-neutral-500">
            {isAr ? 'أدخل عنوان ونص البند ثم اضغط حفظ ليُضاف مباشرة' : 'Enter the bilingual title and clause text, then click Save section'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.titleAr', 'Title (Arabic)')}</label>
          <input
            type="text"
            dir="rtl"
            autoFocus={isAr}
            value={draft.titleAr}
            onFocus={() => onFocusField('titleAr')}
            onChange={(e) => onChange({ ...draft, titleAr: e.target.value })}
            placeholder="مثال: التزامات السرية وحماية المعلومات"
            className="h-11 w-full rounded-[10px] border border-[#d6e2ff] bg-white px-3.5 text-[14px] text-neutral-900 outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.titleEn', 'Title (English)')}</label>
          <input
            type="text"
            dir="ltr"
            autoFocus={!isAr}
            value={draft.titleEn}
            onFocus={() => onFocusField('titleEn')}
            onChange={(e) => onChange({ ...draft, titleEn: e.target.value })}
            placeholder="e.g. Information security & non-disclosure"
            className="h-11 w-full rounded-[10px] border border-[#d6e2ff] bg-white px-3.5 text-[14px] text-neutral-900 outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.textAr', 'Text (Arabic)')}</label>
          <textarea
            rows={4}
            dir="rtl"
            value={draft.textAr}
            onFocus={() => onFocusField('textAr')}
            onChange={(e) => onChange({ ...draft, textAr: e.target.value })}
            placeholder="اكتب نص البند باللغة العربية..."
            className="w-full rounded-[10px] border border-[#d6e2ff] bg-white p-3.5 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.textEn', 'Text (English)')}</label>
          <textarea
            rows={4}
            dir="ltr"
            value={draft.textEn}
            onFocus={() => onFocusField('textEn')}
            onChange={(e) => onChange({ ...draft, textEn: e.target.value })}
            placeholder="Write the clause text in English..."
            className="w-full rounded-[10px] border border-[#d6e2ff] bg-white p-3.5 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2.5 border-t border-[#dbe6ff] pt-3.5">
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 rounded-[10px] px-4 text-[13px]">
          {isAr ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="button" variant="primary" onClick={onSave} icon={<AppIcon icon={CheckIcon} size={16} />} className="h-10 rounded-[10px] px-5 text-[13px]">
          {isAr ? 'حفظ وإدراج البند' : 'Save section'}
        </Button>
      </div>
    </div>
  )
}

interface SectionCardProps {
  section: AgreementSection
  index: number
  total: number
  isExpanded: boolean
  onToggle: () => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onFocusField: (field: EditableFieldKey) => void
  onUpdateField: (field: EditableFieldKey, value: string) => void
  onInsertVariable: (variable: AgreementVariable) => void
}

export function AgreementSectionCard({
  section,
  index,
  total,
  isExpanded,
  onToggle,
  onMove,
  onDelete,
  onFocusField,
  onUpdateField,
  onInsertVariable,
}: SectionCardProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const primaryTitle = isAr ? section.titleAr || section.titleEn : section.titleEn || section.titleAr
  const secondaryTitle = isAr ? section.titleEn : section.titleAr

  return (
    <div className={cn('rounded-[16px] border bg-white transition-all', isExpanded ? 'border-primary shadow-sm' : 'border-[#ececec] hover:border-[#b9c8e4]')}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3.5 text-start">
          <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-bold', isExpanded ? 'bg-primary text-white' : 'bg-[#e8edfc] text-primary')}>
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold text-neutral-900">
              {primaryTitle || t('cab.agreementTerms.untitledSection', 'Untitled section')}
            </div>
            {secondaryTitle && <div className="mt-0.5 truncate text-[12px] text-neutral-400">{secondaryTitle}</div>}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="flex size-8 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30">
            <AppIcon icon={ChevronDownIcon} size={16} className="rotate-180" />
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="flex size-8 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-30">
            <AppIcon icon={ChevronDownIcon} size={16} />
          </button>
          <button type="button" onClick={onDelete} className="flex size-8 items-center justify-center rounded-[8px] text-[#dc2626] hover:bg-[#fef2f2]">
            <AppIcon icon={TrashIcon} size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 rounded-b-[16px] border-t border-[#f0f0f0] bg-[#fcfcfd] px-5 pb-5 pt-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-[#e8edfc] bg-white px-3 py-2">
            <span className="me-1 text-[11px] font-bold text-neutral-500">{isAr ? 'إدراج سريع:' : 'Quick insert:'}</span>
            {AGREEMENT_VARIABLES.slice(0, 6).map((v) => (
              <button key={v.key} type="button" onClick={() => onInsertVariable(v)} className="rounded-[6px] bg-[#f4f7ff] px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white">
                + {isAr ? v.labelAr : v.labelEn}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.titleAr', 'Title (Arabic)')}</label>
              <input type="text" dir="rtl" value={section.titleAr} onFocus={() => onFocusField('titleAr')} onChange={(e) => onUpdateField('titleAr', e.target.value)} className="h-11 w-full rounded-[10px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] font-medium text-neutral-900 outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.titleEn', 'Title (English)')}</label>
              <input type="text" dir="ltr" value={section.titleEn} onFocus={() => onFocusField('titleEn')} onChange={(e) => onUpdateField('titleEn', e.target.value)} className="h-11 w-full rounded-[10px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] font-medium text-neutral-900 outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.textAr', 'Text (Arabic)')}</label>
              <textarea rows={5} dir="rtl" value={section.textAr} onFocus={() => onFocusField('textAr')} onChange={(e) => onUpdateField('textAr', e.target.value)} className="w-full rounded-[10px] border border-[#e2e2e2] bg-white p-3.5 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-800">{t('cab.agreementTerms.textEn', 'Text (English)')}</label>
              <textarea rows={5} dir="ltr" value={section.textEn} onFocus={() => onFocusField('textEn')} onChange={(e) => onUpdateField('textEn', e.target.value)} className="w-full rounded-[10px] border border-[#e2e2e2] bg-white p-3.5 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
