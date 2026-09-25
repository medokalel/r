import { cn } from '@/lib/utils'

export const CARD = 'rounded-[12px] border border-[#e2e2e2] bg-white'
export const INPUT =
  'h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3] disabled:bg-neutral-50'
export const PRIMARY_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#0e2a80] disabled:opacity-50'
export const GHOST_BTN =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50'

export type TabId = 'agenda' | 'evidence' | 'findings' | 'report'
export type PageState = 'ready' | 'loading' | 'error' | 'denied'

export interface EvidenceTask {
  id: string
  description: string
  auditRef: string
  requirementRef: string
  dueDate: string
  status: 'Open' | 'Submitted' | 'Verified' | 'Closed'
  selected: boolean
}

export interface Finding {
  id: string
  type: string
  requirementRef: string
  classification: string
  statement: string
  linkedEvidence: string[]
  status: 'Draft' | 'Submitted'
  dueDate: string
}

export const SCOPE = {
  org: 'ORG-001 · Al Noor Food Industries',
  site: 'SITE-001 · Riyadh (Main)',
  contact: 'CTC-011 · Sara Ali — Client contact',
  docs: 'DOC-101 HACCP plan · DOC-102 Temp records Mar',
}

export const SEED_EVIDENCE: EvidenceTask[] = [
  { id: 'EV-0101', description: 'Provide documented HACCP plan', auditRef: 'AUD-0024 · HACCP', requirementRef: 'Clause 8.5', dueDate: '2025-03-12', status: 'Open', selected: false },
  { id: 'EV-0102', description: 'Latest internal audit report', auditRef: 'AUD-0024 · Internal audit', requirementRef: 'Clause 9.2', dueDate: '2025-03-12', status: 'Submitted', selected: false },
  { id: 'EV-0103', description: 'Calibration records (last 12 months)', auditRef: 'AUD-0024 · Monitoring', requirementRef: 'Clause 7.1.5', dueDate: '2025-03-13', status: 'Open', selected: false },
  { id: 'EV-0104', description: 'Allergen control procedure', auditRef: 'AUD-0024 · Operational control', requirementRef: 'Clause 8.2', dueDate: '2025-03-13', status: 'Verified', selected: false },
]

export const SEED_FINDINGS: Finding[] = [
  { id: 'NC-0024', type: 'Nonconformity', requirementRef: 'ISO 9001:2015, Clause 8.5.1', classification: '', statement: 'Storage-area temperature records for March are incomplete (1–10 March only).', linkedEvidence: ['EV-0103'], status: 'Draft', dueDate: '2025-04-12' },
  { id: 'OBS-0011', type: 'Observation', requirementRef: 'ISO 9001:2015, Clause 7.2', classification: 'Observation — per scheme rules', statement: 'Training matrix does not list two new operators.', linkedEvidence: ['EV-0102'], status: 'Submitted', dueDate: '2025-04-20' },
]

export function ScopeBanner({ title }: { title: string }) {
  return (
    <section className={cn(CARD, 'border-[#1236a3]/20 bg-[#f3f6fd] p-4')} aria-label="Tenant scope">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
        <span className="rounded-[6px] bg-[#1236a3] px-2 py-0.5 font-bold text-white">{title}</span>
        <span className="font-medium text-neutral-700">Org: {SCOPE.org}</span>
        <span className="font-medium text-neutral-700">Site: {SCOPE.site}</span>
        <span className="font-medium text-neutral-700">Contact: {SCOPE.contact}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-500">Docs: {SCOPE.docs}. IDs stable within this CAB-client relationship. No cross-tenant sharing.</p>
    </section>
  )
}

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
