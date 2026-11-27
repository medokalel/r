/**
 * Pure view-model builder for the CAB Impartiality register page.
 *
 * Zero-import module on purpose: the unit tests load it through the
 * transpile-and-VM harness used by the other lib tests (tests/*.test.mjs),
 * which only injects Date/Math into the sandbox.
 *
 * Data comes from the existing sources only:
 *   - getCabImpartialityRegister() (real backend register endpoint)
 *   - listTeamExceptions() (team-selection exceptions store)
 *   - team-selection settings (coolingOffMonths, default 24)
 */

export type ImpartialityDeclarationState = 'valid' | 'missing' | 'expired'

/** blocking = ongoing; coolingOff = ended but still inside the cooling-off window (needs review); clear = ended and outside the window. */
export type ImpartialityRelationshipClass = 'blocking' | 'coolingOff' | 'clear'

export interface ImpartialityDeclarationLike {
  id?: string | null
  answer?: string | null
  signedBy?: string | null
  signedAt?: string | null
  validUntil?: string | null
  isActive?: boolean | null
}

export interface ImpartialityRelationshipLike {
  id?: string | null
  clientId?: string | null
  client?: { id: string; name: string } | null
  relationshipType?: string | null
  description?: string | null
  startDate?: string | null
  endDate?: string | null
  isOngoing?: boolean | null
}

export interface ImpartialityRegisterEntryLike {
  employeeId: string
  employeeCode?: string | null
  fullName?: string | null
  email?: string | null
  professionalRole?: string | null
  status?: string | null
  annualDeclaration?: ImpartialityDeclarationLike | null
  declarationsCount?: number
  relationshipsCount?: number
  relationships?: ImpartialityRelationshipLike[]
}

export interface TeamExceptionLike {
  id: string
  personId?: string | null
  status?: string | null
  requestedBy?: string | null
  requestedAt?: string | null
  decidedBy?: string | null
  decidedAt?: string | null
}

export interface ImpartialityPersonRow {
  employeeId: string
  name: string
  code: string
  email: string
  role: string
  declarationState: ImpartialityDeclarationState
  validUntil: string | null
  relationshipsCount: number
  toReviewCount: number
  blockingCount: number
}

export interface ImpartialityRelationshipRow {
  id: string
  employeeId: string
  personName: string
  clientName: string
  relationshipType: string
  startDate: string | null
  endDate: string | null
  ongoing: boolean
  classification: ImpartialityRelationshipClass
}

export interface ImpartialityExceptionRow {
  id: string
  personId: string | null
  personName: string
  status: string
  requestedBy: string
  requestedAt: string | null
  decidedBy: string
  decidedAt: string | null
}

export interface ImpartialityKpis {
  totalPeople: number
  validDeclarations: number
  missingOrExpired: number
  relationshipsToReview: number
  blockingRelationships: number
}

export interface ImpartialityRegisterView {
  kpis: ImpartialityKpis
  peopleRows: ImpartialityPersonRow[]
  relationshipRows: ImpartialityRelationshipRow[]
  exceptionRows: ImpartialityExceptionRow[]
}

/** Normalize an ISO datetime/date to a `yyyy-mm-dd` day string, or null. */
export function toDayString(iso?: string | null): string | null {
  if (!iso) return null
  const clean = String(iso).split('T')[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null
}

/**
 * Add whole months to a `yyyy-mm-dd` day with the same rollover semantics as
 * the team-selection eligibility engine (rules.ts `addMonths`: setUTCMonth
 * rolls over, e.g. Jan 31 + 1 month => Mar 3), so cooling-off boundaries
 * shown here never disagree with team selection.
 */
export function addMonthsClamped(day: string, months: number): string | null {
  const clean = toDayString(day)
  if (!clean) return null
  const [y, m, d] = clean.split('-').map(Number)
  const wholeMonths = Math.trunc(months)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCMonth(date.getUTCMonth() + wholeMonths)
  return date.toISOString().split('T')[0]
}

/**
 * Declaration state for one register entry on `today` (`yyyy-mm-dd`):
 * no annual declaration => missing; annual declaration whose validity date
 * passed => expired; otherwise valid.
 */
export function classifyDeclaration(
  entry: ImpartialityRegisterEntryLike,
  today: string,
): ImpartialityDeclarationState {
  const annual = entry.annualDeclaration
  if (!annual) return 'missing'
  const validUntil = toDayString(annual.validUntil)
  if (validUntil && validUntil < today) return 'expired'
  return 'valid'
}

export function isRelationshipOngoing(rel: ImpartialityRelationshipLike): boolean {
  // Display helper for the period column: no recorded end date (or an explicit
  // ongoing flag) renders as "Ongoing". Classification uses classifyRelationship,
  // which also treats future end dates as blocking, like the eligibility engine.
  const endDay = toDayString(rel.endDate)
  return rel.isOngoing === true || !endDay
}

/**
 * Classify one relationship on `today` given the cooling-off window, using the
 * same date boundaries as the eligibility engine (rules.ts evaluateRelationship):
 * ongoing (incl. future end dates) blocks; ended inside the cooling-off window
 * needs review; ended outside it is clear.
 */
export function classifyRelationship(
  rel: ImpartialityRelationshipLike,
  today: string,
  coolingOffMonths: number,
): ImpartialityRelationshipClass {
  const endDay = toDayString(rel.endDate)
  if (rel.isOngoing === true || !endDay || endDay >= today) return 'blocking'
  const until = addMonthsClamped(endDay, Math.max(0, coolingOffMonths))
  if (until && until >= today) return 'coolingOff'
  return 'clear'
}

export function buildImpartialityRegisterView(input: {
  entries: ImpartialityRegisterEntryLike[]
  exceptions?: TeamExceptionLike[]
  coolingOffMonths: number
  today: string
}): ImpartialityRegisterView {
  const entries = Array.isArray(input.entries) ? input.entries : []
  const coolingOffMonths = Number.isFinite(input.coolingOffMonths) ? input.coolingOffMonths : 24
  const today = input.today

  const nameOf = (entry: ImpartialityRegisterEntryLike) =>
    entry.fullName || entry.employeeCode || entry.employeeId

  const peopleRows: ImpartialityPersonRow[] = entries.map((entry) => {
    const rels = Array.isArray(entry.relationships) ? entry.relationships : []
    let toReviewCount = 0
    let blockingCount = 0
    rels.forEach((rel) => {
      const cls = classifyRelationship(rel, today, coolingOffMonths)
      if (cls === 'blocking') blockingCount += 1
      else if (cls === 'coolingOff') toReviewCount += 1
    })
    const relationshipsCount =
      typeof entry.relationshipsCount === 'number' ? entry.relationshipsCount : rels.length
    return {
      employeeId: entry.employeeId,
      name: nameOf(entry),
      code: entry.employeeCode ?? '',
      email: entry.email ?? '',
      role: entry.professionalRole ?? '',
      declarationState: classifyDeclaration(entry, today),
      validUntil: toDayString(entry.annualDeclaration?.validUntil),
      relationshipsCount,
      toReviewCount,
      blockingCount,
    }
  })

  const relationshipRows: ImpartialityRelationshipRow[] = []
  entries.forEach((entry) => {
    const rels = Array.isArray(entry.relationships) ? entry.relationships : []
    rels.forEach((rel, index) => {
      relationshipRows.push({
        id: rel.id ?? `${entry.employeeId}#${index}`,
        employeeId: entry.employeeId,
        personName: nameOf(entry),
        clientName: rel.client?.name ?? rel.clientId ?? '',
        relationshipType: rel.relationshipType ?? '',
        startDate: toDayString(rel.startDate),
        endDate: toDayString(rel.endDate),
        ongoing: isRelationshipOngoing(rel),
        classification: classifyRelationship(rel, today, coolingOffMonths),
      })
    })
  })

  const nameById = new Map(entries.map((entry) => [entry.employeeId, nameOf(entry)]))
  const exceptionRows: ImpartialityExceptionRow[] = (input.exceptions ?? []).map((ex) => ({
    id: ex.id,
    personId: ex.personId ?? null,
    personName: ex.personId ? nameById.get(ex.personId) ?? '' : '',
    status: ex.status ?? 'PENDING',
    requestedBy: ex.requestedBy ?? '',
    requestedAt: ex.requestedAt ?? null,
    decidedBy: ex.decidedBy ?? '',
    decidedAt: ex.decidedAt ?? null,
  }))

  const validDeclarations = peopleRows.filter((row) => row.declarationState === 'valid').length
  const kpis: ImpartialityKpis = {
    totalPeople: peopleRows.length,
    validDeclarations,
    missingOrExpired: peopleRows.length - validDeclarations,
    relationshipsToReview: peopleRows.reduce((sum, row) => sum + row.toReviewCount, 0),
    blockingRelationships: peopleRows.reduce((sum, row) => sum + row.blockingCount, 0),
  }

  return { kpis, peopleRows, relationshipRows, exceptionRows }
}
