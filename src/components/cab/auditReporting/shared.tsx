
export const CARD = 'rounded-[12px] border border-[#e2e2e2] bg-white'
export const INPUT =
  'h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3] disabled:bg-neutral-50'
export const PRIMARY_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#0e2a80] disabled:opacity-50'
export const GHOST_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50'

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 start-1/2 z-[999] -translate-x-1/2 rtl:translate-x-1/2" role="status" aria-live="polite">
      <div className="flex max-w-[min(92vw,560px)] items-center gap-2.5 rounded-[12px] bg-[#0a1f29] px-5 py-3 text-white shadow-xl">
        <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-500 text-[12px] font-bold">✓</span>
        <span className="text-[13px] font-semibold">{message}</span>
      </div>
    </div>
  )
}
