export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type RequestPriority = 'high' | 'medium' | 'low'
export type RequestStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface InformationRequestItem {
  id: number
  description: string
  referenceStandard: string
  referenceClause: string
  requestedBy: { name: string; initials: string; role: string }
  requestedOnDate: string
  requestedOnTime: string
  dueDate: string
  priority: RequestPriority
  status: RequestStatus
}

export interface CabApplicationInformationRequired {
  applicationId: string
  status: 'inProgress'
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  requestedOnDate: string
  requestedOnTime: string
  requestedBy: { name: string; initials: string; role: string }
  documentCount: number
  deadlineDate: string
  deadlineNote: string
  requests: InformationRequestItem[]
  internalComments: Array<{ author: string; initials: string; role: string; date: string; time: string; text: string }>
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK: CabApplicationInformationRequired = {
  applicationId: 'APP-2025-0086',
  status: 'inProgress',
  client: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  primaryStandard: 'ISO 9001:2015',
  requestedOnDate: 'May 19, 2025',
  requestedOnTime: '04:15 PM (IST)',
  requestedBy: { name: 'Neha Sharma', initials: 'NP', role: 'Lead Auditor' },
  documentCount: 7,
  deadlineDate: 'May 26, 2025',
  deadlineNote:
    'The client has been notified via email. Please ensure all requested information is received before the due date to avoid delays in the certification process.',
  requests: [
    {
      id: 1,
      description: 'Updated organizational chart reflecting current structure',
      referenceStandard: 'ISO 9001:2015',
      referenceClause: '4.4',
      requestedBy: { name: 'Neha Sharma', initials: 'NP', role: 'Lead Auditor' },
      requestedOnDate: 'May 19, 2025',
      requestedOnTime: '02:35 PM',
      dueDate: 'May 26, 2025',
      priority: 'high',
      status: 'pending',
    },
    {
      id: 2,
      description: "Clarification on scope exclusion for 'Research & Development'",
      referenceStandard: 'ISO 9001:2015',
      referenceClause: '8.3',
      requestedBy: { name: 'Neha Sharma', initials: 'NP', role: 'Lead Auditor' },
      requestedOnDate: 'May 19, 2025',
      requestedOnTime: '02:35 PM',
      dueDate: 'May 26, 2025',
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 3,
      description: 'Evidence of management review meeting minutes (last 6 months)',
      referenceStandard: 'ISO 9001:2015',
      referenceClause: '9.3',
      requestedBy: { name: 'Neha Sharma', initials: 'NP', role: 'Lead Auditor' },
      requestedOnDate: 'May 19, 2025',
      requestedOnTime: '02:35 PM',
      dueDate: 'May 26, 2025',
      priority: 'high',
      status: 'pending',
    },
    {
      id: 4,
      description: 'Internal audit schedule for the current year',
      referenceStandard: 'ISO 9001:2015',
      referenceClause: '9.2',
      requestedBy: { name: 'Arjun Verma', initials: 'AV', role: 'Lead Auditor' },
      requestedOnDate: 'May 20, 2025',
      requestedOnTime: '11:10 AM',
      dueDate: 'May 27, 2025',
      priority: 'medium',
      status: 'pending',
    },
  ],
  internalComments: [
    {
      author: 'Neha Sharma',
      initials: 'NP',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '02:38 PM',
      text: 'Please request the client to provide the above information at the earliest to avoid delays in the review process.',
    },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'completed' },
    { key: 'informationRequired', status: 'inProgress' },
    { key: 'technicalFeasibility', status: 'pending' },
    { key: 'quotation', status: 'pending' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
  ],
}

export async function getCabApplicationInformationRequired(
  _applicationId?: string
): Promise<CabApplicationInformationRequired> {
  await delay()
  return MOCK
}
