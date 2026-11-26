/**
 * CAB Audit Reporting — domain rules & mock API.
 * All values are illustrative design examples (no regulatory tables).
 * Tenant rule: same org / site / contact / document IDs within each
 * CAB-client relationship; never cross-tenant sharing.
 */

export interface TenantScope {
  cabId: string
  clientCode: string
  organizationId: string
  siteId: string
  contactId: string
  documentIds: string[]
}

export const DEMO_SCOPE: TenantScope = {
  cabId: 'CAB-010',
  clientCode: 'CL-0001',
  organizationId: 'ORG-001 · Al Noor Food Industries',
  siteId: 'SITE-001 · Riyadh (Main)',
  contactId: 'CTC-011 · Sara Ali — Client contact',
  documentIds: ['DOC-101 HACCP plan', 'DOC-102 Temp records Mar'],
}

/** Stable field keys — must stay stable across CAB + portal. */
export const FIELD_KEYS = {
  findingType: 'finding.type',
  classification: 'finding.classification',
  requirementRef: 'finding.requirementRef',
  evidenceLink: 'finding.evidenceLink',
  statement: 'finding.statement',
  objectiveEvidence: 'finding.objectiveEvidence',
  dueDate: 'finding.dueDate',
  process: 'finding.process',
  contact: 'finding.responsibleContact',
} as const

export interface SchemeClassificationOption {
  value: string
  label: string
  dueRule: string
}

/**
 * Classification + due dates come from configured scheme rules.
 * No universal major/minor deadline is applied automatically.
 */
export const SCHEME_RULES = {
  scheme: 'FSMS Scheme (configured)',
  version: 'Scheme rules v3.2',
  classifications: [
    { value: 'critical', label: 'Critical — per scheme rules', dueRule: 'Due per scheme rules (configured)' },
    { value: 'major', label: 'Major — per scheme rules', dueRule: 'Due per scheme rules (configured)' },
    { value: 'minor', label: 'Minor — per scheme rules', dueRule: 'Due per scheme rules (configured)' },
    { value: 'observation', label: 'Observation — per scheme rules', dueRule: 'Due per scheme rules (configured)' },
  ] as SchemeClassificationOption[],
  note: 'Classification and due dates follow the configured scheme rules for this audit. No universal major/minor deadline applies.',
}

export interface SubmissionGate {
  id: string
  label: string
  hint: string
  passed: boolean
}

/** Stable codes for the submission gates, so every surface can translate the same failure. */
export type FindingSubmitErrorCode = 'findingType' | 'classification' | 'requirementRef' | 'statement' | 'evidence'

export function validateFindingForSubmit(input: {
  findingType: string
  classification: string
  requirementRef: string
  evidenceText: string
  evidenceLinks: string[]
  statement: string
}): { ok: boolean; errors: FindingSubmitErrorCode[] } {
  const errors: FindingSubmitErrorCode[] = []
  if (!input.findingType) errors.push('findingType')
  if (!input.classification) errors.push('classification')
  if (!input.requirementRef.trim()) errors.push('requirementRef')
  if (!input.statement.trim()) errors.push('statement')
  if (!input.evidenceText.trim() && input.evidenceLinks.length === 0) errors.push('evidence')
  return { ok: errors.length === 0, errors }
}

export function buildReportGates(ctx: {
  evidenceLinked: number
  findingsClassified: number
  findingsTotal: number
  recommendation: string
  frozen: boolean
}): SubmissionGate[] {
  return [
    {
      id: 'evidence',
      label: 'Evidence linked to audit + requirement',
      hint: `${ctx.evidenceLinked} task(s) linked · generic claims blocked`,
      passed: ctx.evidenceLinked > 0,
    },
    {
      id: 'classification',
      label: 'Findings classified per scheme rules',
      hint: `${ctx.findingsClassified}/${ctx.findingsTotal} classified · ${SCHEME_RULES.version}`,
      passed: ctx.findingsTotal > 0 && ctx.findingsClassified === ctx.findingsTotal,
    },
    {
      id: 'recommendation',
      label: 'Auditor recommendation recorded',
      hint: 'Recommendation ≠ certification decision',
      passed: ctx.recommendation.trim().length > 10,
    },
    {
      id: 'review',
      label: 'Technical review handoff ready',
      hint: ctx.frozen ? 'Version frozen · ready for separate handoff' : 'Finalize freezes version first',
      passed: ctx.frozen,
    },
  ]
}

export function toCsv(rows: Array<Record<string, string>>, headers: string[]): string {
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h] ?? '')).join(','))].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Raised findings, stored locally (same local data layer as audit plans).
 * A Submitted finding raised from the conduct step carries its audit and
 * checklist item binding; a Draft keeps the entered fields but is not
 * attached to the item, so it never clears the NC-without-finding blocker.
 */
export interface FindingRecord {
  id: string
  /** Owning CAB organization — records are never listed across accounts. */
  cabId: string | null
  findingCode: string | null
  status: 'Draft' | 'Submitted'
  planId: string | null
  planNumber: string | null
  checklistItemId: string | null
  clauseRef: string | null
  findingType: string
  classification: string
  requirementRef: string
  evidenceText: string
  evidenceLinks: string[]
  statement: string
  dueDate: string
  process: string
  contact: string
  comments: string
  createdAt: string
}

const FINDINGS_STORAGE_KEY = 'icasco_cab_findings_v1'

/** The signed-in CAB organization; null when no session is available. */
export function currentFindingsOwner(): string | null {
  try {
    const raw =
      localStorage.getItem('icasco_auth_session') ?? sessionStorage.getItem('icasco_auth_session')
    if (!raw) return null
    const session = JSON.parse(raw) as {
      cab?: { id?: string }
      organization?: { id?: string }
      user?: { id?: string }
    }
    return session?.cab?.id ?? session?.organization?.id ?? session?.user?.id ?? null
  } catch {
    return null
  }
}

function readAllFindingRecords(): FindingRecord[] {
  try {
    const raw = localStorage.getItem(FINDINGS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FindingRecord[]) : []
  } catch {
    return []
  }
}

/** Findings of the current CAB only — never another organization's records. */
export function listFindingRecords(): FindingRecord[] {
  const owner = currentFindingsOwner()
  if (!owner) return []
  return readAllFindingRecords().filter((r) => r.cabId === owner)
}

export async function saveFindingRecord(
  record: Omit<FindingRecord, 'cabId'> & { cabId?: string | null },
): Promise<FindingRecord> {
  const stamped: FindingRecord = { ...record, cabId: record.cabId ?? currentFindingsOwner() }
  const all = readAllFindingRecords()
  const index = all.findIndex((r) => r.id === stamped.id)
  if (index >= 0) all[index] = stamped
  else all.push(stamped)
  localStorage.setItem(FINDINGS_STORAGE_KEY, JSON.stringify(all))
  return stamped
}
