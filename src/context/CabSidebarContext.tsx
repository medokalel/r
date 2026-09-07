import { createContext, useContext, useMemo, useState } from 'react'
import type { CabWorkflowTourId } from '@/config/cabTourSequence'
import type { TourStepConfig } from '@/context/TourContext'

interface CabSidebarContextValue {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  tourId?: CabWorkflowTourId
  tourSteps?: TourStepConfig[]
}

const CabSidebarContext = createContext<CabSidebarContextValue | null>(null)

export function CabSidebarProvider({
  children,
  tourId,
  tourSteps,
}: {
  children: React.ReactNode
  tourId?: CabWorkflowTourId
  tourSteps?: TourStepConfig[]
}) {
  const [expanded, setExpanded] = useState(false)
  const value = useMemo(
    () => ({ expanded, setExpanded, tourId, tourSteps }),
    [expanded, tourId, tourSteps]
  )

  return <CabSidebarContext.Provider value={value}>{children}</CabSidebarContext.Provider>
}

export function useCabSidebar() {
  const ctx = useContext(CabSidebarContext)
  if (!ctx) {
    throw new Error('useCabSidebar must be used within CabSidebarProvider')
  }
  return ctx
}
