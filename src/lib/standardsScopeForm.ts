export interface SelectedStandard {
  id: string
  /** value from STANDARD_SCHEMA_OPTIONS */
  standard: string
  ihfCode: string
  ihfCategory: string
  certificationType: string
  accreditationBody: string
  scopeText: string
}

export interface StandardsScopeForm {
  standards: SelectedStandard[]
}

export const emptyStandardsScopeForm: StandardsScopeForm = {
  standards: [],
}

export const SCOPE_TEXT_MAX_LENGTH = 5000

/** At least one standard, each with its scope filled in, gates "Save & Continue". */
export function isStandardsScopeComplete(form: StandardsScopeForm): boolean {
  return form.standards.length > 0 && form.standards.every((s) => s.scopeText.trim().length > 0)
}