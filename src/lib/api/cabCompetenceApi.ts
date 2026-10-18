export const PERSONNEL_QUALIFICATION_OPTIONS = [
  { value: "Bachelor's Degree", key: 'bachelor' },
  { value: "Master's Degree", key: 'master' },
  { value: 'Doctorate / PhD', key: 'doctorate' },
  { value: 'Diploma', key: 'diploma' },
] as const

export interface CompetencePerson {
  id: string
  code: string
  name: string
  role: 'Auditor' | 'Lead Auditor' | 'Technical Expert' | 'Decision Maker' | 'Reviewer'
  country: string
  schemes: string[]
  authorizedScope: string
  expiryDate: string
  status: 'Authorized' | 'Under review' | 'Pending' | 'Expired' | 'Suspended'
  avatarUrl?: string
  employmentStartDate?: string
  employmentEndDate?: string
  iafCodes?: string[]
  qualifications?: string
  email: string
  phone: string
  statusDot: 'Active' | 'Inactive' | 'Suspended'
  // Evaluation data
  evaluation?: {
    scheme: string
    proposedSector: string
    evaluationDate: string
    evaluator: string
    overallResult: 'Competent' | 'Not Yet Competent' | 'Requires Training'
    comments: string
    highestQualification: string
    fieldOfStudy: string
    relevantExperienceYears: number
    sectorExperienceYears: number
    additionalNotes: string
    status: 'In progress' | 'Submitted' | 'Authorized' | 'Rejected'
    lastSaved: string
  }
  trainings?: Array<{
    id: string
    date: string
    course: string
    provider: string
    result: 'Completed' | 'Pending' | 'Failed'
  }>
  auditLogs?: Array<{
    id: string
    date: string
    client: string
    clientCode: string
    activity: string
    role: string
    result: 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory'
  }>
  witnessings?: Array<{
    id: string
    date: string
    client: string
    clientCode: string
    auditType: string
    witnessedBy: string
    outcome: 'Positive' | 'Conditional' | 'Negative'
  }>
  restrictions?: Array<{
    id: string
    type: string
    details: string
    expiry?: string
  }>
}

const STORAGE_KEY = 'icasco_cab_competence_personnel_v1'

export const INITIAL_PERSONNEL: CompetencePerson[] = []

const MOCK_IDS = new Set(['per-1', 'per-2', 'per-3', 'per-4', 'per-5', 'per-6'])

export function getStoredPersonnel(): CompetencePerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const dynamicOnly = parsed.filter((p) => p && !MOCK_IDS.has(p.id))
        if (dynamicOnly.length !== parsed.length) {
          savePersonnelList(dynamicOnly)
        }
        return dynamicOnly
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return []
}

export function savePersonnelList(list: CompetencePerson[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getPersonById(idOrCode: string): CompetencePerson | undefined {
  const list = getStoredPersonnel()
  return list.find((p) => p.id === idOrCode || p.code === idOrCode)
}

export function savePersonEvaluation(idOrCode: string, updated: Partial<CompetencePerson>): CompetencePerson | undefined {
  const list = getStoredPersonnel()
  const idx = list.findIndex((p) => p.id === idOrCode || p.code === idOrCode)
  if (idx === -1) return undefined
  const merged: CompetencePerson = {
    ...list[idx],
    ...updated,
    evaluation: {
      ...list[idx].evaluation,
      ...(updated.evaluation || {}),
      lastSaved: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    } as any,
  }
  list[idx] = merged
  savePersonnelList(list)
  return merged
}
