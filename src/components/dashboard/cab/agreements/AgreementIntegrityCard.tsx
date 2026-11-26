import { useEffect, useState } from 'react'
import { AppIcon, ShieldIcon } from '@/components/icons'
import type { CertificationAgreement } from '@/lib/api/cabCertificationAgreementsApi'

interface AgreementIntegrityCardProps {
  agreement: CertificationAgreement
  isAr: boolean
}

async function computeSha256(payload: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return ''
  }
  const bytes = new TextEncoder().encode(payload)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Displays the SHA-256 cryptographic integrity state of the agreement document. */
export function AgreementIntegrityCard({ agreement, isAr }: AgreementIntegrityCardProps) {
  const [hash, setHash] = useState('')
  const isDraft = agreement.status === 'draft'
  const sealedFingerprint = agreement.cabSignature?.fingerprint || agreement.clientSignature?.fingerprint

  useEffect(() => {
    if (sealedFingerprint) {
      setHash(sealedFingerprint)
      return
    }
    let active = true
    const canonical = JSON.stringify({
      reference: agreement.reference,
      version: agreement.version,
      values: agreement.values,
      sections: agreement.sections,
    })
    void computeSha256(canonical).then((digest) => {
      if (active) setHash(digest)
    })
    return () => {
      active = false
    }
  }, [agreement, sealedFingerprint])

  return (
    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="flex items-center gap-2.5 border-b border-[#ececec] pb-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eafaf1] text-[#16a34a]">
          <AppIcon icon={ShieldIcon} size={18} />
        </span>
        <h3 className="text-[15px] font-bold text-neutral-900">
          {isAr ? 'سلامة المستند' : 'Document integrity'}
        </h3>
      </div>

      <p className="mt-3.5 text-[13px] font-medium leading-relaxed text-neutral-700">
        {isDraft
          ? isAr
            ? 'مسودة: تُختم البصمة عند إرسال الاتفاقية.'
            : 'Draft: the cryptographic fingerprint is sealed when the agreement is sent.'
          : isAr
            ? 'يطابق النص البصمة المختومة عند الإرسال.'
            : 'Document text matches the fingerprint sealed when sent.'}
      </p>

      <div className="mt-3 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-3">
        <p className="text-[11px] font-medium text-neutral-500">
          {isDraft
            ? isAr
              ? 'بصمة المسودة الحالية SHA-256'
              : 'Current draft SHA-256 fingerprint'
            : isAr
              ? 'بصمة المستند SHA-256'
              : 'Document SHA-256 fingerprint'}
        </p>
        <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-neutral-700" dir="ltr">
          {hash || '—'}
        </p>
      </div>
    </section>
  )
}
