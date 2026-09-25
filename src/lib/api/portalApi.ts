export interface ClientProfile {
  id: string
  clientCode: string
  name: string
  legalName: string
  tradingName: string
  country: string
  industrySector: string
  registrationNumber: string
  website: string
  status: 'Active client' | 'Pending' | 'Suspended'
  logoUrl?: string

  // Address
  address: {
    country: string
    building: string
    city: string
    postalCode: string
    street: string
    additionalLine: string
  }

  // Related data
  primaryContact: {
    name: string
    role: string
    email: string
    phone: string
  }

  hasPendingLegalChange: boolean
  pendingChanges: Array<{
    id: string
    field: string
    currentValue: string
    requestedValue: string
    submittedAt: string
    status: 'Under review' | 'Approved' | 'Rejected'
  }>

  sites: Array<{
    id: string
    name: string
    address: string
    status: 'Active' | 'Inactive'
  }>

  contacts: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    isPrimary: boolean
    hasPortalAccess: boolean
    isSignatory: boolean
  }>

  documents: Array<{
    id: string
    name: string
    type: 'Legal' | 'General' | 'Policy' | 'Technical'
    lastUpdated: string
    fileSize?: string
  }>

  activeApplication?: {
    id: string
    scheme: string
    status: 'Draft' | 'Submitted' | 'In Review' | 'Approved'
    lastUpdated: string
    submittedDate?: string
  }

  clarification?: {
    required: boolean
    applicationId: string
    message: string
    dueDate: string
  }

  upcomingAudit?: {
    stage: string
    date: string
    location: string
  }

  documentsSummary: {
    uploadedByYou: number
    requestedByUs: number
    sharedWithYou: number
  }

  recentActivity: Array<{
    id: string
    date: string
    details: string
    relatedTo: string
    type: 'edit' | 'alert' | 'upload' | 'create'
  }>

  cabContacts: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    initials: string
  }>
}

export const INITIAL_PORTAL_CLIENT: ClientProfile = {
  id: 'CL-0001',
  clientCode: 'CL-0001',
  name: 'Al Noor Food Industries',
  legalName: 'Al Noor Food Industries',
  tradingName: 'Al Noor Food Industries',
  country: 'Saudi Arabia',
  industrySector: 'Food Manufacturing',
  registrationNumber: '1010554321',
  website: 'https://www.alnoor.example',
  status: 'Active client',
  address: {
    country: 'Saudi Arabia',
    building: 'Building 12',
    city: 'Riyadh',
    postalCode: '12214',
    street: 'King Fahd Road',
    additionalLine: 'Al Olaya District',
  },
  primaryContact: {
    name: 'Sara Ali',
    role: 'Quality Manager',
    email: 'sara@alnoor.example',
    phone: '+966 50 123 4567',
  },
  hasPendingLegalChange: true,
  pendingChanges: [
    {
      id: 'CHG-001',
      field: 'Legal name',
      currentValue: 'Al Noor Food Industries',
      requestedValue: 'Al Noor Food Industries Co. Ltd.',
      submittedAt: '10 Mar 2025',
      status: 'Under review',
    },
  ],
  sites: [
    {
      id: 'SITE-001',
      name: 'Riyadh Plant',
      address: 'King Fahd Road, Al Olaya District, Riyadh 12214, Saudi Arabia',
      status: 'Active',
    },
  ],
  contacts: [
    {
      id: 'CTC-001',
      name: 'Sara Ali',
      role: 'Quality Manager',
      email: 'sara@alnoor.example',
      phone: '+966 50 123 4567',
      isPrimary: true,
      hasPortalAccess: true,
      isSignatory: true,
    },
  ],
  documents: [
    {
      id: 'DOC-001',
      name: 'Commercial Registration',
      type: 'Legal',
      lastUpdated: '12 Jan 2024',
    },
    {
      id: 'DOC-002',
      name: 'Organization Profile',
      type: 'General',
      lastUpdated: '05 Feb 2024',
    },
    {
      id: 'DOC-003',
      name: 'Food Safety Policy',
      type: 'Policy',
      lastUpdated: '20 Mar 2024',
    },
  ],
  activeApplication: {
    id: 'APP-0024',
    scheme: 'Food Safety Management',
    status: 'Draft',
    lastUpdated: '12 Mar 2025',
  },
  clarification: {
    required: true,
    applicationId: 'APP-0024',
    message: 'We need additional information to proceed with your application APP-0024.',
    dueDate: '20 Mar 2025',
  },
  upcomingAudit: {
    stage: 'Stage 1 Audit',
    date: '28 Apr 2025',
    location: 'Riyadh, Saudi Arabia',
  },
  documentsSummary: {
    uploadedByYou: 8,
    requestedByUs: 3,
    sharedWithYou: 5,
  },
  recentActivity: [
    {
      id: 'ACT-001',
      date: '12 Mar 2025',
      details: 'You updated the application',
      relatedTo: 'APP-0024',
      type: 'edit',
    },
    {
      id: 'ACT-002',
      date: '10 Mar 2025',
      details: 'Clarification requested by Example CAB',
      relatedTo: 'APP-0024',
      type: 'alert',
    },
    {
      id: 'ACT-003',
      date: '05 Mar 2025',
      details: 'Document uploaded Hygiene Procedure.pdf',
      relatedTo: 'APP-0024',
      type: 'upload',
    },
    {
      id: 'ACT-004',
      date: '03 Mar 2025',
      details: 'Application created',
      relatedTo: 'APP-0024',
      type: 'create',
    },
  ],
  cabContacts: [
    {
      id: 'CAB-01',
      name: 'Omar Hassan',
      role: 'Client Manager',
      email: 'omar.hassan@examplecab.example',
      phone: '+966 11 123 4567',
      initials: 'OH',
    },
    {
      id: 'CAB-02',
      name: 'Maha Al Qahtani',
      role: 'Technical Manager',
      email: 'maha.alqahtani@examplecab.example',
      phone: '+966 11 765 4321',
      initials: 'MQ',
    },
  ],
}

const STORAGE_KEY = 'icasco_portal_client_profile'

export function getStoredPortalProfile(): ClientProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse portal profile:', e)
  }
  return INITIAL_PORTAL_CLIENT
}

export function saveStoredPortalProfile(profile: ClientProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.error('Failed to save portal profile:', e)
  }
}
