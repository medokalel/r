import { cn } from '@/lib/utils'
import type { ChecklistSource } from '@/lib/auditChecklistTypes'

interface ChecklistTabsProps {
  tabs: { id: ChecklistSource; label: string }[]
  value: ChecklistSource
  onChange: (value: ChecklistSource) => void
  ariaLabel: string
}

/** Library / My checklists switch (same tab styling as the other CAB pages). */
export function ChecklistTabs({ tabs, value, onChange, ariaLabel }: ChecklistTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-[#ececec]" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors',
            value === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
