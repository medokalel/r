import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getAuthSession } from '@/lib/authStorage'

export interface TourStepConfig {
  id: string
  step: number
  totalSteps: number
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** Radix Popover alignOffset — nudges the popover along the alignment axis, RTL-aware. */
  alignOffset?: number
}

const TOUR_STATUS_KEY_PREFIX = 'icasco_tour_status'
const TOUR_PENDING_KEY_PREFIX = 'icasco_pending_tour'

/**
 * Call this from wherever a tour's onboarding flow finishes, so the tour
 * auto-starts the first time the user lands on the page it belongs to.
 * `tourId` must match the `tourId` passed to that page's <TourProvider>.
 */
export function markTourPending(tourId: string): void {
  localStorage.setItem(`${TOUR_PENDING_KEY_PREFIX}_${tourId}`, 'true')
}

interface TourContextType {
  currentStepIndex: number
  activeStepId: string | null
  totalSteps: number
  isTourActive: boolean
  isSkipped: boolean
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  startTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

interface TourProviderProps {
  /** Unique id for this tour (e.g. 'cab-dashboard', 'auditee-dashboard'). Namespaces its storage keys. */
  tourId: string
  /** Ordered steps this tour walks through. */
  steps: TourStepConfig[]
  children: ReactNode
}

export function TourProvider({ tourId, steps, children }: TourProviderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isTourActive, setIsTourActive] = useState<boolean>(false)
  const [isSkipped, setIsSkipped] = useState<boolean>(false)

  const pendingKey = `${TOUR_PENDING_KEY_PREFIX}_${tourId}`

  const getStatusKey = (): string => {
    const session = getAuthSession()
    const id = session?.organization?.id || session?.user?.id
    const base = `${TOUR_STATUS_KEY_PREFIX}_${tourId}`
    return id ? `${base}_${id}` : base
  }

  useEffect(() => {
    const isPending = localStorage.getItem(pendingKey) === 'true'
    const statusKey = getStatusKey()
    const status = localStorage.getItem(statusKey)

    // Rule 2 & 3: If THIS user explicitly clicked Skip or Completed, NEVER show again for this user (even after Logout + Login)
    if (status === 'skipped' || status === 'completed') {
      setIsTourActive(false)
      setIsSkipped(true)
      return
    }

    // Rule 1 & 4: If new registration OR user hasn't skipped/completed yet (status is null), show tour!
    if (isPending || !status) {
      if (isPending) {
        localStorage.removeItem(pendingKey)
      }
      setCurrentStepIndex(0)
      setIsTourActive(true)
      setIsSkipped(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId])

  const activeStepConfig = steps[currentStepIndex]
  const activeStepId = isTourActive && activeStepConfig ? activeStepConfig.id : null

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      setIsTourActive(false)
      setIsSkipped(true)
      localStorage.setItem(getStatusKey(), 'completed')
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const skipTour = () => {
    setIsTourActive(false)
    setIsSkipped(true)
    localStorage.setItem(getStatusKey(), 'skipped')
  }

  const startTour = () => {
    setCurrentStepIndex(0)
    setIsTourActive(true)
    setIsSkipped(false)
  }

  return (
    <TourContext.Provider
      value={{
        currentStepIndex,
        activeStepId,
        totalSteps: steps.length,
        isTourActive,
        isSkipped,
        nextStep,
        prevStep,
        skipTour,
        startTour,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

/**
 * Same context, but returns `undefined` instead of throwing when there's no
 * TourProvider above. For components reused across many pages (e.g. a shared
 * header) where only some of those pages actually run a tour — lets them
 * render a "take the tour" affordance only where one exists.
 */
export function useOptionalTour(): TourContextType | undefined {
  return useContext(TourContext)
}