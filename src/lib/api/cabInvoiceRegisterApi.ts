export type CabInvoiceStatus = 'Unpaid' | 'Paid' | 'Partially paid' | 'Draft' | 'Issued'

export interface CabCreditNote {
  id: string
  creditNoteNumber: string
  /** Stable link to the original invoice — never detached. */
  linkedInvoiceId: string
  linkedInvoiceNumber: string
  amount: number
  currency: string
  reason: string
  createdOn: string
}
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
  status: CabInvoiceStatus
  /** CAB-client relationship scope — never cross-tenant sharing. */
  organizationId: string
  siteId: string
  contactId: string
  documentIds: string[]
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
    organizationId: 'org-al-noor',
    siteId: 'site-riyadh-main',
    contactId: 'contact-sara-ali',
    documentIds: ['doc-OF-0024'],
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
    organizationId: 'org-riyadh-fresh',
    siteId: 'site-riyadh-north',
    contactId: 'contact-fahad-otaibi',
    documentIds: ['doc-OF-0021'],
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
    organizationId: 'org-desert-grains',
    siteId: 'site-ahsa-plant',
    contactId: 'contact-omar-khaled',
    documentIds: ['doc-OF-0018'],
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
    organizationId: 'org-amanah',
    siteId: 'site-qassim-farm',
    contactId: 'contact-mona-salem',
    documentIds: ['doc-OF-0015'],
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
    organizationId: 'org-gulf-dairy',
    siteId: 'site-dubai-quoz',
    contactId: 'contact-zaid-hassan',
    documentIds: ['doc-OF-0011'],
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
    organizationId: 'org-red-sea',
    siteId: 'site-jeddah-port',
    contactId: 'contact-yasser-badr',
    documentIds: ['doc-OF-0009'],
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
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const inv = cabInvoicesStore[idx]
      // Finalized invoices stay immutable — payments only allocate against the balance.
      if (inv.status === 'Issued' || inv.status === 'Paid') {
        if (inv.balance <= 0) {
          reject(new Error('INVOICE_SETTLED'))
          return
        }
      }
      if (!Number.isFinite(payment.amount) || payment.amount <= 0) {
        reject(new Error('INVALID_AMOUNT'))
        return
      }
      if (payment.amount - inv.balance > 0.009) {
        reject(new Error('AMOUNT_EXCEEDS_BALANCE'))
        return
      }
      if (!payment.date || !payment.method) {
        reject(new Error('PAYMENT_DETAILS_REQUIRED'))
        return
      }
      {
        const current = cabInvoicesStore[idx]
        const newPaid = current.paidAmount + payment.amount
        const newBalance = Math.max(0, current.amount - newPaid)
        const newStatus: CabInvoiceStatus =
          newBalance === 0 ? 'Paid' : newPaid > 0 ? 'Partially paid' : 'Unpaid'

        const updated: CabInvoiceItem = {
          ...current,
          paidAmount: newPaid,
          balance: newBalance,
          status: newStatus,
          payments: [
            ...current.payments,
            {
              id: `pay-${Date.now()}`,
              ...payment,
            },
          ],
        }
        cabInvoicesStore[idx] = updated
        resolve(updated)
      }
    }, 200)
  })
}

export function updateInvoiceTax(
  invoiceId: string,
  taxRate: { id: string; label: string; percentage: number }
): Promise<CabInvoiceItem | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const inv = cabInvoicesStore[idx]
      // Finalized invoices are immutable — tax cannot change after issue.
      if (inv.status === 'Issued' || inv.status === 'Paid' || inv.status === 'Partially paid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      if (idx !== -1) {
        cabInvoicesStore[idx].taxRate = taxRate
        resolve(cabInvoicesStore[idx])
      } else {
        resolve(null)
      }
    }, 150)
  })
}

/** Draft save permits incomplete later-stage data (billing/tax may be missing). */
export function saveInvoiceDraft(
  invoiceId: string,
  patch: Partial<CabInvoiceItem>
): Promise<CabInvoiceItem | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const current = cabInvoicesStore[idx]
      if (current.status !== 'Draft' && current.status !== 'Unpaid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      const updated: CabInvoiceItem = {
        ...current,
        ...patch,
        id: current.id,
        invoiceNumber: current.invoiceNumber,
        // Tenant scope is stable within the CAB-client relationship.
        organizationId: current.organizationId,
        siteId: current.siteId,
        contactId: current.contactId,
        documentIds: current.documentIds,
        status: 'Draft',
        paidAmount: current.paidAmount,
        balance: current.balance,
        payments: current.payments,
      }
      cabInvoicesStore[idx] = updated
      resolve(updated)
    }, 150)
  })
}

export interface InvoiceIssueGate {
  ok: boolean
  missingBilling: boolean
  missingTax: boolean
}

/** Issuing requires billing + applicable tax configuration. */
export function getInvoiceIssueGate(invoice: CabInvoiceItem): InvoiceIssueGate {
  const billing = invoice.billingAddress
  const missingBilling = !billing || !billing.name?.trim() || !billing.line1?.trim() || !billing.country?.trim()
  const missingTax = !invoice.taxRate
  return { ok: !missingBilling && !missingTax, missingBilling, missingTax }
}

/** Issue a draft invoice — the finalized invoice becomes immutable. */
export function issueInvoice(invoiceId: string): Promise<CabInvoiceItem | null> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = cabInvoicesStore.findIndex(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (idx === -1) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      const current = cabInvoicesStore[idx]
      if (current.status !== 'Draft' && current.status !== 'Unpaid') {
        reject(new Error('INVOICE_IMMUTABLE'))
        return
      }
      const gate = getInvoiceIssueGate(current)
      if (!gate.ok) {
        reject(new Error(gate.missingBilling ? 'BILLING_REQUIRED' : 'TAX_REQUIRED'))
        return
      }
      const updated: CabInvoiceItem = { ...current, status: current.paidAmount > 0 ? current.status : 'Issued' }
      // Draft with no payments moves to Issued (still immutable for header/tax/items).
      if (current.status === 'Draft' && current.paidAmount <= 0) {
        updated.status = 'Issued'
        updated.balance = updated.amount
      }
      cabInvoicesStore[idx] = updated
      resolve(updated)
    }, 180)
  })
}

let cabCreditNotesStore: CabCreditNote[] = []

/** Credit note stays linked to the original — issued invoices are never deleted. */
export function createCreditNote(
  invoiceId: string,
  input: { amount: number; reason: string }
): Promise<CabCreditNote> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const inv = cabInvoicesStore.find(
        (i) => i.id === invoiceId || i.invoiceNumber.toLowerCase() === invoiceId.toLowerCase()
      )
      if (!inv) {
        reject(new Error('INVOICE_NOT_FOUND'))
        return
      }
      if (inv.status === 'Draft') {
        reject(new Error('CREDIT_NOTE_REQUIRES_ISSUED'))
        return
      }
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        reject(new Error('INVALID_AMOUNT'))
        return
      }
      if (!input.reason?.trim()) {
        reject(new Error('REASON_REQUIRED'))
        return
      }
      const note: CabCreditNote = {
        id: `cn-${Date.now()}`,
        creditNoteNumber: `CN-${inv.invoiceNumber.replace(/^INV-/, '')}-${String(cabCreditNotesStore.length + 1).padStart(2, '0')}`,
        linkedInvoiceId: inv.id,
        linkedInvoiceNumber: inv.invoiceNumber,
        amount: input.amount,
        currency: inv.currency,
        reason: input.reason.trim(),
        createdOn: new Date().toISOString(),
      }
      cabCreditNotesStore = [...cabCreditNotesStore, note]
      resolve(note)
    }, 180)
  })
}
