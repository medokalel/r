interface CompletenessBarProps {
  /** 0-100 */
  value: number
  label: string
}

/** Thin progress bar with the percentage next to it, used for how complete a record is. */
export function CompletenessBar({ value, label }: CompletenessBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-[#ececec]"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-9 text-[12px] font-medium text-neutral-600" dir="ltr">
        {percent}%
      </span>
    </div>
  )
}