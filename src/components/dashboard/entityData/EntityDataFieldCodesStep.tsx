import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fieldTitleClassName } from '@/components/dashboard/FormField'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { codesForStandardSector, sectorsForStandard } from '@/components/dashboard/entityData/fieldTypes'
import { StandardTabs } from '@/components/dashboard/entityData/StandardTabs'
import { SectorIcon } from '@/components/icons/sectorIcons'
import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

interface EntityDataFieldCodesStepProps {
  selectedSectors: SectorKey[]
  availableStandards: StandardKey[]
  activeStandard: StandardKey
  onActiveStandardChange: (standard: StandardKey) => void
}

interface IafCodeCardProps {
  sector: SectorKey
  title: string
  code: string
  critical?: boolean
  selected: boolean
  onToggle: () => void
}

function IafCodeCard({ sector, title, code, critical, selected, onToggle }: IafCodeCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full flex-col rounded-[var(--radius-md)] border-2 p-2 text-start text-[16px] transition-colors',
        critical
          ? 'border-error-500 shadow-[0_1px_10px_rgba(255,59,48,0.3)]'
          : selected
            ? 'border-primary'
            : 'border-[#ececec]'
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-3 rounded-[var(--radius-md)] bg-[#fcfcfc] p-3',
          critical && 'shadow-[0_1px_10px_rgba(255,59,48,0.3)]'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white shadow-[0_6px_10px_rgba(153,155,168,0.1)]">
            <SectorIcon sector={sector} selected={selected} className="size-6" />
          </span>
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded border',
              selected ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white'
            )}
            aria-hidden
          >
            {selected ? '✓' : ''}
          </span>
        </div>

        <p className={cn('min-h-16', fieldTitleClassName, 'text-neutral-900')}>{title}</p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-neutral-600">
            <span className="text-[16px] font-semibold">IAF</span> Code:
          </span>
          <span
            className={cn(
              'min-w-[31px] rounded-[2px] px-1 text-center text-[16px] font-semibold',
              critical ? 'bg-[#fceae8] text-error-500' : 'bg-[#eafaf1] text-[#26a65b]'
            )}
          >
            <WesternDigits>{code}</WesternDigits>
          </span>
        </div>
      </div>
    </button>
  )
}

export function EntityDataFieldCodesStep({
  selectedSectors,
  availableStandards,
  activeStandard,
  onActiveStandardChange,
}: EntityDataFieldCodesStepProps) {
  const { t } = useTranslation()
  // Selections are kept per standard so switching tabs doesn't mix codes
  const [selectedCodes, setSelectedCodes] = useState<Record<string, string[]>>({})

  const sectorTitle = (sector: SectorKey) => t(`accreditation.entityData.field.sectors.${sector}.title`)

  const codeTitle = (descriptionKey: string) =>
    t(`accreditation.entityData.field.iafCodes.${descriptionKey}`)

  const selectionKey = (sector: SectorKey) => `${activeStandard}:${sector}`

  const toggleCode = (sector: SectorKey, code: string) => {
    setSelectedCodes((current) => {
      const key = selectionKey(sector)
      const sectorCodes = current[key] ?? []
      return {
        ...current,
        [key]: sectorCodes.includes(code)
          ? sectorCodes.filter((item) => item !== code)
          : [...sectorCodes, code],
      }
    })
  }

  // Only sectors that exist as clusters of the active standard per IAF MD 17
  const visibleSectors = sectorsForStandard(activeStandard).filter((sector) =>
    selectedSectors.includes(sector)
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-[28px] font-semibold leading-[1.6] text-neutral-900">
          {t('accreditation.entityData.field.codesTitle')}
        </h3>
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[rgba(252,234,232,0.5)] px-3 py-3">
          <span className="size-2 shrink-0 rounded-full bg-error-500" aria-hidden />
          <p className="text-[16px] font-medium text-neutral-600">
            {t('accreditation.entityData.field.criticalCodeNote')}
          </p>
        </div>
      </div>

      <StandardTabs
        standards={availableStandards}
        activeStandard={activeStandard}
        onChange={onActiveStandardChange}
      />

      {visibleSectors.map((sector) => {
        const codes = codesForStandardSector(activeStandard, sector)
        if (codes.length === 0) return null

        return (
          <div key={sector} className="space-y-5">
            <SectionHeading title={sectorTitle(sector)} size="compact" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {codes.map((item) => (
                <IafCodeCard
                  key={item.code}
                  sector={sector}
                  title={codeTitle(item.descriptionKey)}
                  code={item.code}
                  critical={item.critical}
                  selected={(selectedCodes[selectionKey(sector)] ?? []).includes(item.code)}
                  onToggle={() => toggleCode(sector, item.code)}
                />
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}
