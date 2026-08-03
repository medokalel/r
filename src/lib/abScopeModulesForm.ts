import { DEFAULT_SELECTED_MODULES, type SchemeStandardsCatalog } from '@/lib/api/abRegisterApi'

export interface AbScopeModulesForm {
  /**
   * Selected standard values, keyed by scheme for "flat" catalogs
   * (e.g. "MANAGEMENT_SYSTEM_CERTIFICATION"), or by `${scheme}::${owner}`
   * for "byOwner" catalogs (e.g. "PRODUCT_CERTIFICATION::SASO").
   */
  selectedStandardsByScheme: Record<string, string[]>
  /** Chosen scheme owner (e.g. "SASO"), keyed by scheme — only used for "byOwner" catalogs. */
  selectedOwnerByScheme: Record<string, string>
  /** Second phase of Step 2: the fixed "Which module are you looking for?" picks. */
  selectedModules: string[]
}

export const emptyAbScopeModulesForm: AbScopeModulesForm = {
  selectedStandardsByScheme: {},
  selectedOwnerByScheme: {},
  selectedModules: [...DEFAULT_SELECTED_MODULES],
}

/**
 * A scheme with no defined catalog yet (see SCOPE_STANDARDS_BY_TYPE) doesn't
 * block progress — only schemes with a real standards list need at least
 * one selection.
 */
export function isAbSchemeStandardsComplete(
  form: AbScopeModulesForm,
  scheme: string,
  catalogByScheme: Record<string, SchemeStandardsCatalog>
): boolean {
  const catalog = catalogByScheme[scheme]
  if (!catalog) return true

  if (catalog.kind === 'flat') {
    if (catalog.standards.length === 0) return true
    const selected = form.selectedStandardsByScheme[scheme] ?? catalog.defaultSelected
    return selected.length > 0
  }

  if (catalog.owners.length === 0) return true
  const ownerValue = form.selectedOwnerByScheme[scheme] ?? catalog.owners[0].value
  const ownerCatalog = catalog.owners.find((owner) => owner.value === ownerValue) ?? catalog.owners[0]
  const key = `${scheme}::${ownerValue}`
  const selected = form.selectedStandardsByScheme[key] ?? ownerCatalog.defaultSelected
  return selected.length > 0
}

/** All schemes at once — kept for the summary step; the register flow now validates one scheme screen at a time via isAbSchemeStandardsComplete. */
export function isAbScopeModulesComplete(
  form: AbScopeModulesForm,
  schemes: string[],
  catalogByScheme: Record<string, SchemeStandardsCatalog>
): boolean {
  if (schemes.length === 0) return false
  return schemes.every((scheme) => isAbSchemeStandardsComplete(form, scheme, catalogByScheme))
}

export function isAbModulesComplete(form: AbScopeModulesForm): boolean {
  return form.selectedModules.length > 0
}