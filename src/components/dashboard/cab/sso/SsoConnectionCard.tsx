import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/dashboard/cab/ReviewPrimitives'
import { SsoProviderMark } from '@/components/dashboard/cab/sso/SsoProviderMark'
import {
  AppIcon,
  EditIcon,
  LockIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TrashIcon,
  UsersIcon,
  ErrorCircleIcon,
} from '@/components/icons'
import type { SsoConnection } from '@/lib/api/ssoTypes'
import { formatSsoDateTime, getSsoMissingFields } from '@/lib/sso'
import { cn } from '@/lib/utils'

interface SsoConnectionCardProps {
  connection: SsoConnection
  language: string
  /** A request for this connection is running — its actions are locked. */
  busy: boolean
  onEdit: () => void
  onTest: () => void
  onToggle: (enabled: boolean) => void
  onDelete: () => void
}

export function SsoConnectionCard({
  connection,
  language,
  busy,
  onEdit,
  onTest,
  onToggle,
  onDelete,
}: SsoConnectionCardProps) {
  const { t } = useTranslation()
  const enabled = connection.status === 'ENABLED'
  const incomplete = getSsoMissingFields(connection).length > 0
  const lastTestAt = formatSsoDateTime(connection.lastTest?.at, language)
  const lastLoginAt = formatSsoDateTime(connection.lastLoginAt, language)

  return (
    <article className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
      <div className="flex items-start gap-3">
        <SsoProviderMark provider={connection.provider} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body-1-medium text-neutral-900">{connection.name}</h3>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {t(`cab.sso.providers.${connection.provider}`)}
            <span lang="en" dir="ltr">
              {' · '}
              {connection.protocol}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Badge tone={enabled ? 'green' : 'neutral'}>{t(`cab.sso.status.${connection.status}`)}</Badge>
          <Toggle
            size="sm"
            checked={enabled}
            disabled={busy || (!enabled && incomplete)}
            onChange={onToggle}
            aria-label={t(enabled ? 'cab.sso.card.disable' : 'cab.sso.card.enable')}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[12px] font-medium text-neutral-500">{t('cab.sso.card.domains')}</p>
        {connection.domains.length === 0 ? (
          <p className="mt-1.5 text-[13px] text-neutral-400">{t('cab.sso.card.noDomains')}</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {connection.domains.map((domain) => (
              <li
                key={domain.id}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] border border-neutral-200 px-2.5 py-1 text-[13px]"
              >
                <AppIcon
                  icon={domain.verified ? SuccessCircleIcon : ErrorCircleIcon}
                  size={14}
                  className={domain.verified ? 'text-success-600' : 'text-warning-700'}
                />
                <span lang="en" dir="ltr" className="text-neutral-900">
                  {domain.domain}
                </span>
                <span className={cn('text-[12px]', domain.verified ? 'text-success-700' : 'text-warning-700')}>
                  {domain.verified ? t('cab.sso.card.verified') : t('cab.sso.card.pending')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(connection.jitEnabled || connection.requireSso) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {connection.jitEnabled && (
            <Badge tone="blue">
              <span className="inline-flex items-center gap-1.5">
                <AppIcon icon={UsersIcon} size={14} />
                {t('cab.sso.card.jit')}
              </span>
            </Badge>
          )}
          {connection.requireSso && (
            <Badge tone="amber">
              <span className="inline-flex items-center gap-1.5">
                <AppIcon icon={LockIcon} size={14} />
                {t('cab.sso.card.required')}
              </span>
            </Badge>
          )}
          {connection.requireSso && connection.breakGlassUser && (
            <Badge tone="neutral">{t('cab.sso.card.breakGlass', { name: connection.breakGlassUser.name })}</Badge>
          )}
        </div>
      )}

      <dl className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-[12px] font-medium text-neutral-500">{t('cab.sso.card.lastTest')}</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-neutral-900">
            {connection.lastTest ? (
              <>
                <Badge tone={connection.lastTest.status === 'SUCCESS' ? 'green' : 'red'}>
                  {t(`cab.sso.test.${connection.lastTest.status}`)}
                </Badge>
                <span>{lastTestAt}</span>
              </>
            ) : (
              t('cab.sso.common.never')
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[12px] font-medium text-neutral-500">{t('cab.sso.card.lastLogin')}</dt>
          <dd className="mt-1 text-[13px] text-neutral-900">{lastLoginAt ?? t('cab.sso.common.never')}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-neutral-100 pt-3">
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          icon={<AppIcon icon={EditIcon} size={16} />}
          disabled={busy}
          onClick={onEdit}
        >
          {t('cab.sso.card.edit')}
        </Button>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          icon={<AppIcon icon={ShieldIcon} size={16} />}
          disabled={busy || incomplete}
          onClick={onTest}
        >
          {t('cab.sso.card.test')}
        </Button>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          icon={<AppIcon icon={TrashIcon} size={16} />}
          disabled={busy}
          onClick={onDelete}
          className="ms-auto text-error-600 hover:text-error-700 disabled:text-error-200"
        >
          {t('cab.sso.card.delete')}
        </Button>
      </div>
    </article>
  )
}
