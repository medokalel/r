import { AppIcon, CheckIcon } from '@/components/icons'
import type { AgreementSignRecord } from '@/lib/api/cabCertificationAgreementsApi'
import { cn } from '@/lib/utils'

const typedFont = "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive"

interface AgreementSignaturesCardProps {
  clientSignature?: AgreementSignRecord
  cabSignature?: AgreementSignRecord
  isAr: boolean
}

const shortFingerprint = (fp: string) => (fp.length > 24 ? `${fp.slice(0, 12)}…${fp.slice(-8)}` : fp)

/** Both parties' signatures at the end of the agreement; each box fills in once that side has signed. */
export function AgreementSignaturesCard({ clientSignature, cabSignature, isAr }: AgreementSignaturesCardProps) {
  const boxes = [
    { role: isAr ? 'العميل' : 'Client', sig: clientSignature },
    { role: isAr ? 'جهة منح الشهادات' : 'Certification body', sig: cabSignature },
  ]
  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white">
      <h3 className="border-b border-[#ececec] px-5 py-4 text-[15px] font-bold text-neutral-900">
        {isAr ? 'التوقيعات' : 'Signatures'}
      </h3>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {boxes.map(({ role, sig }) => (
          <div
            key={role}
            className={cn(
              'flex min-h-[126px] flex-col rounded-[12px] border p-3.5',
              sig ? 'border-[#bbf7d0] bg-[#eafaf1]/50' : 'border-[#ececec] bg-white',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{role}</p>
              {sig && (
                <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#dcfce7] px-2 py-0.5 text-[11px] font-medium text-[#15803d]">
                  <AppIcon icon={CheckIcon} size={12} /> {isAr ? 'موقّع' : 'Signed'}
                </span>
              )}
            </div>
            {sig ? (
              <div className="mt-3 space-y-1">
                {(sig.signatureDataUrl || sig.typedSignature) && (
                  <div className="mb-2 flex h-16 items-center justify-center rounded-[8px] bg-white px-3">
                    {sig.signatureDataUrl ? (
                      <img src={sig.signatureDataUrl} alt={sig.signerName} className="max-h-12 object-contain" />
                    ) : (
                      <span className="text-[26px] text-[#1236a3]" style={{ fontFamily: typedFont }} dir="ltr">{sig.typedSignature}</span>
                    )}
                  </div>
                )}
                <p className="text-[14px] font-bold text-neutral-900">{sig.signerName}</p>
                {sig.signerTitle && <p className="text-[12px] text-neutral-600">{sig.signerTitle}</p>}
                <p className="pt-1 text-[12px] font-medium text-[#15803d]" dir="ltr">{sig.signedAt}</p>
                <p className="truncate font-mono text-[11px] text-neutral-400" dir="ltr" title={sig.fingerprint}>
                  {shortFingerprint(sig.fingerprint)}
                </p>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-[13px] text-neutral-400">{isAr ? 'لم يتم التوقيع بعد' : 'Not signed yet'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
