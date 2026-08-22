import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { AppIcon, AddCircleIcon, EditIcon, SearchIcon, TrashIcon } from '@/components/icons'
import { Textarea } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { AddStandardModal } from '@/components/dashboard/cab/AddStandardModal'
import { STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import { SCOPE_TEXT_MAX_LENGTH, type SelectedStandard, type StandardsScopeForm } from '@/lib/standardsScopeForm'
import { cn } from '@/lib/utils'

interface StandardsScopeStepProps {
  form: StandardsScopeForm
  onPatch: (f: Partial<StandardsScopeForm>) => void
}

function standardName(value: string): string {
  return STANDARD_SCHEMA_OPTIONS.find((s) => s.value === value)?.name ?? value
}

export function StandardsScopeStep({ form, onPatch }: StandardsScopeStepProps) {
  const { t } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const addStandard = (standard: SelectedStandard) =>
    onPatch({ standards: [...form.standards, standard] })

  const removeStandard = (id: string) =>
    onPatch({ standards: form.standards.filter((s) => s.id !== id) })

  const updateScope = (id: string, scopeText: string) =>
    onPatch({
      standards: form.standards.map((s) => (s.id === id ? { ...s, scopeText } : s)),
    })

  return (
    <div className="space-y-5">
      <SectionHeading
        title={t('cab.applicationDraft.standardsScope.title')}
        accordion
        headerActions={
          <Button
            type="button"
            variant="secondary"
            className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4"
            onClick={() => setIsAddOpen(true)}
          >
            <AppIcon icon={AddCircleIcon} size={24} />
            {t('cab.applicationDraft.standardsScope.addStandard')}
          </Button>
        }
      >
        {form.standards.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-neutral-500">
            {t('cab.applicationDraft.standardsScope.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[#ececec]">
            <table className="w-full min-w-[720px] border-collapse text-start">
              <thead>
                <tr className="bg-[#f9fafc] text-[13px] text-neutral-500">
                  <th className="w-12 px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.standardSchema')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">{t('cab.applicationDraft.standardsScope.columns.ihfCode')}</th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.certificationType')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.accreditationBody')}
                  </th>
                  <th className="w-24 px-4 py-3 text-start font-medium">
                    {t('cab.applicationDraft.standardsScope.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.standards.map((s, index) => (
                  <tr key={s.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]', 'border-t border-[#ececec]')}>
                    <td className="px-4 py-4 align-top text-[14px] text-neutral-500">{index + 1}</td>
                    <td className="px-4 py-4 align-top text-[14px] font-medium text-neutral-900">
                      {standardName(s.standard)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-[6px] bg-primary px-2 py-0.5 text-[12px] font-semibold text-white">
                          {s.ihfCode}
                        </span>
                        <span className="text-[13px] text-neutral-500">{s.ihfCategory}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-[14px] text-neutral-700">{s.certificationType}</td>
                    <td className="px-4 py-4 align-top text-[14px] text-neutral-700">{s.accreditationBody}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-primary"
                          aria-label={t('common.edit')}
                        >
                          <AppIcon icon={EditIcon} size={24} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStandard(s.id)}
                          className="text-error-400 hover:text-error-600"
                          aria-label={t('common.delete')}
                        >
                          <AppIcon icon={TrashIcon} size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionHeading>

      {form.standards.length > 0 && (
        <SectionHeading
          title={t('cab.applicationDraft.standardsScope.scopeSectionTitle')}
          accordion
        >
          <div className="space-y-4">
            {form.standards.map((s) => (
              <SectionHeading
                key={s.id}
                accordion
                title={`${standardName(s.standard)} — ${s.certificationType}`}
                headerActions={
                  <span className="rounded-[6px] bg-primary px-2 py-0.5 text-[12px] font-semibold text-white">
                    {s.ihfCode} — {s.ihfCategory}
                  </span>
                }
              >
                <Textarea
                  rows={3}
                  value={s.scopeText}
                  maxLength={SCOPE_TEXT_MAX_LENGTH}
                  onChange={(e) => updateScope(s.id, e.target.value)}
                  placeholder={t('cab.applicationDraft.standardsScope.scopePlaceholder')}
                />
                <p className="mt-1 text-end text-[12px] text-neutral-400">
                  {s.scopeText.length} / {SCOPE_TEXT_MAX_LENGTH} {t('cab.applicationDraft.standardsScope.characters')}
                </p>
              </SectionHeading>
            ))}
          </div>
        </SectionHeading>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" className="text-[14px] font-semibold text-primary underline underline-offset-2">
          {t('cab.applicationDraft.standardsScope.needHelp')}
        </button>
        <Button type="button" variant="secondary" className="h-[40px] gap-2 rounded-[var(--radius-sm)] px-4">
          <AppIcon icon={SearchIcon} size={24} />
          {t('cab.applicationDraft.standardsScope.searchIhfCode')}
        </Button>
      </div>

      <AddStandardModal open={isAddOpen} onOpenChange={setIsAddOpen} onAdd={addStandard} />
    </div>
  )
}