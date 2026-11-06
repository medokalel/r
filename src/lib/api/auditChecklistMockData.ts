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

const MOCK_LATENCY_MS = 250

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

export async function loadAuditChecklistsMock(): Promise<AuditChecklistsData> {
  const [iso9001, stage1] = await Promise.all([
    import('@/lib/api/auditChecklistLibrary/iso-9001.json'),
    import('@/lib/api/auditChecklistLibrary/stage1-readiness.json'),
  ])
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const library = [
    libraryFileToChecklist(iso9001.default as unknown as LibraryChecklistFile),
    libraryFileToChecklist(stage1.default as unknown as LibraryChecklistFile),
  ]

  const stage1Copy = copyChecklist(library[1], { en: '(our version)', ar: '(نسختنا)' })
  const mine: AuditChecklist[] = [
    { ...stage1Copy, id: 'cab-checklist-stage1', isDefault: true, items: stage1Copy.items },
    sampleCustomChecklist(),
  ]

  return { library, mine }
}
