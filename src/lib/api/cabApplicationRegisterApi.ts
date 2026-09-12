/*
 * No backend endpoint exists yet for the CAB application list, so this is
 * only listCabApplications' body needs to change to call `authorizedClient`;
 * CabApplicationRegisterPage itself needs no edits.
 */

export type ApplicationRegisterStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'ASSESSMENT'
  | 'APPROVED'
  | 'IN_PROGRESS'

export interface ApplicationRegisterItem {
  id: string
  applicationCode: string
  clientCode: string
  clientName: string
  standards: string[]
  status: ApplicationRegisterStatus
  /** ISO 3166-1 alpha-2 code, matched against getCountryOptions(). */
  countryCode: string
  updatedAt: string
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_APPLICATIONS: ApplicationRegisterItem[] = [
  { id: '24', applicationCode: 'APP-0024', clientCode: 'CL-0001', clientName: 'Al Noor Food Industries', standards: ['ISO 9001'], status: 'DRAFT', countryCode: 'SA', updatedAt: '2025-04-15T10:24:00Z' },
  { id: '23', applicationCode: 'APP-0023', clientCode: 'CL-0005', clientName: 'Riyadh Packaging Co.', standards: ['ISO 22000'], status: 'UNDER_REVIEW', countryCode: 'SA', updatedAt: '2025-04-14T16:12:00Z' },
  { id: '22', applicationCode: 'APP-0022', clientCode: 'CL-0003', clientName: 'Green Fields Trading', standards: ['ISO 14001'], status: 'ASSESSMENT', countryCode: 'EG', updatedAt: '2025-04-12T11:03:00Z' },
  { id: '21', applicationCode: 'APP-0021', clientCode: 'CL-0004', clientName: 'Desert Chemicals Ltd.', standards: ['ISO 45001'], status: 'ASSESSMENT', countryCode: 'AE', updatedAt: '2025-04-10T09:41:00Z' },
  { id: '20', applicationCode: 'APP-0020', clientCode: 'CL-0002', clientName: 'Red Sea Logistics', standards: ['ISO 9001'], status: 'APPROVED', countryCode: 'SA', updatedAt: '2025-04-08T14:27:00Z' },
  { id: '19', applicationCode: 'APP-0019', clientCode: 'CL-0006', clientName: 'Arabian Metal Works', standards: ['ISO 9001', 'ISO 14001'], status: 'IN_PROGRESS', countryCode: 'AE', updatedAt: '2025-04-07T13:18:00Z' },
  { id: '18', applicationCode: 'APP-0018', clientCode: 'CL-0007', clientName: 'Najd Construction', standards: ['ISO 45001'], status: 'IN_PROGRESS', countryCode: 'SA', updatedAt: '2025-04-05T10:56:00Z' },
  { id: '17', applicationCode: 'APP-0017', clientCode: 'CL-0008', clientName: 'Eastern Medical Supplies', standards: ['ISO 13485'], status: 'DRAFT', countryCode: 'QA', updatedAt: '2025-04-02T15:32:00Z' },
  { id: '16', applicationCode: 'APP-0016', clientCode: 'CL-0009', clientName: 'Horizon Tech Solutions', standards: ['ISO 27001'], status: 'UNDER_REVIEW', countryCode: 'JO', updatedAt: '2025-03-30T12:11:00Z' },
  { id: '15', applicationCode: 'APP-0015', clientCode: 'CL-0010', clientName: 'Sunrise Textiles', standards: ['ISO 9001'], status: 'APPROVED', countryCode: 'EG', updatedAt: '2025-03-28T09:07:00Z' },
  { id: '14', applicationCode: 'APP-0014', clientCode: 'CL-0011', clientName: 'Gulf Cold Storage', standards: ['ISO 22000'], status: 'IN_PROGRESS', countryCode: 'KW', updatedAt: '2025-03-25T08:44:00Z' },
  { id: '13', applicationCode: 'APP-0013', clientCode: 'CL-0012', clientName: 'Nile Valley Foods', standards: ['ISO 22000', 'ISO 9001'], status: 'ASSESSMENT', countryCode: 'EG', updatedAt: '2025-03-22T17:02:00Z' },
  { id: '12', applicationCode: 'APP-0012', clientCode: 'CL-0013', clientName: 'Falcon Petrochemicals', standards: ['ISO 45001'], status: 'DRAFT', countryCode: 'AE', updatedAt: '2025-03-20T14:15:00Z' },
  { id: '11', applicationCode: 'APP-0011', clientCode: 'CL-0014', clientName: 'Amman Steel Industries', standards: ['ISO 9001'], status: 'UNDER_REVIEW', countryCode: 'JO', updatedAt: '2025-03-18T10:29:00Z' },
  { id: '10', applicationCode: 'APP-0010', clientCode: 'CL-0015', clientName: 'Doha Precision Tools', standards: ['ISO 9001', 'ISO 45001'], status: 'APPROVED', countryCode: 'QA', updatedAt: '2025-03-15T09:18:00Z' },
  { id: '9', applicationCode: 'APP-0009', clientCode: 'CL-0016', clientName: 'Cairo Pharma Group', standards: ['ISO 13485'], status: 'IN_PROGRESS', countryCode: 'EG', updatedAt: '2025-03-12T16:47:00Z' },
  { id: '8', applicationCode: 'APP-0008', clientCode: 'CL-0017', clientName: 'Kuwait Marine Services', standards: ['ISO 14001'], status: 'ASSESSMENT', countryCode: 'KW', updatedAt: '2025-03-10T11:26:00Z' },
  { id: '7', applicationCode: 'APP-0007', clientCode: 'CL-0018', clientName: 'Jeddah Plastics Co.', standards: ['ISO 9001'], status: 'DRAFT', countryCode: 'SA', updatedAt: '2025-03-07T13:52:00Z' },
  { id: '6', applicationCode: 'APP-0006', clientCode: 'CL-0019', clientName: 'Amman Dairy Products', standards: ['ISO 22000'], status: 'UNDER_REVIEW', countryCode: 'JO', updatedAt: '2025-03-05T09:39:00Z' },
  { id: '5', applicationCode: 'APP-0005', clientCode: 'CL-0020', clientName: 'Abu Dhabi Electronics', standards: ['ISO 27001', 'ISO 9001'], status: 'APPROVED', countryCode: 'AE', updatedAt: '2025-03-02T15:04:00Z' },
  { id: '4', applicationCode: 'APP-0004', clientCode: 'CL-0021', clientName: 'Qatar Building Materials', standards: ['ISO 45001'], status: 'IN_PROGRESS', countryCode: 'QA', updatedAt: '2025-02-27T10:11:00Z' },
  { id: '3', applicationCode: 'APP-0003', clientCode: 'CL-0022', clientName: 'Alexandria Shipping Lines', standards: ['ISO 9001'], status: 'DRAFT', countryCode: 'EG', updatedAt: '2025-02-24T08:57:00Z' },
  { id: '2', applicationCode: 'APP-0002', clientCode: 'CL-0023', clientName: 'Kuwait Food Trading', standards: ['ISO 22000'], status: 'ASSESSMENT', countryCode: 'KW', updatedAt: '2025-02-20T14:33:00Z' },
  { id: '1', applicationCode: 'APP-0001', clientCode: 'CL-0024', clientName: 'Riyadh Data Centers', standards: ['ISO 27001'], status: 'APPROVED', countryCode: 'SA', updatedAt: '2025-02-18T12:05:00Z' },
  { id: '28', applicationCode: 'APP-0028', clientCode: 'CL-0025', clientName: 'Sharjah Aluminium Co.', standards: ['ISO 9001', 'ISO 45001'], status: 'IN_PROGRESS', countryCode: 'AE', updatedAt: '2025-05-01T09:20:00Z' },
  { id: '27', applicationCode: 'APP-0027', clientCode: 'CL-0026', clientName: 'Zarqa Cement Industries', standards: ['ISO 14001'], status: 'DRAFT', countryCode: 'JO', updatedAt: '2025-04-28T11:41:00Z' },
  { id: '26', applicationCode: 'APP-0026', clientCode: 'CL-0027', clientName: 'Mansoura Agro Exports', standards: ['ISO 22000'], status: 'UNDER_REVIEW', countryCode: 'EG', updatedAt: '2025-04-22T15:09:00Z' },
  { id: '25', applicationCode: 'APP-0025', clientCode: 'CL-0028', clientName: 'Salalah Free Zone Traders', standards: ['ISO 9001'], status: 'ASSESSMENT', countryCode: 'QA', updatedAt: '2025-04-18T13:26:00Z' },
]

export function listCabApplications(): Promise<ApplicationRegisterItem[]> {
  return delay().then(() => MOCK_APPLICATIONS)
}