export interface ContactItem {
  id: string
  contactCode: string
  clientName: string
  clientCode: string
  country: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  phoneNumber: string
  phonePrefix: string
  linkedSites: string[]
  isPrimaryContact: boolean
  isAuthorizedSignatory: boolean
  inviteToPortal: boolean
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
}

export interface ContactsFilterParams {
  searchQuery?: string
  client?: string
  country?: string
  status?: string
}

let contactsMemoryStore: ContactItem[] = [
  {
    id: 'cnt-001',
    contactCode: 'CNT-001',
    clientName: 'Al Noor Food Industries',
    clientCode: 'CL-0001',
    country: 'Saudi Arabia',
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'sara@alnoor.example',
    jobTitle: 'Quality Manager',
    phoneNumber: '50 123 4567',
    phonePrefix: '+966',
    linkedSites: ['SITE-001'],
    isPrimaryContact: true,
    isAuthorizedSignatory: false,
    inviteToPortal: false,
    status: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: 'cnt-002',
    contactCode: 'CNT-002',
    clientName: 'GreenLeaf Pvt. Ltd.',
    clientCode: 'CLT-2025-0148',
    country: 'United Arab Emirates',
    firstName: 'Ahmed',
    lastName: 'Mansour',
    email: 'ahmed.m@greenleaf.example',
    jobTitle: 'Operations Director',
    phoneNumber: '52 987 6543',
    phonePrefix: '+971',
    linkedSites: ['SITE-001', 'SITE-002'],
    isPrimaryContact: true,
    isAuthorizedSignatory: true,
    inviteToPortal: true,
    status: 'active',
    createdAt: '2025-02-10',
  },
  {
    id: 'cnt-003',
    contactCode: 'CNT-003',
    clientName: 'Apex Health Systems',
    clientCode: 'CL-0019',
    country: 'Egypt',
    firstName: 'Nour',
    lastName: 'El-Din',
    email: 'nour.eldin@apex.example',
    jobTitle: 'Compliance Officer',
    phoneNumber: '10 1122 3344',
    phonePrefix: '+20',
    linkedSites: ['SITE-001'],
    isPrimaryContact: false,
    isAuthorizedSignatory: true,
    inviteToPortal: true,
    status: 'pending',
    createdAt: '2025-02-28',
  },
]

export function getContacts(params?: ContactsFilterParams): Promise<ContactItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = [...contactsMemoryStore]
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase().trim()
        result = result.filter(
          (c) =>
            c.firstName.toLowerCase().includes(q) ||
            c.lastName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.clientName.toLowerCase().includes(q) ||
            c.jobTitle.toLowerCase().includes(q) ||
            c.contactCode.toLowerCase().includes(q)
        )
      }
      if (params?.client && params.client !== 'all') {
        result = result.filter((c) => c.clientCode === params.client)
      }
      if (params?.status && params.status !== 'all') {
        result = result.filter((c) => c.status === params.status)
      }
      resolve(result)
    }, 200)
  })
}

export function createContact(data: Omit<ContactItem, 'id' | 'contactCode' | 'createdAt' | 'status'>): Promise<ContactItem> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newContact: ContactItem = {
        ...data,
        id: `cnt-${Date.now()}`,
        contactCode: `CNT-00${contactsMemoryStore.length + 1}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active',
      }
      contactsMemoryStore = [newContact, ...contactsMemoryStore]
      resolve(newContact)
    }, 250)
  })
}
