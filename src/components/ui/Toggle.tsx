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
 * on the Users table. The knob slides from the start edge (checked/Active)
 * to the end edge (unchecked/Inactive), animating smoothly between states.
 */
export function Toggle({ checked, onChange, label, width = 104, disabled }: ToggleProps) {
  const knobSize = 20
  const inset = 4
  const travel = width - knobSize - inset * 2

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ width }}
      className={cn(
        'relative inline-flex h-8 items-center justify-center rounded-full text-[13px] font-medium transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-600'
      )}
    >
      <span
        className={cn(
          'absolute left-1 top-1/2 size-5 rounded-full transition-colors duration-200',
          checked ? 'bg-white' : 'bg-neutral-400'
        )}
        style={{
          transform: `translateY(-50%) translateX(${checked ? 0 : travel}px)`,
          transition: 'transform 200ms ease, background-color 200ms ease',
        }}
      />
      <span>{label}</span>
    </button>
  )
}