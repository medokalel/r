export interface ReviewQueueItem {
  id: string
  applicationNumber: string
  receivedDate: string
  receivedDateRaw: string
  clientName: string
  clientCode: string
  country: string
  standard: string
  standardDescription: string
  reviewer: string
  reviewerInitials?: string
  dueDate: string
  dueDaysLeft: number
  status: 'ready_for_review' | 'in_progress' | 'clarification_requested' | 'approved' | 'rejected'
  statusLabel: string
}

export interface ReviewQueueFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
  sortBy?: string
}

const MOCK_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: 'app-0024',
    applicationNumber: 'APP-0024',
    receivedDate: '12 Feb 2025',
    receivedDateRaw: '2025-02-12',
    clientName: 'Al Noor Food Industries',
    clientCode: 'CL-0001',
    country: 'Saudi Arabia',
    standard: 'ISO 22000:2018',
    standardDescription: 'Food safety management systems',
    reviewer: 'Omar Khalid',
    reviewerInitials: 'OK',
    dueDate: '05 Mar 2025',
    dueDaysLeft: 21,
    status: 'ready_for_review',
    statusLabel: 'Ready for review',
  },
  {
    id: 'app-2025-0086',
    applicationNumber: 'APP-2025-0086',
    receivedDate: '18 May 2025',
    receivedDateRaw: '2025-05-18',
    clientName: 'GreenLeaf Pvt. Ltd.',
    clientCode: 'CLT-2025-0148',
    country: 'United Arab Emirates',
    standard: 'ISO 9001:2015',
    standardDescription: 'Quality management systems',
    reviewer: 'Neha Sharma',
    reviewerInitials: 'NS',
    dueDate: '10 Jun 2025',
    dueDaysLeft: 14,
    status: 'in_progress',
    statusLabel: 'In progress',
  },
  {
    id: 'app-0031',
    applicationNumber: 'APP-0031',
    receivedDate: '24 Jan 2025',
    receivedDateRaw: '2025-01-24',
    clientName: 'Apex Health Systems',
    clientCode: 'CL-0019',
    country: 'Egypt',
    standard: 'ISO 13485:2016',
    standardDescription: 'Medical devices quality management',
    reviewer: 'Sara Ahmed',
    reviewerInitials: 'SA',
    dueDate: '15 Feb 2025',
    dueDaysLeft: 5,
    status: 'clarification_requested',
    statusLabel: 'Clarification requested',
  },
]

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getReviewQueueItems(
  params?: ReviewQueueFilterParams
): Promise<ReviewQueueItem[]> {
  await delay()
  let list = [...MOCK_REVIEW_QUEUE]

  if (params?.searchQuery) {
    const q = params.searchQuery.toLowerCase().trim()
    list = list.filter(
      (item) =>
        item.applicationNumber.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.clientCode.toLowerCase().includes(q) ||
        item.standard.toLowerCase().includes(q)
    )
  }

  if (params?.country && params.country !== 'all') {
    list = list.filter((item) => item.country.toLowerCase() === params.country?.toLowerCase())
  }

  if (params?.status && params.status !== 'all') {
    list = list.filter((item) => item.status === params.status)
  }

  return list
}
