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

export function validateFindingForSubmit(input: {
  findingType: string
  classification: string
  requirementRef: string
  evidenceText: string
  evidenceLinks: string[]
  statement: string
}): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!input.findingType) errors.push('Finding type is required on submission.')
  if (!input.classification) errors.push('Classification (scheme rules) is required on submission.')
  if (!input.requirementRef.trim()) errors.push('Requirement reference is required on submission.')
  if (!input.statement.trim()) errors.push('Finding statement is required on submission.')
  if (!input.evidenceText.trim() && input.evidenceLinks.length === 0)
    errors.push('Objective evidence linked to the audit and requirement is required — generic claims are not accepted.')
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
