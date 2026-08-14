import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Label rendered inside the pill, next to the knob. Omit for a compact, text-free switch. */
  label?: string
  /** Accessible name when there's no visible label. */
  'aria-label'?: string
  /** Fixed pill width so every toggle in a column lines up. Defaults to 104px (36px for 'sm'). */
  width?: number
  /** 'sm' is a compact, icon-only switch (no room/need for a text label) — e.g. a mobile card. */
  size?: 'default' | 'sm'
  disabled?: boolean
}

/**
 * A pill-shaped switch — e.g. the "Active / Inactive" status control on the
 * Users table. The knob slides from the start edge (checked) to the end
 * edge (unchecked), animating smoothly between states. Pass `label` for the
 * labeled pill (desktop table); omit it (optionally with `size="sm"`) for a
 * compact, icon-only switch that fits tighter spaces like a mobile card.
 */
export function Toggle({
  checked,
  onChange,
  label,
  width,
  size = 'default',
  disabled,
  ...rest
}: ToggleProps) {
  const isSmall = size === 'sm'
  const pillWidth = width ?? (isSmall ? 36 : 104)
  const pillHeight = isSmall ? 20 : 32
  const knobSize = isSmall ? 14 : 20
  const inset = isSmall ? 3 : 4
  const travel = pillWidth - knobSize - inset * 2

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label'] ?? label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ width: pillWidth, height: pillHeight }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full text-[13px] font-medium transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-600'
      )}
    >
      <span
        className="absolute top-1/2 rounded-full transition-colors duration-200"
        style={{
          left: inset,
          width: knobSize,
          height: knobSize,
          backgroundColor: checked ? '#fff' : 'var(--color-neutral-400, #a3a3a3)',
          transform: `translateY(-50%) translateX(${checked ? 0 : travel}px)`,
          transition: 'transform 200ms ease, background-color 200ms ease',
        }}
      />
      {label && <span>{label}</span>}
    </button>
  )
}