/**
 * Mock option catalogs for the CAB "Client Registration" form. The backend
 * doesn't expose lookup endpoints for these yet — same approach as
 * cabRegisterApi.ts. Swap for real API calls once the backend ships them.
 */

// TODO: replace with a real lookup once the backend defines organization types
export const ORGANIZATION_TYPE_OPTIONS: string[] = [
  'Private Limited Company',
  'Public Limited Company',
  'Sole Proprietorship',
  'Partnership',
  'Government Entity',
  'Non-Profit Organization',
]

// TODO: replace with a real lookup once the backend defines the industry/sector list
export const INDUSTRY_OPTIONS: string[] = [
  'Manufacturing',
  'Construction',
  'Healthcare',
  'Food & Beverage',
  'Oil & Gas',
  'Textiles',
  'Retail & Trade',
  'Information Technology',
  'Logistics & Transportation',
]

// TODO: replace with a real lookup once the backend defines employee-count bands
export const EMPLOYEE_COUNT_OPTIONS: string[] = ['1 - 10', '11 - 50', '51 - 100', '101 - 500', '501 - 1000', '1000+']

// TODO: replace with a real lookup once the backend defines turnover bands (currency may vary by country)
export const ANNUAL_TURNOVER_OPTIONS: string[] = [
  'Less than 1,000,000',
  '1,000,000 - 10,000,000',
  '10,000,001 - 100,000,000',
  '100,000,001 - 500,000,000',
  'More than 500,000,000',
]