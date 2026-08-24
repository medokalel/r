import type { OrgScopeCategory } from '@/lib/api/onboardingOrgScopeApi'
import {
  AppIcon,
  AccreditationFieldIcon,
  BuildingsIcon,
  ReportIcon,
  SearchIcon,
  ShieldIcon,
  type AppIconComponent,
} from '@/components/icons'

export const ORG_SCOPE_CATEGORY_ICONS: Record<OrgScopeCategory, AppIconComponent> = {
  ACCREDITATION_BODY: AccreditationFieldIcon,
  CONFORMITY_ASSESSMENT_BODY: ShieldIcon,
  SCHEME_OWNER: ReportIcon,
  INTERNAL_AUDITS: SearchIcon,
  SUPPLIER_AUDITS: BuildingsIcon,
}

interface OrgScopeCategoryIconProps {
  category: OrgScopeCategory
  size?: number
  className?: string
}

export function OrgScopeCategoryIcon({ category, size = 20, className = 'text-primary' }: OrgScopeCategoryIconProps) {
  const Icon = ORG_SCOPE_CATEGORY_ICONS[category]
  return <AppIcon icon={Icon} size={size} className={className} />
}
