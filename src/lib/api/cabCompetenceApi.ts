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

export const INITIAL_PERSONNEL: CompetencePerson[] = [
  {
    id: 'per-1',
    code: 'PER-0001',
    name: 'Alex Morgan',
    role: 'Auditor',
    country: 'Saudi Arabia',
    schemes: ['ISO 9001'],
    authorizedScope: 'Quality management systems',
    expiryDate: '2026-05-14',
    status: 'Under review',
    email: 'alex.morgan@example.com',
    phone: '+966 50 123 4567',
    statusDot: 'Active',
    evaluation: {
      scheme: 'ISO 9001',
      proposedSector: 'Food Manufacturing',
      evaluationDate: '2025-04-25',
      evaluator: 'Sara Ali',
      overallResult: 'Competent',
      comments: 'Meets competence requirements for ISO 9001 in the proposed sector based on training, experience and witnessed audits.',
      highestQualification: "Bachelor's Degree",
      fieldOfStudy: 'Industrial Engineering',
      relevantExperienceYears: 8,
      sectorExperienceYears: 5,
      additionalNotes: 'Extensive experience in food manufacturing environments, including HACCP and regulatory requirements.',
      status: 'In progress',
      lastSaved: '25 Apr 2025, 10:24',
    },
    trainings: [
      { id: 'tr-1', date: '12 Jan 2023', course: 'ISO 9001:2015 Auditor Training', provider: 'QualityLearn', result: 'Completed' },
      { id: 'tr-2', date: '18 Mar 2024', course: 'Food Safety Management (HACCP)', provider: 'SafeFood Institute', result: 'Completed' },
      { id: 'tr-3', date: '10 Oct 2024', course: 'Audit Techniques Refresher', provider: 'QualityLearn', result: 'Completed' },
    ],
    auditLogs: [
      { id: 'al-1', date: '14 Feb 2024', client: 'Al Noor Food Industries', clientCode: 'CL-0001', activity: 'Stage 1 Audit', role: 'Auditor', result: 'Satisfactory' },
      { id: 'al-2', date: '20 Feb 2024', client: 'Al Noor Food Industries', clientCode: 'CL-0001', activity: 'Stage 2 Audit', role: 'Auditor', result: 'Satisfactory' },
      { id: 'al-3', date: '12 Nov 2024', client: 'Green Fields Co.', clientCode: 'CL-0003', activity: 'Surveillance Audit', role: 'Auditor', result: 'Satisfactory' },
    ],
    witnessings: [
      { id: 'wit-1', date: '20 Feb 2024', client: 'Al Noor Food Industries', clientCode: 'CL-0001', auditType: 'Stage 2 Audit', witnessedBy: 'Dr. Layla Hassan', outcome: 'Positive' },
    ],
    restrictions: [],
  },
  {
    id: 'per-2',
    code: 'PER-0002',
    name: 'Sara Khan',
    role: 'Lead Auditor',
    country: 'United Arab Emirates',
    schemes: ['ISO 14001'],
    authorizedScope: 'Environmental management systems',
    expiryDate: '2025-11-30',
    status: 'Authorized',
    email: 'sara.khan@example.com',
    phone: '+971 50 987 6543',
    statusDot: 'Active',
    evaluation: {
      scheme: 'ISO 14001',
      proposedSector: 'Environmental Services',
      evaluationDate: '2024-11-15',
      evaluator: 'Sara Ali',
      overallResult: 'Competent',
      comments: 'Fully certified and audited extensive facilities.',
      highestQualification: "Master's Degree",
      fieldOfStudy: 'Environmental Science',
      relevantExperienceYears: 10,
      sectorExperienceYears: 7,
      additionalNotes: 'Lead Auditor certified with exemplary compliance record.',
      status: 'Authorized',
      lastSaved: '15 Nov 2024, 14:00',
    },
    trainings: [
      { id: 'tr-4', date: '05 May 2022', course: 'ISO 14001 Lead Auditor Course', provider: 'IRCA Certified', result: 'Completed' },
    ],
    auditLogs: [],
    witnessings: [],
    restrictions: [],
  },
  {
    id: 'per-3',
    code: 'PER-0003',
    name: 'Omar Hussain',
    role: 'Technical Expert',
    country: 'Saudi Arabia',
    schemes: ['ISO 45001'],
    authorizedScope: 'Occupational health and safety management systems',
    expiryDate: '2026-02-20',
    status: 'Authorized',
    email: 'omar.hussain@example.com',
    phone: '+966 55 456 7890',
    statusDot: 'Active',
    trainings: [],
    auditLogs: [],
    witnessings: [],
    restrictions: [],
  },
  {
    id: 'per-4',
    code: 'PER-0004',
    name: 'Lina Faisal',
    role: 'Auditor',
    country: 'Jordan',
    schemes: ['ISO 22000'],
    authorizedScope: 'Food safety management systems',
    expiryDate: '2025-08-18',
    status: 'Authorized',
    email: 'lina.faisal@example.com',
    phone: '+962 79 123 4567',
    statusDot: 'Active',
    trainings: [],
    auditLogs: [],
    witnessings: [],
    restrictions: [],
  },
  {
    id: 'per-5',
    code: 'PER-0005',
    name: 'Khalid Al Saud',
    role: 'Auditor',
    country: 'Saudi Arabia',
    schemes: ['ISO 27001'],
    authorizedScope: 'Information security management systems',
    expiryDate: '2026-07-10',
    status: 'Pending',
    email: 'khalid.alsaud@example.com',
    phone: '+966 54 321 0987',
    statusDot: 'Active',
    trainings: [],
    auditLogs: [],
    witnessings: [],
    restrictions: [],
  },
  {
    id: 'per-6',
    code: 'PER-0006',
    name: 'Fatima Al Zahra',
    role: 'Technical Expert',
    country: 'Egypt',
    schemes: ['HACCP'],
    authorizedScope: 'Food safety (HACCP)',
    expiryDate: '2025-12-05',
    status: 'Authorized',
    email: 'fatima.zahra@example.com',
    phone: '+20 100 123 4567',
    statusDot: 'Active',
    trainings: [],
    auditLogs: [],
    witnessings: [],
    restrictions: [],
  },
]

export function getStoredPersonnel(): CompetencePerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Ignore JSON parse errors
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PERSONNEL))
  return INITIAL_PERSONNEL
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
