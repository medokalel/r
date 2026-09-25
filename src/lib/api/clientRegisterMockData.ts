import type { CountryCode } from '@/lib/countries'
import type { ApplicationRegisterStatus } from '@/lib/applicationStatus'

/**
 * Placeholder data for the new "Client Register" page (see WorkspacePage's
 * "Audit Clients" tile). This page has no backend yet — remove this file and
 * wire up a real `listX` API call (same shape as `clientRegistrationApi.ts`)
 * once one exists, and delete `MOCK_CLIENT_REGISTER_ENTRIES` below.
 */
export interface ClientRegisterEntry {
  id: string
  code: string
  name: string
  countryCode: CountryCode
  contactName: string
  contactEmail: string
  applicationNumber: string
  assignedTo: { name: string; avatarUrl?: string }
  status: ApplicationRegisterStatus
  /** Date the client/application record was created — shown as "Date of creation". */
  createdAt: string
}

export const MOCK_CLIENT_REGISTER_ENTRIES: ClientRegisterEntry[] = [
  { id: '1', code: 'CL-0001', name: 'Al Noor Food Industries', countryCode: 'SA', contactName: 'Sara Ali', contactEmail: 'sara@alnoor.example', applicationNumber: 'APP-0024', assignedTo: { name: 'Arjun Verma' }, status: 'DRAFT', createdAt: '2026-04-15' },
  { id: '2', code: 'CL-0002', name: 'Riyadh Cement Co.', countryCode: 'SA', contactName: 'Khalid Al-Mansour', contactEmail: 'khalid@riyadhcement.example', applicationNumber: 'APP-0023', assignedTo: { name: 'Mona Adel' }, status: 'UNDER_REVIEW', createdAt: '2026-04-10' },
  { id: '3', code: 'CL-0003', name: 'Gulf Medical Supplies', countryCode: 'AE', contactName: 'Aisha Hassan', contactEmail: 'aisha@gulfmedical.example', applicationNumber: 'APP-0022', assignedTo: { name: 'Karim Nabil' }, status: 'SUBMITTED', createdAt: '2026-04-08' },
  { id: '4', code: 'CL-0004', name: 'Desert Tech Solutions', countryCode: 'SA', contactName: 'Omar Farouk', contactEmail: 'omar@deserttech.example', applicationNumber: 'APP-0021', assignedTo: { name: 'Huda Saeed' }, status: 'SUBMITTED', createdAt: '2026-04-05' },
  { id: '5', code: 'CL-0005', name: 'Arabian Packaging Co.', countryCode: 'SA', contactName: 'Noura Al-Qahtani', contactEmail: 'noura@arabianpack.example', applicationNumber: 'APP-0020', assignedTo: { name: 'Tariq Al-Otaibi' }, status: 'APPROVED', createdAt: '2026-04-02' },
  { id: '6', code: 'CL-0006', name: 'Red Sea Logistics', countryCode: 'SA', contactName: 'Hassan Ali', contactEmail: 'hassan@redsealog.example', applicationNumber: 'APP-0019', assignedTo: { name: 'Rania Fathy' }, status: 'REJECTED', createdAt: '2026-03-28' },
  { id: '7', code: 'CL-0007', name: 'Green Valley Farms', countryCode: 'AE', contactName: 'Fatima Al-Suwaidi', contactEmail: 'fatima@greenvalley.example', applicationNumber: 'APP-0018', assignedTo: { name: 'Salem Al-Nuaimi' }, status: 'REJECTED', createdAt: '2026-03-25' },
  { id: '8', code: 'CL-0008', name: 'Modern Chemicals', countryCode: 'SA', contactName: 'Yousef Ibrahim', contactEmail: 'yousef@modernchem.example', applicationNumber: 'APP-0017', assignedTo: { name: 'Lubna Al-Harbi' }, status: 'DRAFT', createdAt: '2026-03-20' },
  { id: '9', code: 'CL-0009', name: 'Skyline Trading LLC', countryCode: 'AE', contactName: 'Layla Mansour', contactEmail: 'layla@skylinetrading.example', applicationNumber: 'APP-0016', assignedTo: { name: 'Fahad Al-Marri' }, status: 'UNDER_REVIEW', createdAt: '2026-03-15' },
  { id: '10', code: 'CL-0010', name: 'Al Amal Pharmaceuticals', countryCode: 'SA', contactName: 'Abdullah Kareem', contactEmail: 'abdullah@alamalpharma.example', applicationNumber: 'APP-0015', assignedTo: { name: 'Heba Sami' }, status: 'APPROVED', createdAt: '2026-03-12' },
  { id: '11', code: 'CL-0011', name: 'Nile Steel Works', countryCode: 'EG', contactName: 'Mona Adel', contactEmail: 'mona@nilesteel.example', applicationNumber: 'APP-0014', assignedTo: { name: 'Marwan Al-Zaabi' }, status: 'REJECTED', createdAt: '2026-03-09' },
  { id: '12', code: 'CL-0012', name: 'Pearl Coast Seafood', countryCode: 'QA', contactName: 'Rashid Al-Kaabi', contactEmail: 'rashid@pearlcoast.example', applicationNumber: 'APP-0013', assignedTo: { name: 'Reem Al-Dosari' }, status: 'DRAFT', createdAt: '2026-03-06' },
  { id: '13', code: 'CL-0013', name: 'Falcon Electronics', countryCode: 'AE', contactName: 'Huda Saeed', contactEmail: 'huda@falconelec.example', applicationNumber: 'APP-0012', assignedTo: { name: 'Yasmin Al-Shamsi' }, status: 'UNDER_REVIEW', createdAt: '2026-03-01' },
  { id: '14', code: 'CL-0014', name: 'Oasis Dairy Products', countryCode: 'SA', contactName: 'Tariq Al-Otaibi', contactEmail: 'tariq@oasisdairy.example', applicationNumber: 'APP-0011', assignedTo: { name: 'Noor Al-Sulaiti' }, status: 'SUBMITTED', createdAt: '2026-02-25' },
  { id: '15', code: 'CL-0015', name: 'Cairo Textiles Group', countryCode: 'EG', contactName: 'Rania Fathy', contactEmail: 'rania@cairotextiles.example', applicationNumber: 'APP-0010', assignedTo: { name: 'Karim Nabil' }, status: 'APPROVED', createdAt: '2026-02-20' },
  { id: '16', code: 'CL-0016', name: 'Marina Construction Co.', countryCode: 'AE', contactName: 'Salem Al-Nuaimi', contactEmail: 'salem@marinaconstruct.example', applicationNumber: 'APP-0009', assignedTo: { name: 'Arjun Verma' }, status: 'REJECTED', createdAt: '2026-02-16' },
  { id: '17', code: 'CL-0017', name: 'Jeddah Plastics Industry', countryCode: 'SA', contactName: 'Lubna Al-Harbi', contactEmail: 'lubna@jeddahplastics.example', applicationNumber: 'APP-0008', assignedTo: { name: 'Mona Adel' }, status: 'DRAFT', createdAt: '2026-02-12' },
  { id: '18', code: 'CL-0018', name: 'Doha Facilities Management', countryCode: 'QA', contactName: 'Fahad Al-Marri', contactEmail: 'fahad@dohafm.example', applicationNumber: 'APP-0007', assignedTo: { name: 'Huda Saeed' }, status: 'UNDER_REVIEW', createdAt: '2026-02-08' },
  { id: '19', code: 'CL-0019', name: 'Alexandria Shipping Lines', countryCode: 'EG', contactName: 'Heba Sami', contactEmail: 'heba@alexshipping.example', applicationNumber: 'APP-0006', assignedTo: { name: 'Tariq Al-Otaibi' }, status: 'SUBMITTED', createdAt: '2026-02-03' },
  { id: '20', code: 'CL-0020', name: 'Emirates Cold Storage', countryCode: 'AE', contactName: 'Marwan Al-Zaabi', contactEmail: 'marwan@emiratescold.example', applicationNumber: 'APP-0005', assignedTo: { name: 'Rania Fathy' }, status: 'APPROVED', createdAt: '2026-01-29' },
  { id: '21', code: 'CL-0021', name: 'Dammam Steel Fabrication', countryCode: 'SA', contactName: 'Reem Al-Dosari', contactEmail: 'reem@dammamsteel.example', applicationNumber: 'APP-0004', assignedTo: { name: 'Salem Al-Nuaimi' }, status: 'REJECTED', createdAt: '2026-01-24' },
  { id: '22', code: 'CL-0022', name: 'Giza Agro Exports', countryCode: 'EG', contactName: 'Karim Nabil', contactEmail: 'karim@gizaagro.example', applicationNumber: 'APP-0003', assignedTo: { name: 'Lubna Al-Harbi' }, status: 'DRAFT', createdAt: '2026-01-18' },
  { id: '23', code: 'CL-0023', name: 'Lusail Energy Services', countryCode: 'QA', contactName: 'Noor Al-Sulaiti', contactEmail: 'noor@lusailenergy.example', applicationNumber: 'APP-0002', assignedTo: { name: 'Fahad Al-Marri' }, status: 'UNDER_REVIEW', createdAt: '2026-01-14' },
  { id: '24', code: 'CL-0024', name: 'Sharjah Building Materials', countryCode: 'AE', contactName: 'Yasmin Al-Shamsi', contactEmail: 'yasmin@sharjahbm.example', applicationNumber: 'APP-0001', assignedTo: { name: 'Heba Sami' }, status: 'REJECTED', createdAt: '2026-01-10' },
]