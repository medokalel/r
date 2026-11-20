/**
 * Sample data for the audit checklists page, used until a backend endpoint
 * exists (same approach as `travelPolicyMockData` and `walletMockData`).
 *
 * `loadAuditChecklistsMock` mimics the async call the page will make: the two
 * library files are imported lazily so they stay out of the main bundle.
 * Replace its body with the real request when the endpoint is ready.
 */
import { copyChecklist, libraryFileToChecklist } from '@/lib/auditChecklistForm'
import type { AuditChecklist, LibraryChecklistFile } from '@/lib/auditChecklistTypes'

export interface AuditChecklistsData {
  /** Read-only checklists that ship with the platform. */
  library: AuditChecklist[]
  /** The CAB's own editable checklists. */
  mine: AuditChecklist[]
}

const STORAGE_KEY = 'icasco_cab_audit_checklists_v1'
const MOCK_LATENCY_MS = 120

function sampleCustomChecklist(): AuditChecklist {
  return {
    id: 'cab-checklist-halal',
    source: 'cab',
    kind: 'CUSTOM',
    status: 'ARCHIVED',
    isDefault: false,
    reviewStatus: null,
    reviewNote: null,
    standardCode: 'HALAL',
    standardLabel: 'Halal scheme (sample)',
    name: 'Halal scheme checklist',
    nameAr: 'قائمة تحقق مخطط الحلال',
    description: 'Sample checklist created by the CAB for its own scheme.',
    version: '1',
    items: [
      {
        id: 'cab-checklist-halal:1',
        code: 'HAL-01',
        clause: 'H.1',
        title: 'Halal policy',
        titleAr: 'سياسة الحلال',
        requirement: 'The organization has a documented halal policy approved by top management.',
        requirementAr: 'لدى المنظمة سياسة حلال موثقة معتمدة من الإدارة العليا.',
        guidance: 'Check the approval date and that the policy is communicated to staff.',
        guidanceAr: 'تحقق من تاريخ الاعتماد ومن إبلاغ العاملين بالسياسة.',
        evidencePrompts: ['Signed halal policy'],
        evidencePromptsAr: ['سياسة الحلال الموقعة'],
        samplingHint: '',
        samplingHintAr: '',
        stages: ['stage1', 'stage2'],
        mandatory: true,
        common: false,
      },
      {
        id: 'cab-checklist-halal:2',
        code: 'HAL-02',
        clause: 'H.2',
        title: 'Halal supply chain',
        titleAr: 'سلسلة إمداد الحلال',
        requirement: 'Ingredients and suppliers are approved and traceable to halal certificates.',
        requirementAr: 'المكونات والموردون معتمدون ويمكن تتبعهم إلى شهادات حلال.',
        guidance: 'Trace a sample of ingredients back to the supplier certificate.',
        guidanceAr: 'تتبع عينة من المكونات وصولاً إلى شهادة المورد.',
        evidencePrompts: ['Approved supplier list', 'Supplier halal certificates'],
        evidencePromptsAr: ['قائمة الموردين المعتمدين', 'شهادات الحلال للموردين'],
        samplingHint: 'Sample at least five ingredients.',
        samplingHintAr: 'خذ عينة من خمسة مكونات على الأقل.',
        stages: ['stage2', 'surveillance'],
        mandatory: true,
        common: false,
      },
    ],
  }
}

function loadStoredCabChecklists(): AuditChecklist[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AuditChecklist[]) : null
  } catch {
    return null
  }
}

export function saveCabChecklistsMock(mine: AuditChecklist[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mine))
  } catch {
    // ignore quota errors in mock mode
  }
}

export async function loadAuditChecklistsMock(): Promise<AuditChecklistsData> {
  const modules = await Promise.all([
    import('@/lib/api/auditChecklistLibrary/iso-9001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-14001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-45001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-22000.json'),
    import('@/lib/api/auditChecklistLibrary/iso-27001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-50001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-22301.json'),
    import('@/lib/api/auditChecklistLibrary/iso-13485.json'),
    import('@/lib/api/auditChecklistLibrary/iso-37001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-20000-1.json'),
    import('@/lib/api/auditChecklistLibrary/iso-39001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-41001.json'),
    import('@/lib/api/auditChecklistLibrary/iso-21001.json'),
    import('@/lib/api/auditChecklistLibrary/ims-common.json'),
    import('@/lib/api/auditChecklistLibrary/stage1-readiness.json'),
  ])
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const library = modules.map((mod) =>
    libraryFileToChecklist(mod.default as unknown as LibraryChecklistFile)
  )

  const storedMine = loadStoredCabChecklists()
  if (storedMine) {
    return { library, mine: storedMine }
  }

  const stage1Template = library.find((c) => c.id === 'stage1-readiness') ?? library[library.length - 1]
  const stage1Copy = copyChecklist(stage1Template, { en: '(our version)', ar: '(نسختنا)' })
  const mine: AuditChecklist[] = [
    { ...stage1Copy, id: 'cab-checklist-stage1', isDefault: true, items: stage1Copy.items },
    sampleCustomChecklist(),
  ]
  saveCabChecklistsMock(mine)

  return { library, mine }
}

/**
 * Finds matching checklists (CAB defaults first, then library) for a given audit plan standard & stage.
 */
export function matchChecklistsForAuditPlan(
  allChecklists: AuditChecklist[],
  standardName: string,
  stage: string
): AuditChecklist[] {
  const active = allChecklists.filter((c) => c.status === 'ACTIVE')
  const normalizedStd = standardName.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const matched: AuditChecklist[] = []

  // Stage 1 always includes the CAB default Stage 1 readiness checklist (or library fallback)
  if (stage.toLowerCase().includes('stage 1')) {
    const s1 =
      active.find((c) => c.source === 'cab' && c.kind === 'STAGE1_READINESS' && c.isDefault) ??
      active.find((c) => c.kind === 'STAGE1_READINESS')
    if (s1) matched.push(s1)
  }

  // Match standard by code digits/prefix (e.g. "22000", "9001", "27001", "200001")
  const cabDefaultForStd = active.find((c) => {
    if (c.source !== 'cab' || !c.isDefault) return false
    const codeDigits = c.standardCode.replace(/[^A-Z0-9]/g, '')
    return codeDigits && normalizedStd.includes(codeDigits.replace('ISO', ''))
  })

  if (cabDefaultForStd) {
    matched.push(cabDefaultForStd)
  } else {
    const libForStd = active.find((c) => {
      if (c.source !== 'library' || c.kind === 'STAGE1_READINESS') return false
      const codeToken = c.standardCode.replace(/^ISO_?/, '').replace(/[^A-Z0-9]/g, '')
      return codeToken.length >= 3 && normalizedStd.includes(codeToken)
    })
    if (libForStd) matched.push(libForStd)
  }

  return matched
}
