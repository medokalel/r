import { useTranslation } from 'react-i18next'
import type { LocalizedText, TeamRole } from '@/lib/teamSelection/catalog'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'

export type RoleKey = 'teamLeader' | 'auditor' | 'technicalExpert' | 'trainee' | 'observer'

/** Translation key segment of each team role. */
export const ROLE_KEY: Record<TeamRole, RoleKey> = {
  TEAM_LEADER: 'teamLeader',
  AUDITOR: 'auditor',
  TECHNICAL_EXPERT: 'technicalExpert',
  TRAINEE: 'trainee',
  OBSERVER: 'observer',
}

export const TEAM_ROLES: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE', 'OBSERVER']

/** Stable identity of a team member: the register id, or the name for external observers. */
export const memberKey = (member: { personId: string | null; name: string }): string =>
  member.personId ?? `name:${member.name}`

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

/** Adds a member. A person has one role, and there is only one team leader. */
export function addOrReplaceMember(team: PlanAssignment[], member: PlanAssignment): PlanAssignment[] {
  const others = team.filter((existing) =>
    member.personId ? existing.personId !== member.personId : existing.name !== member.name,
  )
  return [...(member.role === 'TEAM_LEADER' ? others.filter((existing) => existing.role !== 'TEAM_LEADER') : others), member]
}

const COMPETENCE_ROLE_LABELS: Record<string, LocalizedText> = {
  'Lead Auditor': { en: 'Lead auditor', ar: 'مدقق رئيسي' },
  Auditor: { en: 'Auditor', ar: 'مدقق' },
  'Technical Expert': { en: 'Technical expert', ar: 'خبير فني' },
  'Decision Maker': { en: 'Decision maker', ar: 'صانع قرار' },
  Reviewer: { en: 'Reviewer', ar: 'مراجع' },
}

export const competenceRoleLabel = (role: string, language: 'en' | 'ar'): string =>
  COMPETENCE_ROLE_LABELS[role]?.[language] ?? role

/** Current UI language (`en` or `ar`) and a picker for text that exists in both. */
export function useTeamLanguage(): { language: 'en' | 'ar'; text: (value: LocalizedText) => string } {
  const { i18n } = useTranslation()
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  return { language, text: (value) => value[language] }
}
