export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'

export interface CabApplicationReceipt {
  applicationId: string
  status: 'received'
  clientName: string
  applicationType: string
  certificationBody: string
  receivedBy: string
  receivedByInitials: string
  receivedOnDate: string
  receivedOnTime: string
  receivedOn: string
  primaryStandards: string[]
  requestedCertificationDate: string
  accreditationBody: string
  numberOfSites: number
  auditLanguage: string
  applicationDate: string
  applicationReceivedDate: string
  referenceNo: string
  client: {
    name: string
    logoUrl?: string
    clientId: string
    organizationType: string
    country: string
    countryCode: string
    legalEntityName: string
    registrationLicenseNo: string
    industry: string
  }
  scopeSummary: string
  nextSteps: Array<{
    key: string
    status: WorkflowStepStatus
  }>
  workflowSteps: Array<{
    key: string
    status: WorkflowStepStatus
  }>
  documents: {
    total: number
    uploaded: number
    pending: number
    rejected: number
  }
  confirmationEmails: string[]
}

const MOCK_RECEIPT: CabApplicationReceipt = {
  applicationId: 'APP-2025-0086',
  status: 'received',
  clientName: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  receivedBy: 'Neha Sharma',
  receivedByInitials: 'NP',
  receivedOnDate: 'May 18, 2025',
  receivedOnTime: '11:42 AM (IST)',
  receivedOn: 'May 18, 2025, 11:42 AM (IST)',
  primaryStandards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
  requestedCertificationDate: 'Aug 18, 2025',
  accreditationBody: 'EGAC',
  numberOfSites: 2,
  auditLanguage: 'English',
  applicationDate: 'May 18, 2025',
  applicationReceivedDate: 'May 18, 2025 11:42 AM (IST)',
  referenceNo: 'RCPT/2025/05/000326',
  client: {
    name: 'GreenLeaf Pvt. Ltd.',
    clientId: 'CLT-2025-0148',
    organizationType: 'Private Limited Company',
    country: 'India',
    countryCode: 'IN',
    legalEntityName: 'GreenLeaf Pvt. Ltd.',
    registrationLicenseNo: 'U24290UP2013PTC051048',
    industry: 'Manufacturing',
  },
  scopeSummary:
    'Design, development, manufacturing and supply of industrial valves and flow control solutions for oil & gas, petrochemical and power generation industries.',
  nextSteps: [
    { key: 'applicationReview', status: 'inProgress' },
    { key: 'informationRequired', status: 'pending' },
    { key: 'technicalFeasibility', status: 'pending' },
    { key: 'proceedToQuotation', status: 'pending' },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'pending' },
    { key: 'quotation', status: 'pending' },
    { key: 'applicationReceipt', status: 'inProgress' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
    { key: 'auditExecution', status: 'pending' },
    { key: 'reporting', status: 'pending' },
    { key: 'surveillance', status: 'pending' },
  ],
  documents: {
    total: 7,
    uploaded: 7,
    pending: 0,
    rejected: 0,
  },
  confirmationEmails: ['neha.sharma@greenleaf.in', 'quality@greenleaf.in'],
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getCabApplicationReceipt(
  _applicationId = 'APP-2025-0086'
): Promise<CabApplicationReceipt> {
  await delay()
  return MOCK_RECEIPT
}
