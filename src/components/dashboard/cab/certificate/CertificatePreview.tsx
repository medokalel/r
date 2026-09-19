import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { CertificateLanguage } from '@/lib/api/cabCertificatesApi'
import { formatCertificateDate } from '@/lib/certificatePreparationForm'
import { cn } from '@/lib/utils'

export interface CertificatePreviewData {
  /** Language the certificate itself is printed in — independent of the UI language. */
  language: CertificateLanguage
  issuerName: string
  clientName: string
  location: string
  standardCode: string
  standardTitle: string
  scope: string
  certificateNumber: string
  issueDate: Date
  effectiveDate: Date
  expiryDate: Date
  signatoryName: string
  signatoryTitle: string
  markNames: string[]
  includeQrCode: boolean
  /** Drafts carry a "DRAFT – SAMPLE" watermark; issued certificates do not. */
  isDraft: boolean
}

interface CertificatePreviewProps {
  data: CertificatePreviewData
  className?: string
}

const QR_MODULES = 21
const FINDER_ORIGINS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [QR_MODULES - 7, 0],
  [0, QR_MODULES - 7],
]

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  }
  return hash >>> 0
}

function isFinderZone(x: number, y: number): boolean {
  return FINDER_ORIGINS.some(([originX, originY]) => x >= originX - 1 && x <= originX + 7 && y >= originY - 1 && y <= originY + 7)
}

function finderModules(): string[] {
  return FINDER_ORIGINS.flatMap(([originX, originY]) => {
    const cells: string[] = []
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const onRing = x === 0 || x === 6 || y === 0 || y === 6
        const onCore = x >= 2 && x <= 4 && y >= 2 && y <= 4
        if (onRing || onCore) cells.push(`M${originX + x} ${originY + y}h1v1h-1z`)
      }
    }
    return cells
  })
}

/**
 * Decorative stand-in for the verification QR code: three finder squares plus a
 * data area seeded from the certificate number. It is intentionally NOT
 * scannable — swap it for a real QR encoder once the backend returns the
 * verification URL.
 */
function QrCodePlaceholder({ seed }: { seed: string }) {
  const path = useMemo(() => {
    let state = hashSeed(seed) || 1
    const next = () => {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      state >>>= 0
      return state / 4294967296
    }

    const cells = finderModules()
    for (let y = 0; y < QR_MODULES; y += 1) {
      for (let x = 0; x < QR_MODULES; x += 1) {
        if (!isFinderZone(x, y) && next() > 0.52) cells.push(`M${x} ${y}h1v1h-1z`)
      }
    }
    return cells.join('')
  }, [seed])

  return (
    <svg viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`} shapeRendering="crispEdges" className="size-full" aria-hidden>
      <path d={path} fill="currentColor" />
    </svg>
  )
}

/**
 * A4-portrait certificate. Every size is expressed in container-query units
 * (`cqw`), so the same markup renders crisply in the side panel and in the
 * enlarged preview dialog.
 */
export function CertificatePreview({ data, className }: CertificatePreviewProps) {
  const { t } = useTranslation()
  const lng = data.language
  const label = (key: string) => t(`cab.certificatePrepare.preview.${key}`, { lng })

  const details = [
    // The number is an identifier and must stay left-to-right; dates follow the certificate's own direction.
    { label: label('certificateNumber'), value: data.certificateNumber, forceLtr: true },
    { label: label('issueDate'), value: formatCertificateDate(data.issueDate, lng), forceLtr: false },
    { label: label('effectiveDate'), value: formatCertificateDate(data.effectiveDate, lng), forceLtr: false },
    { label: label('expiryDate'), value: formatCertificateDate(data.expiryDate, lng), forceLtr: false },
  ]
  // Letter-spacing breaks Arabic letter joining, so only Latin text gets tracked out.
  const tracking = lng === 'ar' ? '' : 'tracking-[0.1em]'

  return (
    <div
      role="group"
      aria-label={t('cab.certificatePrepare.preview.title')}
      lang={lng}
      dir={lng === 'ar' ? 'rtl' : 'ltr'}
      className={cn('@container w-full', className)}
    >
      <div className="relative flex aspect-[210/297] w-full flex-col overflow-hidden rounded-[var(--radius-sm)] border border-neutral-200 bg-white text-neutral-900 shadow-sm">
        <div className="pointer-events-none absolute inset-[2.5cqw] rounded-[0.6cqw] border border-primary/20" aria-hidden />

        {data.isDraft && (
          <div className="pointer-events-none absolute inset-0 z-10 flex select-none items-center justify-center" aria-hidden>
            <span
              className={cn(
                '-rotate-[30deg] whitespace-nowrap text-[11cqw] font-extrabold uppercase text-error-500/15',
                lng !== 'ar' && 'tracking-wide',
              )}
            >
              {label('draftSample')}
            </span>
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col px-[8cqw] py-[7cqw]">
          <div className="text-end">
            <p className="text-[3.2cqw] font-bold leading-tight">{data.issuerName}</p>
            <p className="text-[2.2cqw] text-neutral-500">{label('certificationBody')}</p>
          </div>

          <div className="mt-[5cqw] flex flex-col items-center text-center">
            <h3 className={cn('text-[8.5cqw] font-bold uppercase leading-none text-primary', tracking)}>{label('certificate')}</h3>
            <p className="mt-[3.5cqw] text-[2.4cqw] text-neutral-700">{label('certifyThat')}</p>
            <p className="mt-[1.5cqw] text-[4.6cqw] font-bold leading-tight">{data.clientName}</p>
            <p className="text-[2.6cqw] text-neutral-700">{data.location}</p>
            <p className="mt-[3cqw] text-[2.2cqw] text-neutral-600">{label('assessedAgainst')}</p>
            <p className="mt-[2cqw] text-[5.2cqw] font-bold leading-none" dir="ltr">
              {data.standardCode}
            </p>
            {data.standardTitle && <p className="mt-[1cqw] text-[3.1cqw] font-semibold leading-tight">{data.standardTitle}</p>}
            <p className="mt-[3cqw] text-[2.2cqw] text-neutral-600">{label('forScope')}</p>
            <p className="mt-[1cqw] line-clamp-4 text-[2.8cqw] leading-snug">{data.scope}</p>
          </div>

          <div className="min-h-[3cqw] flex-1" />

          {data.markNames.length > 0 && (
            <ul className="mb-[3cqw] flex flex-wrap justify-center gap-[1.5cqw]">
              {data.markNames.map((name) => (
                <li
                  key={name}
                  className="rounded-[0.8cqw] border border-primary/30 bg-primary-subtle px-[2cqw] py-[0.8cqw] text-[2cqw] font-medium text-primary"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end justify-between gap-[3cqw]">
            <div className="min-w-0 flex-1">
              <dl className="grid grid-cols-[auto_1fr] gap-x-[3cqw] gap-y-[0.6cqw] text-[2cqw] text-neutral-600">
                {details.map((row) => (
                  <div key={row.label} className="contents">
                    <dt>{row.label}</dt>
                    <dd className="text-start font-medium text-neutral-800">
                      {row.forceLtr ? (
                        <span dir="ltr" className="inline-block">
                          {row.value}
                        </span>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-[4cqw] max-w-[55%] border-t border-neutral-400 pt-[1cqw]">
                <p className="text-[2.4cqw] font-semibold leading-tight">{data.signatoryName}</p>
                <p className="text-[2cqw] text-neutral-600">{data.signatoryTitle}</p>
                <p className="text-[2cqw] text-neutral-600">{data.issuerName}</p>
              </div>
            </div>

            {data.includeQrCode && (
              <div className="flex shrink-0 flex-col items-center gap-[1cqw]">
                <div className="size-[15cqw] text-neutral-900">
                  <QrCodePlaceholder seed={data.certificateNumber} />
                </div>
                <span className="text-[1.9cqw] text-primary">{label('verifyOnline')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}