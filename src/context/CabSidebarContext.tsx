import { createContext, useContext, useMemo, useState } from 'react'

interface CabSidebarContextValue {
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
}

const CabSidebarContext = createContext<CabSidebarContextValue | null>(null)

export function CabSidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const value = useMemo(() => ({ expanded, setExpanded }), [expanded])

  return <CabSidebarContext.Provider value={value}>{children}</CabSidebarContext.Provider>
}

export function useCabSidebar() {
  const ctx = useContext(CabSidebarContext)
  if (!ctx) {
    throw new Error('useCabSidebar must be used within CabSidebarProvider')
  }
  return ctx
}
