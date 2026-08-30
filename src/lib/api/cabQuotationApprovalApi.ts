export type QuotationApprovalStatus = 'inProgress' | 'approved' | 'rejected'

export interface QuotationApprovalLineItem {
  id: number
  description: string
  basis: string
  quantity: string
  rate: string
  amount: string
}

export interface CabQuotationApproval {
  applicationId: string
  client: string
  applicationType: string
  certificationBody: string
  standardScheme: string
  sitesCount: number
  requestedOnDate: string
  requestedOnTime: string
  assignedTo: { name: string; initials: string; role: string }

  quotationNo: string
  version: string
  preparedBy: string
  preparedOn: string
  validUntil: string
  validityDays: number
  currency: string
  totalExcludingTaxes: string
  taxesPercent: number
  taxesAmount: string
  totalIncludingTaxes: string

  auditScopeDescription: string
  includedInScope: string[]

  lineItems: QuotationApprovalLineItem[]
  subTotal: string
  discountLabel: string
  discountAmount: string
  breakdownTotalExcludingTaxes: string

  sites: Array<{ name: string; address: string }>

  approval: {
    reviewStatus: string
    reviewedBy: string
    reviewedOn: string
    comments: string
  }

  internalComments: Array<{
    author: string
    initials: string
    role: string
    date: string
    time: string
    text: string
  }>

  approvalHistory: Array<{
    author: string
    initials: string
    date: string
    time: string
    text: string
    tag: string
  }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK: CabQuotationApproval = {
  applicationId: 'APP-2025-0086',
  client: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  standardScheme: 'ISO 9001:2015',
  sitesCount: 2,
  requestedOnDate: 'May 19, 2025',
  requestedOnTime: '02:35 PM (IST)',
  assignedTo: { name: 'Neha Sharma', initials: 'NS', role: 'Lead Auditor' },

  quotationNo: 'QUO-2025-0086',
  version: '1.0',
  preparedBy: 'Neha Sharma (Lead Auditor)',
  preparedOn: 'May 19, 2025',
  validUntil: 'Jun 18, 2025',
  validityDays: 30,
  currency: 'USD',
  totalExcludingTaxes: '8,450.00',
  taxesPercent: 0,
  taxesAmount: '0.00',
  totalIncludingTaxes: '8,450.00',

  auditScopeDescription:
    'Design, development, manufacturing and supply of industrial valves and flow control solutions for oil & gas, petrochemical and power generation industries.',
  includedInScope: [
    'ISO 9001:2015 certification coverage',
    '2 physical sites included (Head Office & Plant 2)',
    'On-site audit planning, execution, and findings report',
    'Certification decision and formal certificate issuance',
    '1st year surveillance audit scheduling (within validity)',
  ],

  lineItems: [
    { id: 1, description: 'Lead Auditor', basis: 'Audit Days', quantity: '5', rate: '1,200.00', amount: '6,000.00' },
    { id: 2, description: 'Auditor', basis: 'Audit Days', quantity: '5', rate: '800.00', amount: '4,000.00' },
    { id: 3, description: 'Technical Expert (Valves)', basis: 'Days', quantity: '5', rate: '600.00', amount: '1,200.00' },
    { id: 4, description: 'Travel Expenses', basis: 'Actual (Est.)', quantity: '2', rate: '750.00', amount: '750.00' },
    { id: 5, description: 'Accommodation', basis: 'Actual (Est.)', quantity: '2', rate: '700.00', amount: '750.00' },
    { id: 6, description: 'Miscellaneous', basis: 'Lump sum', quantity: '1', rate: '300.00', amount: '750.00' },
  ],
  subTotal: '13,150.00',
  discountLabel: '5%',
  discountAmount: '700.00',
  breakdownTotalExcludingTaxes: '8,450.00',

  sites: [
    { name: 'GreenLeaf Pvt. Ltd. - Head Office', address: 'Plot No. 45, Sector 16, Noida, Uttar Pradesh 201301' },
    { name: 'GreenLeaf Pvt. Ltd. - Plant 2', address: 'Plot No. 78, Sector 80, Noida, Uttar Pradesh 201305, India' },
  ],

  approval: {
    reviewStatus: 'Ready for Approval',
    reviewedBy: 'Neha Sharma / Lead Auditor',
    reviewedOn: 'May 19, 2025 03:40 PM',
    comments: 'Quotation is compliant with regional tariff guidelines and client operational records. Ready for approval.',
  },

  internalComments: [
    {
      author: 'Neha Sharma',
      initials: 'NS',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '03:45 PM',
      text: 'The quotation was prepared based on the IAF MD 1 guidelines. Discount has been applied as discussed.',
    },
    {
      author: 'Ramesh Kumar',
      initials: 'RK',
      role: 'Technical Reviewer',
      date: 'May 19, 2025',
      time: '04:10 PM',
      text: 'Checked scope alignment with operational records. It is ready for dispatch to client.',
    },
  ],

  approvalHistory: [
    {
      author: 'Neha Sharma',
      initials: 'NS',
      date: 'May 19, 2025',
      time: '03:40 PM',
      text: 'Quotation reviewed and recommended for client dispatch.',
      tag: 'Reviewed',
    },
    {
      author: 'Ramesh Kumar',
      initials: 'RK',
      date: 'May 19, 2025',
      time: '10:15 AM',
      text: 'All criteria match the IAF MD 1 policy document.',
      tag: 'Reviewed',
    },
  ],
}

export async function getCabQuotationApproval(_applicationId?: string): Promise<CabQuotationApproval> {
  await delay()
  return MOCK
}
