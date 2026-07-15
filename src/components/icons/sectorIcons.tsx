import type { SectorKey } from '@/components/dashboard/entityData/fieldTypes'
import { cn } from '@/lib/utils'

export const sectorIconSources: Record<SectorKey, string> = {
  agriculture: '/field-sectors/food.svg',
  miningAndQuarrying: '/field-sectors/metals-and-building-materials.svg',
  food: '/field-sectors/food.svg',
  mechanicalIndustries: '/field-sectors/mechanical-industries.svg',
  paperAndPrinting: '/field-sectors/paper-and-printing.svg',
  metalsAndBuildingMaterials: '/field-sectors/metals-and-building-materials.svg',
  constructionAndBuilding: '/field-sectors/construction-and-building.svg',
  industrialProduction: '/field-sectors/industrial-production.svg',
  chemicalIndustries: '/field-sectors/chemical-industries.svg',
  energySupplies: '/field-sectors/energy-supplies.svg',
  transportationAndWaste: '/field-sectors/transportation-and-waste.svg',
  services: '/field-sectors/services.svg',
  nuclearSector: '/field-sectors/nuclear-sector.svg',
  pharmaceuticalSector: '/field-sectors/pharmaceutical-sector.svg',
  aviationAndSpace: '/field-sectors/aviation-and-space.svg',
  healthSector: '/field-sectors/health-sector.svg',
}

interface SectorIconProps {
  sector: SectorKey
  selected?: boolean
  className?: string
}

export function SectorIcon({ sector, selected = false, className }: SectorIconProps) {
  const src = sectorIconSources[sector]

  return (
    <span
      className={cn(
        'size-6 shrink-0 bg-current',
        selected ? 'text-primary' : 'text-neutral-500',
        className
      )}
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden
    />
  )
}
