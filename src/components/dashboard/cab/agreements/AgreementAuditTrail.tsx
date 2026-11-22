import { AppIcon, HistoryIcon } from '@/components/icons'
import type {
  AgreementEvent,
  AgreementEventActor,
  AgreementEventType,
} from '@/lib/api/cabCertificationAgreementsApi'

interface AgreementAuditTrailProps {
  events: AgreementEvent[]
  isAr: boolean
}

const EVENT_LABELS: Record<AgreementEventType, { en: string; ar: string }> = {
  GENERATED: { en: 'Agreement drafted', ar: 'تم إنشاء مسودة الاتفاقية' },
  UPDATED: { en: 'Draft edited', ar: 'تم تعديل المسودة' },
  SENT: { en: 'Sent to the client', ar: 'أُرسلت إلى العميل' },
  REMINDED: { en: 'Reminder sent', ar: 'تم إرسال تذكير' },
  CLIENT_SIGNED: { en: 'Signed by the client', ar: 'وقّعها العميل' },
  COUNTERSIGNED: {
    en: 'Countersigned by the certification body',
    ar: 'تم التوقيع المشترك من جهة المنح',
  },
  SUPERSEDED: { en: 'Replaced by a newer version', ar: 'استُبدلت بإصدار أحدث' },
  TERMINATED: { en: 'Terminated', ar: 'تم إنهاء الاتفاقية' },
  AMENDMENT_CREATED: { en: 'Amendment created', ar: 'تم إنشاء تعديل' },
}

const ACTOR_LABELS: Record<AgreementEventActor, { en: string; ar: string }> = {
  cab: { en: 'Certification body', ar: 'جهة المنح' },
  client: { en: 'Client', ar: 'العميل' },
  system: { en: 'System', ar: 'النظام' },
}

const formatEventTime = (iso: string) => {
  const date = new Date(iso)
  const day = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

export function AgreementAuditTrail({ events, isAr }: AgreementAuditTrailProps) {
  const newestFirst = [...events].reverse()

  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex items-center gap-2.5 border-b border-[#ececec] pb-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
          <AppIcon icon={HistoryIcon} size={18} />
        </span>
        <h3 className="text-[15px] font-bold text-neutral-900">
          {isAr ? 'سجل النشاط' : 'Audit trail'}
        </h3>
      </div>

      {newestFirst.length === 0 ? (
        <p className="pt-4 text-[13px] text-neutral-500">
          {isAr ? 'لا يوجد نشاط بعد.' : 'No activity yet.'}
        </p>
      ) : (
        <ol className="mt-1 flex flex-col">
          {newestFirst.map((event) => {
            const label = EVENT_LABELS[event.type]
            const actor = ACTOR_LABELS[event.actor]
            return (
              <li
                key={event.id}
                className="flex gap-3 border-b border-[#f0f0f0] py-3 last:border-b-0"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-neutral-900">
                    {isAr ? label.ar : label.en}
                  </p>
                  <p className="text-[12px] text-neutral-500">
                    {isAr ? actor.ar : actor.en} ·{' '}
                    <span dir="ltr">{formatEventTime(event.at)}</span>
                  </p>
                  {event.reason ? (
                    <p className="mt-1 text-[12px] text-neutral-700">{event.reason}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
