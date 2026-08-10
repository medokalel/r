export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type ChecklistStatus = 'complete' | 'partiallyComplete' | 'incomplete' | 'notApplicable'
export type DocumentStatus = 'valid' | 'expired' | 'pending'
export type CommentTag = 'minor' | 'note' | 'major'

export interface CabApplicationReview {
  applicationId: string
  status: 'inProgress'
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  receivedOnDate: string
  receivedOnTime: string
  assignedReviewer: { name: string; initials: string; role: string }
  checklist: Array<{
    id: number
    area: string
    description: string
    status: ChecklistStatus
    comment: string
  }>
  overallReviewPercent: number
  overallReviewSummary: string
  reviewDecision: string
  reviewDecisionOptions: string[]
  reviewerCommentsWarning: string[]
  reviewComments: Array<{
    author: string
    role: string
    date: string
    time: string
    tag?: CommentTag
    text: string
  }>
  internalComments: Array<{ author: string; role: string; date: string; time: string; text: string }>
  documents: Array<{ name: string; fileName: string; size: string; status: DocumentStatus }>
  history: Array<{ date: string; time: string; by: string; action: string; details: string }>
  applicationDetails: {
    applicationType: string
    applicationDate: string
    primaryStandard: string
    requestedCertificationDate: string
    additionalStandards: string[]
    numberOfSites: number
    applicableScheme: string
    auditLanguage: string
    certificationBody: string
    referenceNo: string
  }
  scopeSummary: string
  nextSteps: Array<{ key: string; status: WorkflowStepStatus }>
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
  notes: string
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_REVIEW: CabApplicationReview = {
  applicationId: 'APP-2025-0086',
  status: 'inProgress',
  client: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  primaryStandard: 'ISO 9001:2015',
  receivedOnDate: 'May 18, 2025',
  receivedOnTime: '11:42 AM (IST)',
  assignedReviewer: { name: 'Neha Sharma', initials: 'NP', role: 'Lead Auditor' },
  checklist: [
    {
      id: 1,
      area: 'Completeness',
      description: 'All required information and documents are provided.',
      status: 'complete',
      comment: 'All mandatory fields and documents are complete.',
    },
    {
      id: 2,
      area: 'Eligibility',
      description: 'Client meets eligibility criteria for the requested certification.',
      status: 'complete',
      comment: 'Client is eligible for certification.',
    },
    {
      id: 3,
      area: 'Scope & Applicability',
      description: 'Scope is clear and applicable to the standard.',
      status: 'complete',
      comment: 'Scope is clear and meets standard requirements.',
    },
    {
      id: 4,
      area: 'Management System Info',
      description: 'Information about management system and processes.',
      status: 'partiallyComplete',
      comment: 'Some processes description is brief. Please confirm.',
    },
    {
      id: 5,
      area: 'Legal & Regulatory',
      description: 'Compliance with applicable legal and regulatory requirements.',
      status: 'complete',
      comment: 'Legal compliance information is adequate.',
    },
    {
      id: 6,
      area: 'Required Documents',
      description: 'All required documents are uploaded and valid.',
      status: 'partiallyComplete',
      comment: '2 documents are pending / expired. Refer details.',
    },
    {
      id: 7,
      area: 'Fees & Payment Terms',
      description: 'Fee structure and payment terms accepted.',
      status: 'notApplicable',
      comment: 'To be reviewed during quotation phase.',
    },
  ],
  overallReviewPercent: 80,
  overallReviewSummary:
    'Application is substantially complete. Some items require additional information before proceeding to technical feasibility.',
  reviewDecision: 'Proceed to Technical Feasibility',
  reviewDecisionOptions: [
    'Proceed to Technical Feasibility',
    'Hold for More Information',
    'Reject Application',
  ],
  reviewerCommentsWarning: [
    'Please provide detail of internal audit process.',
    'Risk assessment method not clearly described.',
    '2 documents are expired. Please upload latest versions.',
  ],
  reviewComments: [
    {
      author: 'Neha Sharma',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '10:15 AM',
      tag: 'minor',
      text: '- Provide more detail for internal audit process.\n- Risk assessment method not clearly described.\n- Please confirm validity of calibration certificates.',
    },
    {
      author: 'Rakesh Kumar',
      role: 'Technical Reviewer',
      date: 'May 19, 2025',
      time: '01:40 PM',
      tag: 'note',
      text: 'The management system processes look adequate. Some documents are pending or expired.',
    },
    {
      author: 'Neha Sharma',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '02:05 PM',
      tag: 'note',
      text: 'Initial review completed. Awaiting information from client.',
    },
  ],
  internalComments: [
    {
      author: 'Neha Sharma',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '02:30 PM',
      text: 'Wait for updated documents from client. After that, proceed to technical feasibility.',
    },
    {
      author: 'Neha Sharma',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '02:31 PM',
      text: 'Possible areas of concern:\n- Document control process\n- Corrective action effectiveness',
    },
  ],
  documents: [
    { name: 'Completed Application Form', fileName: 'Completed_Application_Form.pdf', size: '245 KB', status: 'valid' },
    { name: 'Legal Entity Certificate', fileName: 'Legal_Entity_Certificate.pdf', size: '512 KB', status: 'valid' },
    { name: 'Quality Manual V2.1', fileName: 'Quality_Manual_V2.1.pdf', size: '1.2 MB', status: 'valid' },
    { name: 'Organization Chart', fileName: 'Organization_Chart.pdf', size: '310 KB', status: 'valid' },
    { name: 'Scope Statement', fileName: 'Scope_Statement.pdf', size: '198 KB', status: 'valid' },
    { name: 'Supporting Documents (Licenses, etc.)', fileName: 'Supporting_Documents.zip', size: '2.4 MB', status: 'expired' },
    { name: 'Other Relevant Information', fileName: 'Other_Information.pdf', size: '156 KB', status: 'valid' },
  ],
  history: [
    { date: 'May 18, 2025', time: '11:42 AM', by: 'System', action: 'Application Received', details: 'Application submitted by client.' },
    { date: 'May 18, 2025', time: '11:45 AM', by: 'System', action: 'Application Logged', details: 'Application number APP-2025-0086 generated.' },
    { date: 'May 19, 2025', time: '10:10 AM', by: 'Neha Sharma', action: 'Reviewer Assigned', details: 'Assigned to Lead Auditor.' },
    { date: 'May 19, 2025', time: '10:12 AM', by: 'Neha Sharma', action: 'Review Started', details: 'Application review started.' },
  ],
  applicationDetails: {
    applicationType: 'Initial Certification',
    applicationDate: 'May 18, 2025',
    primaryStandard: 'ISO 9001:2015',
    requestedCertificationDate: 'Aug 18, 2025',
    additionalStandards: ['ISO 14001:2015', 'ISO 45001:2018'],
    numberOfSites: 2,
    applicableScheme: 'N/A',
    auditLanguage: 'English',
    certificationBody: 'CASCO',
    referenceNo: 'RCPT/2025/05/000326',
  },
  scopeSummary:
    'Design, development, manufacturing and supply of industrial valves and flow control solutions for oil & gas, petrochemical and power generation industries.',
  nextSteps: [
    { key: 'technicalFeasibility', status: 'inProgress' },
    { key: 'informationRequired', status: 'pending' },
    { key: 'quotation', status: 'pending' },
    { key: 'managementReview', status: 'pending' },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'inProgress' },
    { key: 'quotation', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
    { key: 'auditExecution', status: 'pending' },
    { key: 'reporting', status: 'pending' },
    { key: 'surveillance', status: 'pending' },
  ],
  notes: 'Once technical feasibility is approved, the application will move to quotation phase.',
}

export async function getCabApplicationReview(
  _applicationId = 'APP-2025-0086'
): Promise<CabApplicationReview> {
  await delay()
  return MOCK_REVIEW
}
