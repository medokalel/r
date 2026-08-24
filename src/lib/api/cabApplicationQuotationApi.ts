export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type DocumentStatus = 'valid' | 'draft' | 'expired'
export type DocumentFileType = 'pdf' | 'excel'

export interface QuotationLineItem {
  id: number
  description: string
  basis: string
  quantity: string
  unitRate: string
  amount: string
}

export interface CabApplicationQuotation {
  applicationId: string
  status: 'inProgress'
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  sitesCount: number
  requestedOnDate: string
  requestedOnTime: string
  assignedTo: { name: string; initials: string; role: string }
  documentCount: number
  totalAmount: string
  totalAmountNote: string
  proposedAuditDates: string
  proposedAuditDays: string
  auditTeamSummary: string
  auditTeamDetail: string
  sitesSummary: string
  sitesDetail: string
  validitySummary: string
  validityDetail: string
  lineItems: QuotationLineItem[]
  subTotal: string
  discountLabel: string
  discountAmount: string
  totalExcludingTaxes: string
  includedItems: string[]
  excludedItems: string[]
  paymentTerms: { terms: string; method: string; currency: string; notes: string }
  internalComments: Array<{
    author: string
    initials: string
    role: string
    date: string
    time: string
    text: string
    tag?: string
  }>
  documents: Array<{ name: string; status: DocumentStatus; fileType: DocumentFileType }>
  nextSteps: Array<{ key: string; status: WorkflowStepStatus }>
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK: CabApplicationQuotation = {
  applicationId: 'APP-2025-0086',
  status: 'inProgress',
  client: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  primaryStandard: 'ISO 9001:2015',
  sitesCount: 2,
  requestedOnDate: 'May 19, 2025',
  requestedOnTime: '02:35 PM (IST)',
  assignedTo: { name: 'Neha Sharma', initials: 'NS', role: 'Lead Auditor' },
  documentCount: 7,
  totalAmount: 'USD 8,450.00',
  totalAmountNote: '(Excluding Taxes)',
  proposedAuditDates: 'Jun 15 – Jun 19, 2025',
  proposedAuditDays: '5 Audit Days',
  auditTeamSummary: '2 Auditor(s)',
  auditTeamDetail: '1 Technical Expert',
  sitesSummary: '2 Sites',
  sitesDetail: 'India',
  validitySummary: '30 Days',
  validityDetail: 'Valid until Jun 18, 2025',
  lineItems: [
    { id: 1, description: 'Lead Auditor', basis: '5 Audit Days', quantity: '5', unitRate: '1,200.00', amount: '6,000.00' },
    { id: 2, description: 'Auditor', basis: '5 Audit Days', quantity: '5', unitRate: '800.00', amount: '4,000.00' },
    { id: 3, description: 'Technical Expert (Valves & FC)', basis: '2 Days', quantity: '2', unitRate: '600.00', amount: '1,200.00' },
    { id: 4, description: 'Travel Expenses', basis: 'Actual (Estimated)', quantity: '1', unitRate: '750.00', amount: '750.00' },
    { id: 5, description: 'Accommodation', basis: 'Actual (Estimated)', quantity: '1', unitRate: '900.00', amount: '900.00' },
    { id: 6, description: 'Miscellaneous', basis: 'Lumpsum', quantity: '1', unitRate: '300.00', amount: '300.00' },
  ],
  subTotal: '13,150.00',
  discountLabel: '5%',
  discountAmount: '- 700.00',
  totalExcludingTaxes: '8,450.00',
  includedItems: [
    'Audit planning',
    'On-site audit activities',
    'Audit report preparation',
    'Certificate issuance (upon successful audit)',
    'Travel within 100 km of audit site',
  ],
  excludedItems: [
    'Taxes and statutory levies',
    'Additional sites beyond quoted scope',
    'Follow-up / surveillance audits',
    'Training services',
    'Translation services',
  ],
  paymentTerms: {
    terms: '50% Advance, 50% After Audit',
    method: 'Bank Transfer',
    currency: 'USD',
    notes: 'Any additional audit days will be charged at the applicable daily rate.',
  },
  internalComments: [
    {
      author: 'Neha Sharma',
      initials: 'NP',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '03:30 PM',
      tag: 'Note',
      text: 'Quotation prepared based on approved scope and 5 audit days. Team and rates reviewed and approved.',
    },
    {
      author: 'Rakesh Kumar',
      initials: 'RK',
      role: 'Technical Reviewer',
      date: 'May 19, 2025',
      time: '03:45 PM',
      tag: 'Note',
      text: 'Please confirm client preference for proposed dates before sending.',
    },
  ],
  documents: [
    { name: 'Completed Application Form.pdf', status: 'valid', fileType: 'pdf' },
    { name: 'Quotation Draft.pdf', status: 'draft', fileType: 'pdf' },
    { name: 'Technical Feasibility Report.pdf', status: 'valid', fileType: 'pdf' },
    { name: 'Scope Document.pdf', status: 'valid', fileType: 'pdf' },
    { name: 'Audit Plan Template.xlsx', status: 'valid', fileType: 'excel' },
    { name: 'Commercial Proposal.pdf', status: 'draft', fileType: 'pdf' },
    { name: 'Rate Sheet.xlsx', status: 'valid', fileType: 'excel' },
  ],
  nextSteps: [
    { key: 'technicalFeasibility', status: 'completed' },
    { key: 'quotation', status: 'inProgress' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'quotationSent', status: 'pending' },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'completed' },
    { key: 'informationRequired', status: 'completed' },
    { key: 'technicalFeasibility', status: 'completed' },
    { key: 'quotation', status: 'inProgress' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
  ],
}

export async function getCabApplicationQuotation(_applicationId?: string): Promise<CabApplicationQuotation> {
  await delay()
  return MOCK
}
