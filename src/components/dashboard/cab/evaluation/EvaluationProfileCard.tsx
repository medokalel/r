import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { AppIcon, EditIcon } from '@/components/icons'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import type { CompetencePerson } from '@/lib/api/cabCompetenceApi'

export interface EvaluationProfileCardProps {
  person: CompetencePerson
  onToggleStatus: () => void
  onEditProfile: () => void
}

function getInitials(name?: string) {
  if (!name) return 'EM'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function EvaluationProfileCard({
  person,
  onToggleStatus,
  onEditProfile,
}: EvaluationProfileCardProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Left Profile Info */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[18px] font-bold text-white shadow-sm">
            {person.avatarUrl ? (
              <img
                src={resolvePublicAssetUrl(person.avatarUrl)}
                alt={person.name}
                className="size-full object-cover"
              />
            ) : (
              getInitials(person.name)
            )}
          </div>
          <div>
            <h2 className="text-[18px] font-bold leading-tight text-neutral-900 sm:text-[20px]">
              {person.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-neutral-500" dir="ltr">
              {person.code}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<AppIcon icon={EditIcon} size={15} />}
            onClick={onEditProfile}
            className="ms-2"
          >
            {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
          </Button>
        </div>

        {/* Right Meta details */}
        <div className="flex flex-wrap items-center gap-6 border-t border-[#ececec] pt-4 sm:gap-8 lg:border-t-0 lg:pt-0">
          <div>
            <span className="mb-1 block text-[12px] font-medium text-neutral-400">
              {t('cab.competence.columns.status', 'Status')}
            </span>
            <Toggle
              checked={person.statusDot !== 'Inactive'}
              label={
                person.statusDot !== 'Inactive'
                  ? t('users.status.active', 'Active')
                  : t('users.status.inactive', 'Inactive')
              }
              onChange={onToggleStatus}
            />
          </div>

          <div>
            <span className="block text-[12px] font-medium text-neutral-400">
              {t('cab.competence.columns.role', 'Role')}
            </span>
            <span className="mt-0.5 block text-[14px] font-semibold text-neutral-800 whitespace-nowrap">
              {person.role}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-neutral-400">
              {t('cab.competence.evaluation.profile.email', 'Email')}
            </span>
            <a
              href={`mailto:${person.email}`}
              className="mt-0.5 block break-all text-[14px] font-medium text-primary hover:underline"
              dir="ltr"
            >
              {person.email || '—'}
            </a>
          </div>

          <div>
            <span className="block text-[12px] font-medium text-neutral-400">
              {t('cab.competence.evaluation.profile.phone', 'Phone')}
            </span>
            <span
              className="mt-0.5 block text-[14px] font-medium text-neutral-800 whitespace-nowrap"
              dir="ltr"
            >
              {person.phone || '—'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
