interface MigrationProgressRingProps {
  /** 0-100 */
  value: number
  label: string
  size?: number
}

/** Circular progress with the percentage in the middle; there is no shared one in the UI kit yet. */
export function MigrationProgressRing({ value, label, size = 88 }: MigrationProgressRingProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-[#e8edfc]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[18px] font-bold text-neutral-900" dir="ltr">
        {percent}%
      </span>
    </div>
  )
}