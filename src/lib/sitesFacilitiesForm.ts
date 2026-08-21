export interface SiteContact {
  name: string
  phone: string
  email: string
}

// Everything AddSitePage collects beyond the fields the Sites & Facilities
// table already shows (name/siteType/address/country/activities/employees/
// contact). Parked here as-is until we're told what to surface with it —
// the table intentionally doesn't read this yet.
export interface SiteAdditionalDetails {
  roleInMultiSite: string
  managementSystemType: string
  applicableStandards: string[]
  scopeActivities: string
  travelRequirements: string[]
  permitAccess: string
  estimatedTravelTime: string
  transportationNotes: string
  includeInSampling: boolean
  expectedSamples: string
  typeOfAudit: string
  surveillanceCycle: string
  otherSitesCovered: string[]
  designation: string
}

export interface Site {
  id: string
  name: string
  siteType: string
  address: string
  country: string
  activities: string[]
  employees: number
  contact: SiteContact
  /** Present for sites added via the full AddSitePage; absent for the older modal shape. */
  additionalDetails?: SiteAdditionalDetails
}

export interface SitesFacilitiesForm {
  sites: Site[]
}

export const emptySitesFacilitiesForm: SitesFacilitiesForm = {
  sites: [],
}

/** At least one site gates "Save & Continue". */
export function isSitesFacilitiesComplete(form: SitesFacilitiesForm): boolean {
  return form.sites.length > 0
}