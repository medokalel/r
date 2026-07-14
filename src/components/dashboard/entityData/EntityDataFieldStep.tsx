import { useState } from 'react'
import type { FieldPhase, SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { standards } from '@/components/dashboard/entityData/fieldTypes'
import { EntityDataFieldCodesStep } from '@/components/dashboard/entityData/EntityDataFieldCodesStep'
import { EntityDataFieldSectorsStep } from '@/components/dashboard/entityData/EntityDataFieldSectorsStep'

interface EntityDataFieldStepProps {
  phase: FieldPhase
  selectedSectors: SectorKey[]
  onSelectedSectorsChange: (sectors: SectorKey[]) => void
  selectedStandards?: StandardKey[]
}

export function EntityDataFieldStep({
  phase,
  selectedSectors,
  onSelectedSectorsChange,
  selectedStandards,
}: EntityDataFieldStepProps) {
  // Tabs are limited to what the user picked in "Required Standard Specification";
  // fall back to all IAF MD 17 standards when nothing is picked yet
  const availableStandards =
    selectedStandards && selectedStandards.length > 0 ? selectedStandards : [...standards]

  const [activeStandard, setActiveStandard] = useState<StandardKey>(availableStandards[0])
  const effectiveStandard = availableStandards.includes(activeStandard)
    ? activeStandard
    : availableStandards[0]

  if (phase === 'codes') {
    return (
      <EntityDataFieldCodesStep
        selectedSectors={selectedSectors}
        availableStandards={availableStandards}
        activeStandard={effectiveStandard}
        onActiveStandardChange={setActiveStandard}
      />
    )
  }

  return (
    <EntityDataFieldSectorsStep
      availableStandards={availableStandards}
      activeStandard={effectiveStandard}
      onActiveStandardChange={setActiveStandard}
      selectedSectors={selectedSectors}
      onSelectedSectorsChange={onSelectedSectorsChange}
    />
  )
}
