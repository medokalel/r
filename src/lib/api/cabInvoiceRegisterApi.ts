export interface CabInvoiceItem {
  id: string
  invoiceNumber: string
  clientName: string
  clientCode: string
  country: string
  issuedDate: string
  dueDate: string
  currency: string
  amount: number
  paidAmount: number
  balance: number
  status: 'Unpaid' | 'Paid' | 'Partially paid' | 'Draft'
  relatedOrder: string
  orderStatus: string
  relatedApplication: string
  poReference?: string
  primaryContact: string
  contactEmail: string
  billingAddress: {
    name: string
    line1: string
    cityArea: string
    country: string
  }
  taxRate?: {
    id: string
    label: string
    percentage: number
  }
  items: Array<{
    id: string
    name: string
    description: string
    qty: number
    unitPrice: number
    amount: number
  }>
  installments: Array<{
    id: string
    dueDate: string
    amount: number
    status: 'Pending' | 'Paid'
  }>
  attachments: Array<{
    id: string
    name: string
    type: string
    size: string
    uploadedOn: string
  }>
  payments: Array<{
    id: string
    amount: number
    date: string
    method: string
    reference: string
    note?: string
  }>
}

export interface CabInvoiceFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  paymentStatus?: string
}

let cabInvoicesStore: CabInvoiceItem[] = [
  {
    id: 'inv-0024',
    invoiceNumber: 'INV-0024',
    clientName: 'Al Noor Food Industries',
    clientCode: 'CL-0001',
    country: 'Saudi Arabia',
    issuedDate: '15 Mar 2024',
    dueDate: '14 Apr 2024',
    currency: 'USD',
    amount: 2300.0,
    paidAmount: 0.0,
    balance: 2300.0,
    status: 'Unpaid',
    relatedOrder: 'OF-0024',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0024',
    poReference: 'PO-7789',
    primaryContact: 'Sara Ali',
    contactEmail: 'sara@alnoor.example',
    billingAddress: {
      name: 'Al Noor Food Industries',
      line1: 'Prince Mohammed Bin Abdulaziz Rd',
      cityArea: 'Al Malaz, Riyadh 11432',
      country: 'Saudi Arabia',
    },
    items: [
      {
        id: '1',
        name: 'Product Certification',
        description: 'Product certification for food products (APP-0024)',
        qty: 1,
        unitPrice: 1800.0,
        amount: 1800.0,
      },
      {
        id: '2',
        name: 'Inspection Fee',
        description: 'On-site inspection',
        qty: 1,
        unitPrice: 500.0,
        amount: 500.0,
      },
    ],
    installments: [
      {
        id: '1',
        dueDate: 'Apr 7, 2025',
        amount: 2300.0,
        status: 'Pending',
      },
    ],
    attachments: [
      {
        id: '1',
        name: 'OF-0024.pdf',
        type: 'PDF',
        size: '245 KB',
        uploadedOn: 'Mar 8, 2025',
      },
    ],
    payments: [],
  },
  {
    id: 'inv-0023',
    invoiceNumber: 'INV-0023',
    clientName: 'Riyadh Fresh Trading',
    clientCode: 'CL-0007',
    country: 'Saudi Arabia',
    issuedDate: '28 Feb 2024',
    dueDate: '29 Mar 2024',
    currency: 'USD',
    amount: 1750.0,
    paidAmount: 1750.0,
    balance: 0.0,
    status: 'Paid',
    relatedOrder: 'OF-0021',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0021',
    poReference: 'PO-6521',
    primaryContact: 'Fahad Al-Otaibi',
    contactEmail: 'fahad@riyadhfresh.example',
    billingAddress: {
      name: 'Riyadh Fresh Trading',
      line1: 'King Fahd Rd',
      cityArea: 'Riyadh',
      country: 'Saudi Arabia',
    },
    items: [
      {
        id: '1',
        name: 'Initial Stage 1 Audit',
        description: 'Quality standard audit',
        qty: 1,
        unitPrice: 1750.0,
        amount: 1750.0,
      },
    ],
    installments: [
      {
        id: '1',
        dueDate: '29 Mar 2024',
        amount: 1750.0,
        status: 'Paid',
      },
    ],
    attachments: [],
    payments: [
      {
        id: 'p-1',
        amount: 1750.0,
        date: '28 Feb 2024',
        method: 'Bank transfer',
        reference: 'TRX-9887',
      },
    ],
  },
  {
    id: 'inv-0022',
    invoiceNumber: 'INV-0022',
    clientName: 'Desert Grains Co.',
    clientCode: 'CL-0003',
    country: 'Saudi Arabia',
    issuedDate: '20 Feb 2024',
    dueDate: '21 Mar 2024',
    currency: 'USD',
    amount: 980.0,
    paidAmount: 980.0,
    balance: 0.0,
    status: 'Paid',
    relatedOrder: 'OF-0018',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0018',
    poReference: 'PO-4100',
    primaryContact: 'Omar Khaled',
    contactEmail: 'omar@desertgrains.example',
    billingAddress: {
      name: 'Desert Grains Co.',
      line1: 'Al Ahsa Industrial Zone',
      cityArea: 'Al Ahsa',
      country: 'Saudi Arabia',
    },
    items: [
      {
        id: '1',
        name: 'Annual Surveillance Audit',
        description: 'Annual compliance review',
        qty: 1,
        unitPrice: 980.0,
        amount: 980.0,
      },
    ],
    installments: [],
    attachments: [],
    payments: [],
  },
  {
    id: 'inv-0021',
    invoiceNumber: 'INV-0021',
    clientName: 'Al Amanah Farms',
    clientCode: 'CL-0008',
    country: 'Saudi Arabia',
    issuedDate: '05 Feb 2024',
    dueDate: '06 Mar 2024',
    currency: 'USD',
    amount: 1200.0,
    paidAmount: 600.0,
    balance: 600.0,
    status: 'Partially paid',
    relatedOrder: 'OF-0015',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0015',
    primaryContact: 'Mona Salem',
    contactEmail: 'mona@alamanah.example',
    billingAddress: {
      name: 'Al Amanah Farms',
      line1: 'Qassim Highway',
      cityArea: 'Buraidah',
      country: 'Saudi Arabia',
    },
    items: [
      {
        id: '1',
        name: 'GAP Certification Audit',
        description: 'Good agricultural practices assessment',
        qty: 1,
        unitPrice: 1200.0,
        amount: 1200.0,
      },
    ],
    installments: [],
    attachments: [],
    payments: [
      {
        id: 'p-2',
        amount: 600.0,
        date: '05 Feb 2024',
        method: 'Bank transfer',
        reference: 'TRX-3312',
      },
    ],
  },
  {
    id: 'inv-0020',
    invoiceNumber: 'INV-0020',
    clientName: 'Gulf Dairy Products',
    clientCode: 'CL-0005',
    country: 'United Arab Emirates',
    issuedDate: '18 Jan 2024',
    dueDate: '17 Feb 2024',
    currency: 'USD',
    amount: 1450.0,
    paidAmount: 1450.0,
    balance: 0.0,
    status: 'Paid',
    relatedOrder: 'OF-0011',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0011',
    primaryContact: 'Zaid Al-Hassan',
    contactEmail: 'zaid@gulfdairy.example',
    billingAddress: {
      name: 'Gulf Dairy Products',
      line1: 'Al Quoz Industrial Area',
      cityArea: 'Dubai',
      country: 'United Arab Emirates',
    },
    items: [
      {
        id: '1',
        name: 'HACCP Verification Audit',
        description: 'Dairy processing plant assessment',
        qty: 1,
        unitPrice: 1450.0,
        amount: 1450.0,
      },
    ],
    installments: [],
    attachments: [],
    payments: [],
  },
  {
    id: 'inv-0019',
    invoiceNumber: 'INV-0019',
    clientName: 'Red Sea Fishery',
    clientCode: 'CL-0002',
    country: 'Saudi Arabia',
    issuedDate: '08 Jan 2024',
    dueDate: '07 Feb 2024',
    currency: 'USD',
    amount: 3100.0,
    paidAmount: 0.0,
    balance: 3100.0,
    status: 'Unpaid',
    relatedOrder: 'OF-0009',
    orderStatus: 'Accepted',
    relatedApplication: 'APP-0009',
    primaryContact: 'Yasser Badr',
    contactEmail: 'yasser@redsea.example',
    billingAddress: {
      name: 'Red Sea Fishery',
      line1: 'Jeddah Port Road',
      cityArea: 'Jeddah',
      country: 'Saudi Arabia',
    },
    items: [
      {
        id: '1',
        name: 'Multi-Site Seafood Safety Audit',
        description: 'Stage 1 and 2 full scope assessment',
        qty: 1,
        unitPrice: 3100.0,
        amount: 3100.0,
      },
    ],
    installments: [],
    attachments: [],
    payments: [],
  },
]

export function getCabInvoices(params?: CabInvoiceFilterParams): Promise<CabInvoiceItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let results = [...cabInvoicesStore]
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase().trim()
        results = results.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.clientName.toLowerCase().includes(q) ||
            inv.clientCode.toLowerCase().includes(q)
        )
      }
      if (params?.country && params.country !== 'all') {
        results = results.filter((inv) => inv.country.toLowerCase() === params.country?.toLowerCase())
      }
      if (params?.paymentStatus && params.paymentStatus !== 'all') {
        results = results.filter((inv) => inv.status.toLowerCase() === params.paymentStatus?.toLowerCase())
      }
      resolve(results)
    }, 180)
  })
}

export function getCabInvoiceById(id: string): Promise<CabInvoiceItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const inv = cabInvoicesStore.find(
        (i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase()
      )
      resolve(inv || null)
    }, 150)
  })
}

export function recordPayment(
  invoiceId: string,
  payment: { amount: number; date: string; method: string; reference: string; note?: string }
): Promise<CabInvoiceItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx !== -1) {
        const inv = cabInvoicesStore[idx]
        const newPaid = inv.paidAmount + payment.amount
        const newBalance = Math.max(0, inv.amount - newPaid)
        const newStatus: 'Unpaid' | 'Paid' | 'Partially paid' =
          newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partially paid' : 'Unpaid'

        const updated: CabInvoiceItem = {
          ...inv,
          paidAmount: newPaid,
          balance: newBalance,
          status: newStatus,
          payments: [
            ...inv.payments,
            {
              id: `pay-${Date.now()}`,
              ...payment,
            },
          ],
        }
        cabInvoicesStore[idx] = updated
        resolve(updated)
      } else {
        resolve(null)
      }
    }, 200)
  })
}

export function updateInvoiceTax(
  invoiceId: string,
  taxRate: { id: string; label: string; percentage: number }
): Promise<CabInvoiceItem | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx !== -1) {
        cabInvoicesStore[idx].taxRate = taxRate
        resolve(cabInvoicesStore[idx])
      } else {
        resolve(null)
      }
    }, 150)
  })
}
