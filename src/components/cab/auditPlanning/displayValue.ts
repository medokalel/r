import type { TFunction } from 'i18next'
import i18n from '@/i18n'
import { AUDIT_SEED_AR } from '@/lib/api/auditSeedAr'

/** Display text of a stored value (stage, status, result...) in the current language; unknown values show as they are. */
export function valueLabel(t: TFunction, value: string): string {
  if (!value) return value
  const translated = t(`cab.auditExecution.values.${value}`, value)
  if (translated !== value || !i18n.language?.startsWith('ar')) return translated
  const clause = value.match(/^Clause (.+)$/)
  if (clause) return `البند ${clause[1]}`
  const generated = value.match(/^(.+) requirement check (\d+)$/)
  if (generated) return `فحص متطلبات ${generated[1]} ${generated[2]}`
  const description = value.match(/^Verify implementation and documented evidence for (.+) clause (.+).$/)
  if (description) return `تحقق من التطبيق والأدلة الموثقة للبند ${description[2]} من ${description[1]}.`
  return AUDIT_SEED_AR[value] ?? value
}

/** Date locale: Gregorian calendar with Latin digits in Arabic, like the rest of the app. */
export const dateLocale = () => (i18n.language?.startsWith('ar') ? 'ar-u-ca-gregory-nu-latn' : 'en-GB')
