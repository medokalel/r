import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { CabWorkflowTourId } from '@/config/cabTourSequence'
import type { TourStepConfig } from '@/context/TourContext'

export type ActiveSidebarSection = 'applicationReview' | 'contacts' | 'offers' | 'invoices' | 'auditPlanning'

interface CabSidebarContextValue {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  tourId?: CabWorkflowTourId
  tourSteps?: TourStepConfig[]
  activeSection: ActiveSidebarSection
  setActiveSection: (section: ActiveSidebarSection) => void
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
  const [expanded, setExpanded] = useState(true)
  const location = useLocation()

  // Initialize from sessionStorage or default to 'applicationReview'
  const [activeSection, setActiveSectionState] = useState<ActiveSidebarSection>(() => {
    const saved = sessionStorage.getItem('icasco_active_sidebar_section')
    if (
      saved === 'contacts' ||
      saved === 'offers' ||
      saved === 'invoices' ||
      saved === 'auditPlanning' ||
      saved === 'applicationReview'
    )
      return saved
    return 'applicationReview'
  })

  // Auto-detect section when navigating into specific module paths
  useEffect(() => {
    if (location.pathname.startsWith('/cab/audit-planning')) {
      setActiveSectionState('auditPlanning')
      sessionStorage.setItem('icasco_active_sidebar_section', 'auditPlanning')
    } else if (location.pathname.startsWith('/cab/invoices') || location.pathname === '/invoices') {
      setActiveSectionState('invoices')
      sessionStorage.setItem('icasco_active_sidebar_section', 'invoices')
    } else if (location.pathname.startsWith('/cab/offers')) {
      setActiveSectionState('offers')
      sessionStorage.setItem('icasco_active_sidebar_section', 'offers')
    } else if (location.pathname.startsWith('/cab/contacts')) {
      setActiveSectionState('contacts')
      sessionStorage.setItem('icasco_active_sidebar_section', 'contacts')
    } else if (
      location.pathname.startsWith('/cab/applications') ||
      location.pathname === '/cab/dashboard' ||
      location.pathname === '/dashboard'
    ) {
      if (!sessionStorage.getItem('icasco_active_sidebar_section')) {
        setActiveSectionState('applicationReview')
      }
    }
  }, [location.pathname])

  const setActiveSection = (section: ActiveSidebarSection) => {
    setActiveSectionState(section)
    sessionStorage.setItem('icasco_active_sidebar_section', section)
  }

  const value = useMemo(
    () => ({
      expanded,
      setExpanded,
      tourId,
      tourSteps,
      activeSection,
      setActiveSection,
    }),
    [expanded, tourId, tourSteps, activeSection]
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
