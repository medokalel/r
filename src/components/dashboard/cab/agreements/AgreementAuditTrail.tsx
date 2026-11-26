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

const EVENT_LABELS: Partial<Record<AgreementEventType, { en: string; ar: string }>> = {
  GENERATED: { en: 'Agreement drafted', ar: 'أُعدّت الاتفاقية' },
  UPDATED: { en: 'Draft edited', ar: 'تم تعديل المسودة' },
  SENT: { en: 'Sent to the client', ar: 'أُرسلت إلى العميل' },
  REMINDED: { en: 'Reminder sent', ar: 'تم إرسال تذكير' },
  OPENED: { en: 'Opened by the client', ar: 'فتحها العميل' },
  VIEWED: { en: 'Opened by the client', ar: 'فتحها العميل' },
  CLIENT_OPENED: { en: 'Opened by the client', ar: 'فتحها العميل' },
  OTP_SENT: { en: 'Signature code sent', ar: 'أرسل رمز التوقيع' },
  CODE_SENT: { en: 'Signature code sent', ar: 'أرسل رمز التوقيع' },
  SIGNATURE_CODE_SENT: { en: 'Signature code sent', ar: 'أرسل رمز التوقيع' },
  CLIENT_SIGNED: { en: 'Signed by the client', ar: 'وقّعها العميل' },
  COUNTERSIGNED: {
    en: 'Countersigned by the certification body',
    ar: 'وقّعتها جهة المنح',
  },
  SUPERSEDED: { en: 'Replaced by a newer version', ar: 'استُبدلت بإصدار أحدث' },
  TERMINATED: { en: 'Terminated', ar: 'أُنهيت الاتفاقية' },
  AMENDMENT_CREATED: { en: 'Amendment created', ar: 'تم إنشاء تعديل' },
}

const ACTOR_LABELS: Record<AgreementEventActor, { en: string; ar: string }> = {
  cab: { en: 'Certification body', ar: 'جهة المنح' },
  client: { en: 'Client', ar: 'العميل' },
  system: { en: 'System', ar: 'النظام' },
}

const formatEventTime = (iso: string, isAr: boolean) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = date.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: isAr ? 'long' : 'short',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day}، ${time}`
}

export function AgreementAuditTrail({ events = [], isAr }: AgreementAuditTrailProps) {
  const newestFirst = Array.isArray(events) ? [...events].reverse() : []

  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex items-center gap-2.5 border-b border-[#ececec] pb-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
          <AppIcon icon={HistoryIcon} size={18} />
        </span>
        <h3 className="text-[15px] font-bold text-neutral-900">
          {isAr ? 'سجل التدقيق' : 'Audit trail'}
        </h3>
      </div>

      {newestFirst.length === 0 ? (
        <p className="pt-4 text-[13px] text-neutral-500">
          {isAr ? 'لا يوجد نشاط بعد.' : 'No activity yet.'}
        </p>
      ) : (
        <ol className="mt-1 flex flex-col">
          {newestFirst.map((event) => {
            const label = EVENT_LABELS[event.type] ?? { en: event.type, ar: event.type }
            const actorLabel =
              event.actorName ||
              (ACTOR_LABELS[event.actor]
                ? isAr
                  ? ACTOR_LABELS[event.actor].ar
                  : ACTOR_LABELS[event.actor].en
                : event.actor)
            return (
              <li
                key={event.id}
                className="flex gap-3 border-b border-[#f0f0f0] py-3 last:border-b-0"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-neutral-900">
                    {isAr ? label.ar : label.en}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {actorLabel} · <span>{formatEventTime(event.at, isAr)}</span>
                  </p>
                  {event.ipAddress ? (
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {isAr ? 'عنوان ' : ''}
                      <span dir="ltr">IP {event.ipAddress}</span>
                    </p>
                  ) : null}
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
