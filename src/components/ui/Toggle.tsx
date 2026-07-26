import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Label rendered inside the pill, next to the knob. */
  label: string
  /** Fixed pill width so every toggle in a column lines up. Defaults to 104px. */
  width?: number
  disabled?: boolean
}

/**
 * A labeled pill-shaped switch — e.g. the "Active / Inactive" status control
 * on the Users table. Unlike a plain switch, the state label lives inside
 * the pill itself rather than next to it.
 */
export function Toggle({ checked, onChange, label, width = 104, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ width }}
      className={cn(
        'inline-flex items-center justify-between rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-success-500 text-white' : 'bg-neutral-200 text-neutral-600'
      )}
    >
      <span>{label}</span>
      <span className="size-4 shrink-0 rounded-full bg-white" />
    </button>
  )
}