import {
  renderAgreementClauseText,
  type CertificationAgreement,
} from '@/lib/api/cabCertificationAgreementsApi'

const PAGE_W = 1240
const PAGE_H = 1754
const MARGIN = 80
const CONTENT_W = PAGE_W - MARGIN * 2

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      continue
    }
    let current = words[0]
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate
      } else {
        lines.push(current)
        current = words[i]
      }
    }
    lines.push(current)
  }
  return lines
}

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const base64 = dataUrl.split(',')[1] ?? ''
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i)
  }
  return bytes
}

function buildPdfFromJpegPages(pages: Uint8Array<ArrayBuffer>[]): Blob {
  const encoder = new TextEncoder()
  const chunks: BlobPart[] = []
  const offsets: number[] = [0]
  let length = 0

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str)
    chunks.push(bytes)
    length += bytes.length
  }
  const pushBytes = (bytes: Uint8Array<ArrayBuffer>) => {
    chunks.push(bytes)
    length += bytes.length
  }
  const startObj = (id: number) => {
    offsets[id] = length
    pushStr(`${id} 0 obj\n`)
  }
  const endObj = () => pushStr('\nendobj\n')

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')

  startObj(1)
  pushStr('<< /Type /Catalog /Pages 2 0 R >>')
  endObj()

  const pageObjIds = pages.map((_, idx) => 3 + idx * 3)
  startObj(2)
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  )
  endObj()

  pages.forEach((jpeg, idx) => {
    const pageId = 3 + idx * 3
    const contentId = pageId + 1
    const imageId = pageId + 2

    startObj(pageId)
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    endObj()

    const streamCmd = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q'
    startObj(contentId)
    pushStr(`<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}\nendstream`)
    endObj()

    startObj(imageId)
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${PAGE_W} /Height ${PAGE_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    )
    pushBytes(jpeg)
    pushStr('\nendstream')
    endObj()
  })

  const totalObjs = 2 + pages.length * 3
  const xrefOffset = length
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`)
  for (let i = 1; i <= totalObjs; i++) {
    pushStr(`${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`)
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  )

  return new Blob(chunks, { type: 'application/pdf' })
}

/**
 * Generates and directly downloads an A4 PDF file (`AGR-XXXX-v1.pdf`)
 * without calling `window.print()` or freezing the browser.
 */
export function downloadAgreementPdf(
  agreement: CertificationAgreement,
  lang: 'en' | 'ar',
): void {
  const isAr = lang === 'ar'
  const v = agreement.values
  const font = "'Segoe UI', Tahoma, Arial, sans-serif"
  const canvases: HTMLCanvasElement[] = []

  const createPage = (pageNum: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = PAGE_W
    canvas.height = PAGE_H
    const ctx = canvas.getContext('2d')!
    ctx.direction = isAr ? 'rtl' : 'ltr'
    ctx.textAlign = isAr ? 'right' : 'left'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, PAGE_W, PAGE_H)

    // Top iCASCO Accent Bar
    ctx.fillStyle = '#1236a3'
    ctx.fillRect(MARGIN, 56, CONTENT_W, 8)

    // Header Title & Reference
    ctx.fillStyle = '#1236a3'
    ctx.font = `bold 32px ${font}`
    const xStart = isAr ? PAGE_W - MARGIN : MARGIN
    const xEnd = isAr ? MARGIN : PAGE_W - MARGIN
    ctx.fillText('iCASCO', xStart, 110)

    ctx.fillStyle = '#111827'
    ctx.font = `bold 26px ${font}`
    ctx.fillText(
      isAr ? 'اتفاقية منح الشهادة' : 'Certification Agreement',
      xStart,
      148,
    )

    ctx.fillStyle = '#6b7280'
    ctx.font = `18px ${font}`
    ctx.fillText(
      `ISO/IEC 17021-1:2015 · Clause 5.1.2  |  ${agreement.reference}`,
      xStart,
      178,
    )

    // Page Number on opposite side
    ctx.save()
    ctx.textAlign = isAr ? 'left' : 'right'
    ctx.fillStyle = '#475569'
    ctx.font = `bold 18px ${font}`
    ctx.fillText(
      `${isAr ? 'صفحة' : 'Page'} ${pageNum}  ·  ${v.agreementDate ?? ''}`,
      xEnd,
      110,
    )
    ctx.restore()

    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(MARGIN, 200)
    ctx.lineTo(PAGE_W - MARGIN, 200)
    ctx.stroke()

    canvases.push(canvas)
    return { ctx, y: 230, xStart }
  }

  let pageIndex = 1
  let { ctx, y, xStart } = createPage(pageIndex)

  // Summary Box on Page 1
  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = '#dbeafe'
  ctx.lineWidth = 2
  ctx.fillRect(MARGIN, y, CONTENT_W, 185)
  ctx.strokeRect(MARGIN, y, CONTENT_W, 185)

  const summaryRows = [
    `${isAr ? 'العميل:' : 'Client:'} ${isAr ? v.clientLegalNameAr : v.clientLegalNameEn}   |   ${isAr ? 'سجل تجاري:' : 'CR:'} ${v.clientCrNumber} (${isAr ? v.clientCityAr : v.clientCityEn})`,
    `${isAr ? 'جهة المنح:' : 'CAB:'} ${isAr ? v.cabLegalNameAr : v.cabLegalNameEn}   |   ${isAr ? 'العرض والرسوم:' : 'Offer & Fee:'} ${v.offerRef} (${isAr ? v.totalFeeAr : v.totalFeeEn})`,
    `${isAr ? 'المواصفات:' : 'Standards:'} ${(v.standards ?? []).join(', ')}   |   ${isAr ? 'المواقع:' : 'Sites:'} ${v.sitesCount}`,
    `${isAr ? 'النطاق:' : 'Scope:'} ${isAr ? v.scopeAr : v.scopeEn}`,
  ]

  ctx.fillStyle = '#1e293b'
  ctx.font = `bold 19px ${font}`
  const padX = isAr ? xStart - 24 : xStart + 24
  summaryRows.forEach((row, idx) => {
    ctx.fillText(row, padX, y + 40 + idx * 38, CONTENT_W - 48)
  })
  y += 215

  // Clauses
  const validSections = agreement.sections.filter(
    (s) =>
      (isAr ? s.titleAr?.trim() : s.titleEn?.trim()) ||
      (isAr ? s.textAr?.trim() : s.textEn?.trim()),
  )

  validSections.forEach((sec, idx) => {
    const title = `${idx + 1}. ${(isAr ? sec.titleAr || sec.titleEn : sec.titleEn || sec.titleAr) ?? ''}`
    const rawBody =
      (isAr ? sec.textAr || sec.textEn : sec.textEn || sec.textAr) ?? ''
    const body = renderAgreementClauseText(rawBody, v)

    ctx.font = `19px ${font}`
    const bodyLines = wrapText(ctx, body, CONTENT_W - 40)
    const blockH = 52 + bodyLines.length * 28 + 18

    if (y + blockH > PAGE_H - 110) {
      pageIndex += 1
      const next = createPage(pageIndex)
      ctx = next.ctx
      y = next.y
      xStart = next.xStart
    }

    ctx.fillStyle = '#fcfcfd'
    ctx.strokeStyle = '#ececec'
    ctx.lineWidth = 1.5
    ctx.fillRect(MARGIN, y, CONTENT_W, blockH)
    ctx.strokeRect(MARGIN, y, CONTENT_W, blockH)

    ctx.fillStyle = '#1236a3'
    ctx.font = `bold 21px ${font}`
    const innerX = isAr ? xStart - 20 : xStart + 20
    ctx.fillText(title, innerX, y + 34)

    ctx.fillStyle = '#334155'
    ctx.font = `19px ${font}`
    bodyLines.forEach((line, lIdx) => {
      ctx.fillText(line, innerX, y + 68 + lIdx * 28)
    })

    y += blockH + 16
  })

  // Signatures Block
  if (y + 210 > PAGE_H - 90) {
    pageIndex += 1
    const next = createPage(pageIndex)
    ctx = next.ctx
    y = next.y
    xStart = next.xStart
  }

  const boxW = (CONTENT_W - 28) / 2
  const sigBoxes = [
    {
      x: MARGIN,
      header: isAr ? 'توقيع العميل الإلكتروني' : 'Client Electronic Signature',
      name:
        agreement.clientSignature?.signerName ??
        (isAr ? v.signatoryAr : v.signatoryEn),
      meta:
        agreement.clientSignature?.signedAt ??
        (isAr ? 'بانتظار التوقيع الإلكتروني' : 'Pending electronic signature'),
      hash: agreement.clientSignature?.fingerprint ?? '',
    },
    {
      x: MARGIN + boxW + 28,
      header: isAr
        ? 'توقيع جهة المنح (iCASCO)'
        : 'Certification Body Signature (iCASCO)',
      name: agreement.cabSignature?.signerName ?? 'Mohamed El Manawahly',
      meta:
        agreement.cabSignature?.signedAt ??
        (isAr ? 'بانتظار التوقيع المشترك' : 'Pending countersignature'),
      hash: agreement.cabSignature?.fingerprint ?? '',
    },
  ]

  sigBoxes.forEach((b) => {
    ctx.fillStyle = '#f8fafc'
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1.5
    ctx.fillRect(b.x, y, boxW, 175)
    ctx.strokeRect(b.x, y, boxW, 175)

    const bx = isAr ? b.x + boxW - 20 : b.x + 20
    ctx.fillStyle = '#1236a3'
    ctx.font = `bold 18px ${font}`
    ctx.fillText(b.header, bx, y + 36)

    ctx.fillStyle = '#111827'
    ctx.font = `bold 20px ${font}`
    ctx.fillText(b.name, bx, y + 74, boxW - 40)

    ctx.fillStyle = '#475569'
    ctx.font = `17px ${font}`
    ctx.fillText(b.meta, bx, y + 108, boxW - 40)

    if (b.hash) {
      ctx.fillStyle = '#15803d'
      ctx.font = `15px monospace`
      ctx.fillText(b.hash, bx, y + 144, boxW - 40)
    }
  })

  const jpegPages = canvases.map((c) =>
    dataUrlToBytes(c.toDataURL('image/jpeg', 0.92)),
  )
  const pdfBlob = buildPdfFromJpegPages(jpegPages)
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${agreement.reference.replace(/\s+/g, '-')}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
