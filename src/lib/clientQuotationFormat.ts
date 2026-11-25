/** Date shown on the client quotation screens, in the active language. */
export function formatQuotationDate(value: string | null | undefined, language: string): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

/** Amount with its currency code, e.g. "USD 1,200.00". */
export function formatQuotationMoney(
  value: string | number,
  currency: string,
  language: string,
): string {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString(language)} ${currency}`
  }
}
