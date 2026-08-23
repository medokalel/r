import type { Site } from '@/lib/sitesFacilitiesForm'

export type MultiSiteStructureType = 'SINGLE_SITE' | 'INTEGRATED_MULTI_SITE' | 'SEPARATE_MULTI_SITE'

export const MULTI_SITE_STRUCTURE_OPTIONS: { value: MultiSiteStructureType; label: string }[] = [
  { value: 'SINGLE_SITE', label: 'Single site' },
  { value: 'INTEGRATED_MULTI_SITE', label: 'Integrated Multi-site' },
  { value: 'SEPARATE_MULTI_SITE', label: 'Separate Multi-site' },
]

// Central functions a head office can run on behalf of every site — these
// are the activities IAF MD 1 lets an auditor sample once at the head
// office instead of re-checking at each satellite.
export const CENTRAL_FUNCTION_OPTIONS = [
  'Top Management',
  'Internal Audit',
  'Management Review',
  'Document Control',
  'Corrective Action Process',
  'Purchasing / Supplier Control',
]

export const APPLICABLE_RULE_OPTIONS = [{ value: 'IAF_MD1_2023', label: 'IAF MD 1:2023 (Multi-site Organizations)' }]

export const MANDAYS_MODEL_OPTIONS = [{ value: 'SAMPLING', label: 'Sampling Method' }]

export interface MultiSiteConsiderations {
  /** All sites share the same certification scope, so satellite sites can be sampled instead of each fully audited. */
  sameScopeDevelopment: boolean
  /** Head office's central functions count once instead of being re-checked per site. */
  includeHeadOfficeFunctions: boolean
  /** Add mandays for sites that need flights/permits to reach. */
  calculateTravelPermitCosts: boolean
}

export const emptyMultiSiteConsiderations: MultiSiteConsiderations = {
  sameScopeDevelopment: true,
  includeHeadOfficeFunctions: true,
  calculateTravelPermitCosts: true,
}

export interface MultiSiteRuleForm {
  structureType: MultiSiteStructureType
  headOfficeSiteId: string
  centralFunctions: string[]
  applicableRule: string
  mandaysModel: string
  considerations: MultiSiteConsiderations
}

export const emptyMultiSiteRuleForm: MultiSiteRuleForm = {
  structureType: 'INTEGRATED_MULTI_SITE',
  headOfficeSiteId: '',
  centralFunctions: [],
  applicableRule: 'IAF_MD1_2023',
  mandaysModel: 'SAMPLING',
  considerations: emptyMultiSiteConsiderations,
}

export function isMultiSiteRuleFormComplete(form: MultiSiteRuleForm): boolean {
  return Boolean(form.headOfficeSiteId && form.applicableRule && form.mandaysModel)
}

/** Result of applying the rule — stored on SitesFacilitiesForm once the user
 *  saves, so the Sites & Facilities table can render the summary cards
 *  without recomputing on every render. */
export interface MultiSiteRuleResult {
  form: MultiSiteRuleForm
  sampledSatelliteSiteIds: string[]
  totalBaseMandays: number
  samplingAdjustment: number
  travelPermitAdjustment: number
  totalEstimatedMandays: number
}

/** Simplified banding loosely modeled on the mandays-by-headcount tables
 *  used across IAF-aligned certification schemes (e.g. IAF MD 5). This is a
 *  planning estimate for this screen, not a certified audit-duration
 *  calculator — an auditor still has final say on actual mandays. */
function baseMandaysForSite(site: Site): number {
  const employees = site.employees || 0
  if (employees <= 25) return 1
  if (employees <= 45) return 1.5
  if (employees <= 65) return 2
  if (employees <= 85) return 2.5
  if (employees <= 125) return 3
  if (employees <= 175) return 3.5
  if (employees <= 275) return 4
  if (employees <= 425) return 4.5
  if (employees <= 625) return 5
  if (employees <= 875) return 5.5
  return 6
}

/** IAF MD 1's square-root sampling rule: only √n satellite sites need a
 *  physical visit this cycle, rounded up, with at least one always sampled. */
function sampleSize(satelliteCount: number): number {
  if (satelliteCount <= 0) return 0
  return Math.max(1, Math.ceil(Math.sqrt(satelliteCount)))
}

export function calculateMandays(sites: Site[], form: MultiSiteRuleForm): MultiSiteRuleResult {
  const headOffice = sites.find((s) => s.id === form.headOfficeSiteId)
  const satellites = sites.filter((s) => s.id !== form.headOfficeSiteId)

  const totalBaseMandays = sites.reduce((sum, s) => sum + baseMandaysForSite(s), 0)

  // Which satellites actually get visited this cycle: sites the CAB already
  // flagged for sampling (additionalDetails.includeInSampling) take
  // priority; if fewer than the required sample size are flagged, fill the
  // rest in list order so the sample size requirement is still met.
  let sampledSatelliteSiteIds: string[] = []
  let samplingAdjustment = 0
  if (form.considerations.sameScopeDevelopment && satellites.length > 0) {
    const requiredSampleSize = Math.min(satellites.length, sampleSize(satellites.length))
    const flagged = satellites.filter((s) => s.additionalDetails?.includeInSampling)
    const rest = satellites.filter((s) => !s.additionalDetails?.includeInSampling)
    const sampled = [...flagged, ...rest].slice(0, requiredSampleSize)
    sampledSatelliteSiteIds = sampled.map((s) => s.id)

    // Sites not sampled this cycle still get a lighter desk/document review
    // rather than a full visit, credited back at half their base mandays.
    const unsampled = satellites.filter((s) => !sampledSatelliteSiteIds.includes(s.id))
    samplingAdjustment = -(unsampled.reduce((sum, s) => sum + baseMandaysForSite(s), 0) * 0.5)
  } else {
    sampledSatelliteSiteIds = satellites.map((s) => s.id)
  }

  // Head office central functions already covered once at the head office
  // don't need re-checking at every sampled satellite.
  if (form.considerations.includeHeadOfficeFunctions && headOffice && form.centralFunctions.length > 0) {
    samplingAdjustment -= 0.5 * sampledSatelliteSiteIds.length
  }

  let travelPermitAdjustment = 0
  if (form.considerations.calculateTravelPermitCosts) {
    const visitedSites = headOffice ? [headOffice, ...sites.filter((s) => sampledSatelliteSiteIds.includes(s.id))] : sites
    for (const site of visitedSites) {
      const details = site.additionalDetails
      if (!details) continue
      if (details.travelRequirements.length > 0) travelPermitAdjustment += 0.5
      if (details.permitAccess) travelPermitAdjustment += 0.5
    }
  }

  const totalEstimatedMandays = Math.max(
    0,
    totalBaseMandays + samplingAdjustment + travelPermitAdjustment
  )

  return {
    form,
    sampledSatelliteSiteIds,
    totalBaseMandays,
    samplingAdjustment,
    travelPermitAdjustment,
    totalEstimatedMandays,
  }
}