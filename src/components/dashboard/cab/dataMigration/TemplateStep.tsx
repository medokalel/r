import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadTrayIcon, ExcelFileIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import { templateFileName, type ImportLanguage, type Translate } from '@/lib/dataMigrationForm'
import type { ImportColumn, ImportEntityKey } from '@/lib/dataMigrationTypes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { downloadImportTemplate } from './downloadImportTemplate'

interface TemplateStepProps {
  entityKey: ImportEntityKey
  isArabic: boolean
}

function ColumnChips({ columns, isArabic, className }: { columns: ImportColumn[]; isArabic: boolean; className: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {columns.map((column) => (
        <li key={column.key} className={cn('rounded-full px-2.5 py-1 text-[12px]', className)}>
          {isArabic ? column.labelAr : column.labelEn}
        </li>
      ))}
    </ul>
  )
}

export function TemplateStep({ entityKey, isArabic }: TemplateStepProps) {
  const { t } = useTranslation()
  const entity = getImportEntity(entityKey)
  const [language, setLanguage] = useState<ImportLanguage>(isArabic ? 'ar' : 'en')

  const required = entity.columns.filter((column) => column.required)
  const later = entity.columns.filter((column) => !column.required && column.later)
  const optional = entity.columns.filter((column) => !column.required && !column.later)

  const handleDownload = () => {
    const translate: Translate = (key, options) => t(key, options)
    toast.success(t('cab.dataMigration.template.downloaded', { file: downloadImportTemplate(entityKey, language, translate) }))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div>
          <h3 className="text-[16px] font-bold text-neutral-900">
            {t('cab.dataMigration.wizard.template.title', { entity: isArabic ? entity.labelAr : entity.labelEn })}
          </h3>
          <p className="mt-1 text-[14px] leading-[1.7] text-neutral-600">
            {isArabic ? entity.descriptionAr : entity.descriptionEn}
          </p>
          <p className="mt-1 text-[14px] leading-[1.7] text-neutral-600">{t('cab.dataMigration.wizard.template.body')}</p>
        </div>

        <div className="space-y-4 rounded-[var(--radius-md)] border border-[#ececec] bg-[#fafbfd] p-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-error-700">
              {t('cab.dataMigration.wizard.template.required')}
            </p>
            <p className="mb-2 text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.template.requiredHint')}</p>
            <ColumnChips columns={required} isArabic={isArabic} className="bg-white text-neutral-900 ring-1 ring-inset ring-error-200" />
          </div>
          {later.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#a05a00]">
                {t('cab.dataMigration.wizard.template.later')}
              </p>
              <p className="mb-2 text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.template.laterHint')}</p>
              <ColumnChips columns={later} isArabic={isArabic} className="bg-white text-neutral-900 ring-1 ring-inset ring-[#fde9c8]" />
            </div>
          )}
          {optional.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                {t('cab.dataMigration.wizard.template.optional')}
              </p>
              <ColumnChips columns={optional} isArabic={isArabic} className="bg-white text-neutral-600 ring-1 ring-inset ring-[#e2e2e2]" />
            </div>
          )}
        </div>

        <p className="text-[12px] leading-[1.7] text-neutral-600">{t('cab.dataMigration.wizard.template.formats')}</p>
      </div>

      <div className="flex flex-col gap-4 self-start rounded-[var(--radius-md)] border border-[#dbe4fb] bg-[#f3f6fd] p-4">
        <div className="flex items-center gap-3">
          <AppIcon icon={ExcelFileIcon} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-neutral-900" dir="ltr">
              {templateFileName(entityKey)}
            </p>
            <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.template.sheets')}</p>
          </div>
        </div>
        <fieldset>
          <legend className="mb-1 text-[12px] font-semibold text-neutral-600">
            {t('cab.dataMigration.wizard.template.language')}
          </legend>
          <RadioGroup
            name="template-language"
            value={language}
            onChange={(value) => setLanguage(value as ImportLanguage)}
            options={[
              { value: 'en', label: t('cab.dataMigration.wizard.template.english') },
              { value: 'ar', label: t('cab.dataMigration.wizard.template.arabic') },
            ]}
          />
        </fieldset>
        <Button icon={<AppIcon icon={DownloadTrayIcon} size={18} />} onClick={handleDownload}>
          {t('cab.dataMigration.wizard.template.download')}
        </Button>
      </div>
    </div>
  )
}