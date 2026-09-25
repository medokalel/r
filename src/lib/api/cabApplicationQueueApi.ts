export interface ReviewQueueItem {
  id: string
  clientId?: string
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

export async function getReviewQueueItems(
  params?: ReviewQueueFilterParams
): Promise<ReviewQueueItem[]> {
  const { listCabApplications } = await import('@/lib/api/cabApplicationRegisterApi')
  const applications = await listCabApplications()
  let list: ReviewQueueItem[] = applications
    .filter((application) => application.status !== 'DRAFT')
    .map((application) => {
      const received = new Date(application.updatedAt)
      const due = new Date(received)
      due.setDate(due.getDate() + 14)
      const dueDaysLeft = Math.ceil((due.getTime() - Date.now()) / 86_400_000)
      const status =
        application.status === 'APPROVED'
          ? 'approved'
          : application.status === 'REJECTED'
            ? 'rejected'
            : application.status === 'UNDER_REVIEW'
              ? 'in_progress'
              : 'ready_for_review'
      const statusLabel =
        status === 'approved'
          ? 'Approved'
          : status === 'rejected'
            ? 'Rejected'
            : status === 'in_progress'
              ? 'In progress'
              : 'Ready for review'

      return {
        id: application.id,
        clientId: application.clientId,
        applicationNumber: application.applicationCode,
        receivedDate: received.toLocaleDateString(),
        receivedDateRaw: application.updatedAt,
        clientName: application.clientName,
        clientCode: application.clientCode,
        country: application.countryCode || '—',
        standard: application.standards[0] || '—',
        standardDescription: application.standards.slice(1).join(', '),
        reviewer: 'CAB Admin',
        reviewerInitials: 'CA',
        dueDate: due.toLocaleDateString(),
        dueDaysLeft,
        status,
        statusLabel,
      } satisfies ReviewQueueItem
    })

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
