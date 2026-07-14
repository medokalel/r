import { useTranslation } from 'react-i18next'
import { AppIcon, DownloadIcon, EyeIcon } from '@/components/icons'
import { CardHeader } from './Primitives'

export function FileOperationsCard() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-[#ececec] bg-white p-6">
      <CardHeader title={t('companyProfile.fileOperations.title')} />
      <div className="flex flex-col gap-3">
        {[
          { icon: EyeIcon, label: 'preview', subtitle: 'previewSubtitle' },
          { icon: DownloadIcon, label: 'download', subtitle: 'downloadSubtitle' },
        ].map(({ icon, label, subtitle }) => (
          <button
            key={label}
            type="button"
            className="flex h-20 items-center gap-3 rounded-[8px] border border-dashed border-primary/60 bg-[#f3f6fd] px-4 transition-colors hover:bg-[#e8edfc]"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <AppIcon icon={icon} size={22} className="text-primary" />
            </div>
            <div className="flex flex-1 flex-col items-start gap-0.5">
              <p className="text-[16px] font-medium leading-[1.6] text-neutral-900">
                {t(`companyProfile.fileOperations.${label}`)}
              </p>
              <p className="text-[14px] font-light leading-[1.6] text-[#666]">
                {t(`companyProfile.fileOperations.${subtitle}`)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
