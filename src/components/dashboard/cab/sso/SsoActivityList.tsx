import { useTranslation } from 'react-i18next'
import type { SsoEvent } from '@/lib/api/ssoTypes'
import { formatSsoDateTime } from '@/lib/sso'

interface SsoActivityListProps {
  events: SsoEvent[]
  language: string
}

/** Recent single sign-on activity, newest first. */
export function SsoActivityList({ events, language }: SsoActivityListProps) {
  const { t } = useTranslation()

  if (events.length === 0) {
    return <p className="text-[13px] text-neutral-500">{t('cab.sso.page.activityEmpty')}</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-neutral-900">
              {t(`cab.sso.events.${event.action.replace('.', '_')}`, { defaultValue: event.action })}
            </p>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {formatSsoDateTime(event.createdAt, language)}
              {event.actorName ? ` · ${t('cab.sso.events.by', { name: event.actorName })}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
