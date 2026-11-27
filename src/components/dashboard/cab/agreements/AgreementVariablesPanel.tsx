import { useTranslation } from 'react-i18next'
import { AppIcon, EyeIcon, FileTextIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AGREEMENT_VARIABLES, type AgreementVariable } from '@/lib/api/cabAgreementTermsApi'

interface AgreementVariablesPanelProps {
  presetKey: string
  /** Every registered audit client of this CAB. */
  presetOptions: { value: string; label: string }[]
  onPresetChange: (presetKey: string) => void
  showPreview: boolean
  onTogglePreview: () => void
  onInsertVariable: (variable: AgreementVariable) => void
}

export function AgreementVariablesPanel({
  presetKey,
  presetOptions,
  onPresetChange,
  showPreview,
  onTogglePreview,
  onInsertVariable,
}: AgreementVariablesPanelProps) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  return (
    <div className="flex flex-col gap-5 xl:sticky xl:top-6">
      {/* iCASCO Variables & Preset Card */}
      <aside className="rounded-[16px] border border-[#ececec] bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
              <AppIcon icon={FileTextIcon} size={18} />
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-neutral-900">
                {t('cab.agreementTerms.variables.title', 'Variables')}
              </h2>
              <p className="text-[12px] text-neutral-500">
                {AGREEMENT_VARIABLES.length}{' '}
                {isAr ? 'متغير ديناميكي جاهز' : 'dynamic placeholders'}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">
          {t(
            'cab.agreementTerms.variables.subtitle',
            "Click a variable to insert it where your cursor is. Each agreement fills it with the client's value.",
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {AGREEMENT_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsertVariable(v)}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#d6e2ff] bg-[#f4f7ff] px-3 py-1.5 text-[12px] font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"
            >
              <span>+</span>
              <span>{isAr ? v.labelAr : v.labelEn}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3 border-t border-[#f0f0f0] pt-4">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-neutral-700">
              {t(
                'cab.agreementTerms.variables.fillWith',
                'Fill the variables with',
              )}
            </label>
            <SearchableSelect
              value={presetKey}
              onChange={onPresetChange}
              options={presetOptions}
              placeholder={presetOptions.length ? t('cab.agreementTerms.variables.selectClient', 'Select a client') : t('cab.agreementTerms.variables.noClients', 'No registered clients yet')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          <Button
            type="button"
            variant={showPreview ? 'primary' : 'outline'}
            onClick={onTogglePreview}
            disabled={!presetKey}
            icon={<AppIcon icon={EyeIcon} size={18} />}
            className="h-11 w-full rounded-[10px] text-[14px]"
          >
            {showPreview
              ? t('cab.agreementTerms.variables.hidePreview', 'Hide preview')
              : t('cab.agreementTerms.variables.showPreview', 'Show preview')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
