import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, SearchOutlineIcon } from '@/components/icons'
import { SectorIcon } from '@/components/icons/sectorIcons'
import {
  fieldInputClassName,
  fieldHeightClassName,
  fieldTitleClassName,
} from '@/components/dashboard/FormField'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { sectorsForStandard } from '@/components/dashboard/entityData/fieldTypes'
import { StandardTabs } from '@/components/dashboard/entityData/StandardTabs'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EntityDataFieldSectorsStepProps {
  availableStandards: StandardKey[]
  activeStandard: StandardKey
  onActiveStandardChange: (standard: StandardKey) => void
  selectedSectors: SectorKey[]
  onSelectedSectorsChange: (sectors: SectorKey[]) => void
}

interface SectorCardProps {
  sectorKey: SectorKey
  title: string
  description: string
  selected: boolean
  onToggle: () => void
}

function SectorCard({ sectorKey, title, description, selected, onToggle }: SectorCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full flex-col gap-3 rounded-[var(--radius-md)] border px-3 py-4 text-start text-[16px] shadow-[0_6px_20px_rgba(153,155,168,0.1)] transition-colors',
        selected
          ? 'border-[#a3b8f5] bg-[#f3f6fd]'
          : 'border-[#ececec] bg-[#fcfcfc] hover:border-neutral-300'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white shadow-[0_6px_10px_rgba(153,155,168,0.1)]"
        >
          <SectorIcon sector={sectorKey} selected={selected} />
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
      <div>
        <p className={cn(fieldTitleClassName, 'text-neutral-900')}>{title}</p>
        <p className="text-[14px] font-light leading-[1.6] text-neutral-600">{description}</p>
      </div>
    </button>
  )
}

export function EntityDataFieldSectorsStep({
  availableStandards,
  activeStandard,
  onActiveStandardChange,
  selectedSectors,
  onSelectedSectorsChange,
}: EntityDataFieldSectorsStepProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const sectorTitle = (key: SectorKey) => t(`accreditation.entityData.field.sectors.${key}.title`)
  const sectorDescription = (key: SectorKey) =>
    t(`accreditation.entityData.field.sectors.${key}.description`)

  const filteredSectors = useMemo(() => {
    // Clusters defined for the active standard per IAF MD 17
    const standardSectors = sectorsForStandard(activeStandard)
    const query = searchQuery.trim().toLowerCase()
    if (!query) return standardSectors

    return standardSectors.filter((key) => {
      const title = sectorTitle(key).toLowerCase()
      const description = sectorDescription(key).toLowerCase()
      return title.includes(query) || description.includes(query)
    })
  }, [activeStandard, searchQuery, t])

  const toggleSector = (key: SectorKey) => {
    onSelectedSectorsChange(
      selectedSectors.includes(key)
        ? selectedSectors.filter((item) => item !== key)
        : [...selectedSectors, key]
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative min-w-[280px] flex-1">
          <AppIcon
            icon={SearchOutlineIcon}
            size={24}
            className="pointer-events-none absolute start-6 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('accreditation.entityData.field.searchPlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName, 'ps-14 pe-6')}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          className={cn(fieldHeightClassName, 'min-w-[120px] rounded-[var(--radius-sm)]')}
        >
          {t('accreditation.entityData.field.search')}
        </Button>
      </div>

      <StandardTabs
        standards={availableStandards}
        activeStandard={activeStandard}
        onChange={onActiveStandardChange}
      />

      <div className="sectors-grid grid gap-5 sm:grid-cols-2">
        {filteredSectors.map((key) => (
          <SectorCard
            key={key}
            sectorKey={key}
            title={sectorTitle(key)}
            description={sectorDescription(key)}
            selected={selectedSectors.includes(key)}
            onToggle={() => toggleSector(key)}
          />
        ))}
      </div>
    </div>
  )
}
