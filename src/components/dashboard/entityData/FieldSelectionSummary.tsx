import { useTranslation } from 'react-i18next'
import { fieldTextClassName } from '@/components/ui'
import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'
import { cn } from '@/lib/utils'

interface FieldSelectionSummaryProps {
  selectedSectors: SectorKey[]
}

export function FieldSelectionSummary({ selectedSectors }: FieldSelectionSummaryProps) {
  const { t } = useTranslation()

  const sectorTitle = (key: SectorKey) => t(`accreditation.entityData.field.sectors.${key}.title`)

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div>
        <p className="text-[14px] leading-[1.6] text-neutral-600">
          {t('accreditation.entityData.field.selectionSummary')}
        </p>
        <p className="text-[14px] font-semibold text-primary">
          {t('accreditation.entityData.field.selectedCount', {
            count: selectedSectors.length,
          })}
        </p>
      </div>
      {selectedSectors.length > 0 && (
        <>
          <span className="h-5 w-px bg-[#ececec]" aria-hidden />
          <div className="flex flex-wrap gap-2">
            {selectedSectors.map((key) => (
              <span
                key={key}
                className={cn(
                  'rounded-[4px] border border-[#d1dbfa] bg-[#f3f6fd] px-2.5 py-1',
                  fieldTextClassName,
                  'text-neutral-900'
                )}
              >
                {sectorTitle(key)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
