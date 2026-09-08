import {
  markTourPending,
  getTourUserKey,
  getTourStatusKey,
  setTourStatus,
} from '@/context/TourContext'

export const CAB_WORKFLOW_TOUR_IDS = [
  'cab-dashboard',
  'cab-client-registration',
  'cab-application-draft',
  'cab-application-receipt',
  'cab-application-review',
  'cab-application-information-required',
  'cab-application-technical-feasibility',
  'cab-application-quotation',
  'cab-quotation-approval',
] as const

export type CabWorkflowTourId = (typeof CAB_WORKFLOW_TOUR_IDS)[number]

export const CAB_TOUR_NEXT_ROUTE: Partial<Record<CabWorkflowTourId, string>> = {
  'cab-dashboard': '/cab/clients/new',
  'cab-client-registration': '/cab/applications/draft',
  'cab-application-draft': '/cab/applications/receipt',
  'cab-application-receipt': '/cab/applications/review',
  'cab-application-review': '/cab/applications/information-required',
  'cab-application-information-required': '/cab/applications/technical-feasibility',
  'cab-application-technical-feasibility': '/cab/applications/quotation',
  'cab-application-quotation': '/cab/quotations/approval',
}

const TOUR_PENDING_KEY_PREFIX = 'icasco_pending_tour'

export function isCabWorkflowTour(tourId: string): tourId is CabWorkflowTourId {
  return (CAB_WORKFLOW_TOUR_IDS as readonly string[]).includes(tourId)
}

export function getNextCabTourId(current: CabWorkflowTourId): CabWorkflowTourId | null {
  const idx = CAB_WORKFLOW_TOUR_IDS.indexOf(current)
  if (idx === -1 || idx >= CAB_WORKFLOW_TOUR_IDS.length - 1) return null
  return CAB_WORKFLOW_TOUR_IDS[idx + 1]!
}

/** Call when CAB onboarding finishes so the dashboard tour auto-starts on first visit. */
export function markCabWorkflowTourPending(): void {
  markTourPending('cab-dashboard')
}

/** Clears all CAB workflow tour progress for the current browser session user. */
export function resetCabWorkflowTour(): void {
  const userKey = getTourUserKey()
  for (const tourId of CAB_WORKFLOW_TOUR_IDS) {
    localStorage.removeItem(`${TOUR_PENDING_KEY_PREFIX}_${tourId}`)
    localStorage.removeItem(getTourStatusKey(tourId))
    if (userKey) {
      localStorage.removeItem(`icasco_tour_status_${tourId}_${userKey}`)
    }
    localStorage.removeItem(`icasco_tour_status_${tourId}`)
  }
}

export function skipRemainingCabWorkflowTours(fromTourId: CabWorkflowTourId): void {
  const startIdx = CAB_WORKFLOW_TOUR_IDS.indexOf(fromTourId)
  if (startIdx === -1) return
  for (let i = startIdx; i < CAB_WORKFLOW_TOUR_IDS.length; i++) {
    const tourId = CAB_WORKFLOW_TOUR_IDS[i]!
    localStorage.removeItem(`${TOUR_PENDING_KEY_PREFIX}_${tourId}`)
    setTourStatus(tourId, 'skipped')
  }
}

// Re-export for CabTourProvider
export { markTourPending }
