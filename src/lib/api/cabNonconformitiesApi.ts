/**
 * CAB Nonconformities — corrective action register domain rules & mock API.
 * All values are illustrative design examples (no regulatory tables).
 *
 * Classification values intentionally mirror `SCHEME_RULES.classifications`
 * in `cabAuditReportingApi` so a finding raised in the audit workspace and the
 * nonconformity it becomes here stay on the same vocabulary.
 */

export type NonconformityClassification = 'critical' | 'major' | 'minor' | 'observation'

export type NonconformityStatus = 'open' | 'in_progress' | 'submitted' | 'closed' | 'overdue'

export type CorrectiveActionStage = 'correction' | 'root_cause' | 'corrective_action' | 'verification'

export type CorrectiveActionStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface CorrectiveAction {
  id: string
  stage: CorrectiveActionStage
  stageLabel: string
  description: string
  ownerName: string
  dueDate: string
  status: CorrectiveActionStatus
  statusLabel: string
}

export interface NonconformityAttachment {
  id: string
  name: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
}

export interface NonconformityHistoryEntry {
  id: string
  text: string
  by: string
  at: string
}

export interface NonconformityItem {
  id: string
  ncId: string
  findingId: string
  auditId: string
  clientName: string
  clientId: string
  country: string
  classification: NonconformityClassification
  classificationLabel: string
  description: string
  raisedDate: string
  raisedDateRaw: string
  dueDate: string
  dueDateRaw: string
  overdue: boolean
  ownerName: string
  status: NonconformityStatus
  statusLabel: string
  primaryContactName: string
  primaryContactEmail: string
  actions: CorrectiveAction[]
  attachments: NonconformityAttachment[]
  history: NonconformityHistoryEntry[]
}

export interface NonconformityFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
}

/** Stable field keys shared by CAB + client portal. Do not rename without migration. */
export const NONCONFORMITY_FIELD_KEYS = {
  classification: 'nonconformity.classification',
  description: 'nonconformity.description',
  dueDate: 'nonconformity.dueDate',
  owner: 'nonconformity.owner',
  status: 'nonconformity.status',
} as const

export const NONCONFORMITY_CLASSIFICATIONS: NonconformityClassification[] = [
  'critical',
  'major',
  'minor',
  'observation',
]

export const NONCONFORMITY_STATUSES: NonconformityStatus[] = [
  'open',
  'in_progress',
  'submitted',
  'closed',
  'overdue',
]

const MOCK_REGISTER: NonconformityItem[] = [
  {
    id: 'nc-0024',
    ncId: 'NC-0024',
    findingId: 'AUD-0024',
    auditId: 'AUD-0024',
    clientName: 'Al Noor Food Industries',
    clientId: 'CL-0001',
    country: 'Saudi Arabia',
    classification: 'minor',
    classificationLabel: 'Minor',
    description: 'Incomplete temperature monitoring records in the production area.',
    raisedDate: '12 Mar 2024',
    raisedDateRaw: '2024-03-12',
    dueDate: '30 Apr 2024',
    dueDateRaw: '2024-04-30',
    overdue: true,
    ownerName: 'Omar Hassan',
    status: 'open',
    statusLabel: 'Open',
    primaryContactName: 'Sara Ali',
    primaryContactEmail: 'sara@alnoor.example',
    actions: [
      {
        id: 'ca-0024-1',
        stage: 'correction',
        stageLabel: 'Correction',
        description: 'Reconstruct missing temperature logs for the affected period.',
        ownerName: 'Omar Hassan',
        dueDate: '05 Apr 2024',
        status: 'submitted',
        statusLabel: 'Submitted',
      },
      {
        id: 'ca-0024-2',
        stage: 'root_cause',
        stageLabel: 'Root cause analysis',
        description: 'Identify why the monitoring schedule was not followed on night shifts.',
        ownerName: 'Omar Hassan',
        dueDate: '18 Apr 2024',
        status: 'pending',
        statusLabel: 'Pending',
      },
      {
        id: 'ca-0024-3',
        stage: 'corrective_action',
        stageLabel: 'Corrective action',
        description: 'Introduce an automated logging checkpoint with supervisor sign-off.',
        ownerName: 'Omar Hassan',
        dueDate: '30 Apr 2024',
        status: 'pending',
        statusLabel: 'Pending',
      },
    ],
    attachments: [
      {
        id: 'att-0024-1',
        name: 'Temperature logs — March 2024.pdf',
        sizeLabel: '1.2 MB',
        uploadedBy: 'Sara Ali',
        uploadedAt: '02 Apr 2024',
      },
      {
        id: 'att-0024-2',
        name: 'Corrective action plan v1.docx',
        sizeLabel: '340 KB',
        uploadedBy: 'Omar Hassan',
        uploadedAt: '05 Apr 2024',
      },
    ],
    history: [
      { id: 'h-0024-1', text: 'Nonconformity raised from finding AUD-0024', by: 'Audit team', at: '12 Mar 2024, 10:30' },
      { id: 'h-0024-2', text: 'Assigned to client owner', by: 'System', at: '12 Mar 2024, 10:31' },
      { id: 'h-0024-3', text: 'Correction evidence submitted', by: 'Sara Ali', at: '05 Apr 2024, 09:14' },
    ],
  },
  {
    id: 'nc-0025',
    ncId: 'NC-0025',
    findingId: 'AUD-0031',
    auditId: 'AUD-0031',
    clientName: 'GreenLeaf Pvt. Ltd.',
    clientId: 'CLT-2025-0148',
    country: 'United Arab Emirates',
    classification: 'major',
    classificationLabel: 'Major',
    description: 'Training records incomplete for staff performing critical control point checks.',
    raisedDate: '02 Apr 2024',
    raisedDateRaw: '2024-04-02',
    dueDate: '02 Jun 2024',
    dueDateRaw: '2024-06-02',
    overdue: false,
    ownerName: 'Layla Mansour',
    status: 'in_progress',
    statusLabel: 'In progress',
    primaryContactName: 'Hessa Al Marri',
    primaryContactEmail: 'hessa@greenleaf.example',
    actions: [
      {
        id: 'ca-0025-1',
        stage: 'correction',
        stageLabel: 'Correction',
        description: 'Complete and file outstanding training records for all CCP operators.',
        ownerName: 'Layla Mansour',
        dueDate: '20 Apr 2024',
        status: 'accepted',
        statusLabel: 'Accepted',
      },
      {
        id: 'ca-0025-2',
        stage: 'root_cause',
        stageLabel: 'Root cause analysis',
        description: 'Review the competence matrix update process for new hires.',
        ownerName: 'Layla Mansour',
        dueDate: '10 May 2024',
        status: 'submitted',
        statusLabel: 'Submitted',
      },
    ],
    attachments: [
      {
        id: 'att-0025-1',
        name: 'Competence matrix 2024.xlsx',
        sizeLabel: '820 KB',
        uploadedBy: 'Hessa Al Marri',
        uploadedAt: '19 Apr 2024',
      },
    ],
    history: [
      { id: 'h-0025-1', text: 'Nonconformity raised from finding AUD-0031', by: 'Audit team', at: '02 Apr 2024, 14:05' },
      { id: 'h-0025-2', text: 'Correction accepted by reviewer', by: 'Mohammed Khan', at: '22 Apr 2024, 11:40' },
    ],
  },
  {
    id: 'nc-0026',
    ncId: 'NC-0026',
    findingId: 'AUD-0019',
    auditId: 'AUD-0019',
    clientName: 'Apex Health Systems',
    clientId: 'CL-0019',
    country: 'Egypt',
    classification: 'observation',
    classificationLabel: 'Observation',
    description: 'Calibration labels on two measuring devices were not clearly legible.',
    raisedDate: '20 Jan 2024',
    raisedDateRaw: '2024-01-20',
    dueDate: '20 Feb 2024',
    dueDateRaw: '2024-02-20',
    overdue: false,
    ownerName: 'Nadia Fouad',
    status: 'closed',
    statusLabel: 'Closed',
    primaryContactName: 'Kareem Adel',
    primaryContactEmail: 'kareem@apexhealth.example',
    actions: [
      {
        id: 'ca-0026-1',
        stage: 'correction',
        stageLabel: 'Correction',
        description: 'Reprint and reapply calibration labels on the affected devices.',
        ownerName: 'Nadia Fouad',
        dueDate: '05 Feb 2024',
        status: 'accepted',
        statusLabel: 'Accepted',
      },
      {
        id: 'ca-0026-2',
        stage: 'verification',
        stageLabel: 'Verification',
        description: 'Verified during the follow-up visit; labels legible and in date.',
        ownerName: 'Mohammed Khan',
        dueDate: '18 Feb 2024',
        status: 'accepted',
        statusLabel: 'Accepted',
      },
    ],
    attachments: [],
    history: [
      { id: 'h-0026-1', text: 'Nonconformity raised from finding AUD-0019', by: 'Audit team', at: '20 Jan 2024, 09:00' },
      { id: 'h-0026-2', text: 'Closed after verification', by: 'Mohammed Khan', at: '18 Feb 2024, 16:20' },
    ],
  },
]

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export async function getNonconformities(
  params?: NonconformityFilterParams,
): Promise<NonconformityItem[]> {
  await wait()
  let list = clone(MOCK_REGISTER)

  if (params?.searchQuery) {
    const query = params.searchQuery.toLowerCase().trim()
    list = list.filter((item) =>
      [item.ncId, item.findingId, item.clientName, item.clientId].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }
  if (params?.country && params.country !== 'all') {
    list = list.filter((item) => item.country === params.country)
  }
  if (params?.status && params.status !== 'all') {
    list = list.filter((item) => item.status === params.status)
  }
  if (params?.startDate) {
    list = list.filter((item) => item.raisedDateRaw >= params.startDate!)
  }
  if (params?.endDate) {
    list = list.filter((item) => item.raisedDateRaw <= params.endDate!)
  }

  return list
}

export async function getNonconformityById(id: string): Promise<NonconformityItem | null> {
  await wait()
  const match = MOCK_REGISTER.find(
    (item) => item.id === id || item.ncId.toLowerCase() === id.toLowerCase(),
  )
  return match ? clone(match) : null
}

/** Countries present in the register — keeps the filter aligned with the data. */
export function getNonconformityCountries(): string[] {
  return Array.from(new Set(MOCK_REGISTER.map((item) => item.country)))
}