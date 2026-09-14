export interface OfferFeeItem {
  id: string
  description: string
  amount: number
}

export type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'issued' | 'rejected' | 'void'

export interface OfferItem {
  id: string
  offerNumber: string
  clientName: string
  clientCode: string
  country: string
  primaryContact: string
  contactEmail: string
  relatedApplication: string
  applicationStandard: string
  applicationScope: string
  currency: string
  validUntil: string
  paymentTerms: string
  notes?: string
  fees: OfferFeeItem[]
  travelCosts: 'Included' | 'Excluded' | 'Reimbursed'
  optionalDiscount: number
  termsAttachmentName?: string
  approvalRoute: string
  status: OfferStatus
  statusLabel: string
  createdAt: string
  history?: Array<{
    action: string
    by: string
    date: string
  }>
}

export interface OfferFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
}

let offersMemoryStore: OfferItem[] = [
  {
    id: 'of-0024',
    offerNumber: 'OF-0024',
    clientName: 'Al Noor Food Industries',
    clientCode: 'CL-0001',
    country: 'Saudi Arabia',
    primaryContact: 'Sara Ali',
    contactEmail: 'sara@alnoor.example',
    relatedApplication: 'APP-0024',
    applicationStandard: 'ISO 22000:2018',
    applicationScope: 'Food safety management systems (ISO 22000)',
    currency: 'SAR',
    validUntil: '2025-04-30',
    paymentTerms: '30 days from invoice date',
    notes: 'Standard certification quotation with annual surveillance plan.',
    fees: [
      { id: '1', description: 'Audit fee', amount: 100000 },
      { id: '2', description: 'Administration fee', amount: 25000 },
    ],
    travelCosts: 'Excluded',
    optionalDiscount: 0,
    termsAttachmentName: 'Offer_Terms_Conditions.pdf',
    approvalRoute: 'Commercial Approval',
    status: 'issued',
    statusLabel: 'Issued',
    createdAt: '2025-02-15',
  },
  {
    id: 'of-0025',
    offerNumber: 'OF-0025',
    clientName: 'GreenLeaf Pvt. Ltd.',
    clientCode: 'CLT-2025-0148',
    country: 'United Arab Emirates',
    primaryContact: 'Ahmed Mansour',
    contactEmail: 'ahmed.m@greenleaf.example',
    relatedApplication: 'APP-0019',
    applicationStandard: 'ISO 9001:2015',
    applicationScope: 'Quality management systems for packaging manufacturing',
    currency: 'USD',
    validUntil: '2025-05-15',
    paymentTerms: '15 days from invoice date',
    fees: [
      { id: '1', description: 'Initial Stage 1 & Stage 2 Audit', amount: 3500 },
      { id: '2', description: 'Registration & Certificate Issuance', amount: 500 },
    ],
    travelCosts: 'Included',
    optionalDiscount: 200,
    termsAttachmentName: 'Terms_GreenLeaf_2025.pdf',
    approvalRoute: 'Commercial Approval',
    status: 'pending_approval',
    statusLabel: 'Pending approval',
    createdAt: '2025-02-18',
  },
  {
    id: 'of-0026',
    offerNumber: 'OF-0026',
    clientName: 'Apex Health Systems',
    clientCode: 'CL-0019',
    country: 'Egypt',
    primaryContact: 'Nour El-Din',
    contactEmail: 'nour.eldin@apex.example',
    relatedApplication: 'APP-0012',
    applicationStandard: 'ISO 45001:2018',
    applicationScope: 'Occupational health and safety management in healthcare facilities',
    currency: 'EGP',
    validUntil: '2025-06-01',
    paymentTerms: '50% advance, 50% upon completion',
    fees: [
      { id: '1', description: 'Comprehensive Audit Assessment', amount: 85000 },
    ],
    travelCosts: 'Excluded',
    optionalDiscount: 5000,
    approvalRoute: 'Commercial Approval',
    status: 'draft',
    statusLabel: 'Draft',
    createdAt: '2025-02-20',
  },
]

export function getOffers(params?: OfferFilterParams): Promise<OfferItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = [...offersMemoryStore]
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase().trim()
        result = result.filter(
          (o) =>
            o.offerNumber.toLowerCase().includes(q) ||
            o.clientName.toLowerCase().includes(q) ||
            o.relatedApplication.toLowerCase().includes(q) ||
            o.primaryContact.toLowerCase().includes(q)
        )
      }
      if (params?.country && params.country !== 'all') {
        result = result.filter((o) => o.country.toLowerCase() === params.country?.toLowerCase())
      }
      if (params?.status && params.status !== 'all') {
        result = result.filter((o) => o.status === params.status)
      }
      resolve(result)
    }, 200)
  })
}

export function getOfferById(id: string): Promise<OfferItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = offersMemoryStore.find((o) => o.id === id || o.offerNumber.toLowerCase() === id.toLowerCase())
      resolve(found || null)
    }, 150)
  })
}

export function createOffer(data: Omit<OfferItem, 'id' | 'offerNumber' | 'createdAt' | 'statusLabel'>): Promise<OfferItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nextNum = `OF-00${offersMemoryStore.length + 24}`
      const newOffer: OfferItem = {
        ...data,
        id: nextNum.toLowerCase(),
        offerNumber: nextNum,
        createdAt: new Date().toISOString().split('T')[0],
        statusLabel: data.status === 'pending_approval' ? 'Pending approval' : 'Draft',
      }
      offersMemoryStore = [newOffer, ...offersMemoryStore]
      resolve(newOffer)
    }, 250)
  })
}

export function updateOfferStatus(id: string, newStatus: OfferStatus): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = offersMemoryStore.findIndex((o) => o.id === id || o.offerNumber === id)
      if (index !== -1) {
        offersMemoryStore[index].status = newStatus
        offersMemoryStore[index].statusLabel =
          newStatus === 'issued'
            ? 'Issued'
            : newStatus === 'approved'
            ? 'Approved'
            : newStatus === 'pending_approval'
            ? 'Pending approval'
            : newStatus === 'void'
            ? 'Void'
            : 'Draft'
        resolve(true)
      } else {
        resolve(false)
      }
    }, 200)
  })
}
