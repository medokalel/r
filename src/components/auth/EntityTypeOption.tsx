import { useTranslation } from 'react-i18next'
import { EntityTypeIcon } from '@/components/auth/EntityTypeIcon'
import { cn } from '@/lib/utils'

export type EntityType = 'governmental' | 'private' | 'third_party'

const options: { type: EntityType; labelKey: string }[] = [
  { type: 'governmental', labelKey: 'register.governmental' },
  { type: 'private', labelKey: 'register.privateSector' },
  { type: 'third_party', labelKey: 'register.thirdParty' },
]

interface EntityTypeOptionProps {
  selected: EntityType | null
  onSelect: (type: EntityType) => void
}

export function EntityTypeOption({ selected, onSelect }: EntityTypeOptionProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 w-full">
      {options.map(({ type, labelKey }) => {
        const isSelected = selected === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'flex w-full items-center gap-4 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-4',
              'text-start transition-colors hover:border-neutral-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isSelected && 'border-primary bg-primary-subtle'
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-subtle">
              <EntityTypeIcon className="text-primary" />
            </div>
            <span className="text-body-1 text-neutral-900">{t(labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
