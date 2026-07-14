import { useTranslation } from 'react-i18next'
import {
  fieldStandardTabActiveClassName,
  fieldStandardTabClassName,
  fieldStandardTabInactiveClassName,
} from '@/components/dashboard/FormField'
import type { StandardKey } from '@/components/dashboard/entityData/fieldTypes'
import { WesternDigits } from '@/components/WesternDigits'
import { cn } from '@/lib/utils'

interface StandardTabsProps {
  standards: StandardKey[]
  activeStandard: StandardKey
  onChange: (standard: StandardKey) => void
}

export function StandardTabs({ standards, activeStandard, onChange }: StandardTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="inline-flex self-start rounded-[var(--radius-md)] border border-[#ececec] bg-[#f4f4f4] p-1">
      {standards.map((standard) => {
        const isActive = activeStandard === standard
        return (
          <button
            key={standard}
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(standard)}
            className={cn(
              fieldStandardTabClassName,
              isActive ? fieldStandardTabActiveClassName : fieldStandardTabInactiveClassName
            )}
          >
            <WesternDigits>
              {t(`accreditation.entityData.field.standards.${standard}`)}
            </WesternDigits>
          </button>
        )
      })}
    </div>
  )
}
