import { useState } from 'react'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { standards } from '@/components/dashboard/entityData/fieldTypes'
import { EntityDataFieldCodesStep } from '@/components/dashboard/entityData/EntityDataFieldCodesStep'
import { EntityDataFieldSectorsStep } from '@/components/dashboard/entityData/EntityDataFieldSectorsStep'

interface EntityDataFieldStepProps {
  phase: FieldPhase
  /** Sector selections per standard — each tab keeps its own list. */
  selectedSectors: Record<string, SectorKey[]>
  onSelectedSectorsChange: (standard: StandardKey, sectors: SectorKey[]) => void
  selectedStandards?: StandardKey[]
  selectedCodes: Record<string, string[]>
  onSelectedCodesChange: (codes: Record<string, string[]>) => void
}

export function EntityDataFieldStep({
  phase,
  selectedSectors,
  onSelectedSectorsChange,
  selectedStandards,
  selectedCodes,
  onSelectedCodesChange,
}: EntityDataFieldStepProps) {
  // Tabs are limited to what the user picked in "Required Standard Specification";
  // fall back to all IAF MD 17 standards when nothing is picked yet
  const availableStandards =
    selectedStandards && selectedStandards.length > 0 ? selectedStandards : [...standards]

  const [activeStandard, setActiveStandard] = useState<StandardKey>(availableStandards[0])
  const effectiveStandard = availableStandards.includes(activeStandard)
    ? activeStandard
    : availableStandards[0]

  const activeSectors = selectedSectors[effectiveStandard] ?? []

  // Per-tab selection counts so users can see which certificates still need choices
  const sectorCounts = Object.fromEntries(
    availableStandards.map((standard) => [
      standard,
      (selectedSectors[standard] ?? []).length,
    ])
  )
  const codeCounts = Object.fromEntries(
    availableStandards.map((standard) => [
      standard,
      Object.entries(selectedCodes)
        .filter(([key]) => key.startsWith(`${standard}:`))
        .reduce((total, [, codes]) => total + codes.length, 0),
    ])
  )

  if (phase === 'codes') {
    return (
      <EntityDataFieldCodesStep
        selectedSectors={activeSectors}
        availableStandards={availableStandards}
        activeStandard={effectiveStandard}
        onActiveStandardChange={setActiveStandard}
        selectedCodes={selectedCodes}
        onSelectedCodesChange={onSelectedCodesChange}
        standardCounts={codeCounts}
      />
    )
  }

  return (
    <EntityDataFieldSectorsStep
      availableStandards={availableStandards}
      activeStandard={effectiveStandard}
      onActiveStandardChange={setActiveStandard}
      selectedSectors={activeSectors}
      onSelectedSectorsChange={(sectors) =>
        onSelectedSectorsChange(effectiveStandard, sectors)
      }
      standardCounts={sectorCounts}
    />
  )
}
