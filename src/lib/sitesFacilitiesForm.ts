export interface SiteContact {
  name: string
  phone: string
  email: string
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