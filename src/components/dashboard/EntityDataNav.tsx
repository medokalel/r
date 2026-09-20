import { useTranslation } from 'react-i18next'
import { entityDataNavIconComponents } from '@/components/icons/entityDataNavIcons'
import { cn } from '@/lib/utils'

const subSections = [
  'legalIdentity',
  'scopeOfActivity',
  'consultingReadiness',
  'specificationQuestions',
  'legalDeclarations',
] as const

export type EntityDataSubSection = (typeof subSections)[number]

export type EntityDataViewTab = 'entityData' | 'field' | 'documents' | 'feedback' | 'approved' | 'underReview' | 'rejected'

export { subSections }

type NavViewTab = keyof typeof import('@/components/icons/entityDataNavIcons').entityDataNavIconComponents

const viewTabs: NavViewTab[] = ['field', 'documents', 'feedback']

interface EntityDataNavProps {
  activeSubSection?: EntityDataSubSection
  activeViewTab?: EntityDataViewTab
  onSubSectionChange?: (section: EntityDataSubSection) => void
  onViewTabChange?: (tab: EntityDataViewTab) => void
}

export function EntityDataNav({
  activeSubSection = 'legalIdentity',
  activeViewTab = 'entityData',
  onSubSectionChange,
  onViewTabChange,
}: EntityDataNavProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'
  const activeIndex = subSections.indexOf(activeSubSection)
  const isEntityDataExpanded = activeViewTab === 'entityData'
  const EntityDataIcon = entityDataNavIconComponents.entityData

  return (
    <nav
      className="sticky top-0 w-[275px] shrink-0 self-start rounded-[var(--radius-lg)] border border-[#ececec] bg-[#fcfcfc] p-5 shadow-[0_6px_20px_rgba(153,155,168,0.1)]"
      aria-label={t('accreditation.entityData.title')}
    >
      <div
        className={cn(
          'overflow-hidden rounded-[var(--radius-sm)]',
          isEntityDataExpanded && 'bg-[rgba(232,237,252,0.5)]'
        )}
      >
        <button
          type="button"
          onClick={() => onViewTabChange?.('entityData')}
          aria-expanded={isEntityDataExpanded}
          aria-current={isEntityDataExpanded ? 'page' : undefined}
          className={cn(
            'flex w-full items-center gap-3 py-2.5 text-[16px] font-medium leading-[1.6] transition-colors',
            isEntityDataExpanded
              ? 'border-s-[3px] border-primary ps-[5px] pe-2 text-primary'
              : 'rounded-[var(--radius-sm)] px-2 text-neutral-600 hover:bg-[#f4f4f4]'
          )}
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
              isEntityDataExpanded
                ? 'bg-primary text-white shadow-[0_10px_15px_-3px_rgba(18,54,163,0.3)]'
                : 'bg-[#f4f4f4] text-neutral-600'
            )}
          >
            <EntityDataIcon className={isEntityDataExpanded ? 'text-white' : undefined} />
          </span>
          {t('accreditation.entityData.title')}
        </button>

        {isEntityDataExpanded && (
          <ul className="relative px-2 pb-2">
            {subSections.map((key, index) => {
              const isActive = index === activeIndex
              const isLast = index === subSections.length - 1

              return (
                <li key={key} className="relative">
                  <button
                    type="button"
                    onClick={() => onSubSectionChange?.(key)}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-2 rounded-e-[var(--radius-sm)] py-2.5 ps-8 pe-2 text-start transition-colors',
                      isActive
                        ? 'text-[16px] font-medium leading-[1.6] text-neutral-900'
                        : cn('text-[16px] leading-[1.6] text-[#525252] hover:bg-white/50', isRTL ? 'font-light' : 'font-normal')
                    )}
                  >
                    {!isLast && (
                      <span
                        className={cn(
                          'absolute start-[17px] top-[22px] w-0.5 -bottom-4',
                          index === activeIndex ? 'bg-primary' : 'bg-[#ffffff]'
                        )}
                        aria-hidden
                      />
                    )}

                    <span
                      className={cn(
                        'absolute z-10 shrink-0 rounded-full top-[22px] -translate-y-1/2',
                        isActive
                          ? 'start-[13px] size-[10px] bg-primary ring-3 ring-white shadow-[0_10px_15px_-3px_rgba(18,54,163,0.3)]'
                          : 'start-[15px] size-[7px] bg-[#bdbdbd]'
                      )}
                      aria-hidden
                    />

                    <span>{t(`accreditation.entityData.sections.${key}`)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ul className="mt-2 space-y-0">
        {viewTabs.map((key) => {
          const isActive = activeViewTab === key
          const Icon = entityDataNavIconComponents[key]

          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onViewTabChange?.(key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-sm)] py-2.5 text-[16px] font-medium leading-[1.6] transition-colors',
                  isActive
                    ? 'border-s-[3px] border-primary bg-[#f3f6fd] ps-[5px] pe-2 text-primary'
                    : 'px-2 text-neutral-600 hover:bg-[#f4f4f4]'
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
                    isActive
                      ? 'bg-primary text-white shadow-[0_10px_15px_-3px_rgba(18,54,163,0.3)]'
                      : 'bg-[#f4f4f4] text-neutral-600'
                  )}
                >
                  <Icon className={isActive ? 'text-white' : undefined} />
                </span>
                {t(`accreditation.entityData.nav.${key}`)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
