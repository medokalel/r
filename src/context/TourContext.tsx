import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { CAB_DASHBOARD_TOUR_STEPS } from '@/config/cabTourSteps'
import { getAuthSession } from '@/lib/authStorage'

export const TOUR_STATUS_KEY = 'icasco_tour_status'
export const TOUR_PENDING_KEY = 'icasco_pending_tour'

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
  goToStep: (stepNumber: number) => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

function getUserStatusKey(): string {
  const session = getAuthSession()
  const id = session?.organization?.id || session?.user?.id
  return id ? `${TOUR_STATUS_KEY}_${id}` : TOUR_STATUS_KEY
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isTourActive, setIsTourActive] = useState<boolean>(false)
  const [isSkipped, setIsSkipped] = useState<boolean>(false)

  useEffect(() => {
    const isPending = localStorage.getItem(TOUR_PENDING_KEY) === 'true'
    const statusKey = getUserStatusKey()
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
        localStorage.removeItem(TOUR_PENDING_KEY)
      }
      setCurrentStepIndex(0)
      setIsTourActive(true)
      setIsSkipped(false)
    }
  }, [])

  const activeStepConfig = CAB_DASHBOARD_TOUR_STEPS[currentStepIndex]
  const activeStepId = isTourActive && activeStepConfig ? activeStepConfig.id : null

  const nextStep = () => {
    if (currentStepIndex < CAB_DASHBOARD_TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      setIsTourActive(false)
      setIsSkipped(true)
      const statusKey = getUserStatusKey()
      localStorage.setItem(statusKey, 'completed')
      localStorage.setItem(TOUR_STATUS_KEY, 'completed')
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
    const statusKey = getUserStatusKey()
    localStorage.setItem(statusKey, 'skipped')
    localStorage.setItem(TOUR_STATUS_KEY, 'skipped')
  }

  const startTour = () => {
    setCurrentStepIndex(0)
    setIsTourActive(true)
    setIsSkipped(false)
  }

  const goToStep = (stepNumber: number) => {
    const index = CAB_DASHBOARD_TOUR_STEPS.findIndex((s) => s.step === stepNumber)
    if (index !== -1) {
      setCurrentStepIndex(index)
      setIsTourActive(true)
      setIsSkipped(false)
    }
  }

  return (
    <TourContext.Provider
      value={{
        currentStepIndex,
        activeStepId,
        totalSteps: CAB_DASHBOARD_TOUR_STEPS.length,
        isTourActive,
        isSkipped,
        nextStep,
        prevStep,
        skipTour,
        startTour,
        goToStep,
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


