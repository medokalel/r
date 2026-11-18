export interface TableColumn<T> {
  header: string
  value: (row: T, index: number) => string | number
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

export function downloadExcelCsv<T>(
  filename: string,
  columns: TableColumn<T>[],
  rows: T[],
) {
  const header = columns.map((column) => escapeCsv(column.header)).join(',')
  const body = rows
    .map((row, index) =>
      columns.map((column) => escapeCsv(column.value(row, index))).join(','),
    )
    .join('\n')

  const blob = new Blob([`\uFEFF${header}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
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

function buildLandscapePdfBlob(
  pages: Uint8Array<ArrayBuffer>[],
  pxW: number,
  pxH: number,
): Blob {
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

  const pageIds = pages.map((_, i) => 3 + i * 3)
  startObj(2)
  pushStr(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  )
  endObj()

  pages.forEach((jpeg, idx) => {
    const pageId = 3 + idx * 3
    const contentId = pageId + 1
    const imageId = pageId + 2

    startObj(pageId)
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    endObj()

    const streamCmd = 'q 841.89 0 0 595.28 0 0 cm /Im0 Do Q'
    startObj(contentId)
    pushStr(`<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}\nendstream`)
    endObj()

    startObj(imageId)
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
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

export function downloadPdfFromTable<T>(
  filename: string,
  title: string,
  columns: TableColumn<T>[],
  rows: T[],
) {
  const W = 1754
  const H = 1240
  const MARGIN = 60
  const TABLE_W = W - MARGIN * 2
  const colW = TABLE_W / Math.max(columns.length, 1)
  const font = "'Segoe UI', Tahoma, Arial, sans-serif"
  const ROWS_PER_PAGE = 16
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  const canvases: HTMLCanvasElement[] = []

  for (let p = 0; p < totalPages; p++) {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Header
    ctx.fillStyle = '#1236a3'
    ctx.font = `bold 28px ${font}`
    ctx.fillText(`iCASCO — ${title}`, MARGIN, 80)

    ctx.fillStyle = '#64748b'
    ctx.font = `16px ${font}`
    ctx.fillText(
      `Page ${p + 1} of ${totalPages}  ·  Total records: ${rows.length}`,
      MARGIN,
      110,
    )

    // Table Header Bar
    let y = 135
    const headerH = 52
    ctx.fillStyle = '#1236a3'
    ctx.fillRect(MARGIN, y, TABLE_W, headerH)

    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 17px ${font}`
    columns.forEach((col, cIdx) => {
      ctx.fillText(col.header, MARGIN + cIdx * colW + 14, y + 32, colW - 24)
    })
    y += headerH

    const slice = rows.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE)
    const rowH = 56
    slice.forEach((row, rIdx) => {
      const globalIdx = p * ROWS_PER_PAGE + rIdx
      ctx.fillStyle = rIdx % 2 === 1 ? '#f9fafc' : '#ffffff'
      ctx.fillRect(MARGIN, y, TABLE_W, rowH)

      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(MARGIN, y, TABLE_W, rowH)

      ctx.fillStyle = '#1e293b'
      ctx.font = `16px ${font}`
      columns.forEach((col, cIdx) => {
        const text = String(col.value(row, globalIdx) ?? '')
        ctx.fillText(text, MARGIN + cIdx * colW + 14, y + 34, colW - 24)
      })
      y += rowH
    })

    canvases.push(canvas)
  }

  const jpegPages = canvases.map((c) =>
    dataUrlToBytes(c.toDataURL('image/jpeg', 0.92)),
  )
  const pdfBlob = buildLandscapePdfBlob(jpegPages, W, H)
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function buildTableHtml<T>(
  title: string,
  columns: TableColumn<T>[],
  rows: T[],
  pageTitle?: string,
) {
  const head = columns.map((column) => `<th>${column.header}</th>`).join('')
  const body = rows
    .map((row, index) => {
      const cells = columns
        .map((column) => `<td>${column.value(row, index)}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${pageTitle ?? title}</title><style>@page { size: A4 landscape; margin: 10mm; } body { font-family: Arial, sans-serif; padding: 12px; color: #111; margin: 0; } h1 { font-size: 18px; margin: 0 0 12px; color: #1236a3; } table { width: 100%; border-collapse: collapse; font-size: 10.5px; } th, td { border: 1px solid #e2e2e2; padding: 7px 8px; text-align: start; white-space: nowrap; } th { background: #1236a3; color: #fff; }</style></head><body><h1>${title}</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

function buildFieldsHtml(
  title: string,
  fields: { label: string; value: string }[],
) {
  const rows = fields
    .map((field) => `<tr><th>${field.label}</th><td>${field.value}</td></tr>`)
    .join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${title}</title><style>body { font-family: Arial, sans-serif; padding: 24px; color: #111; } h1 { font-size: 20px; margin: 0 0 16px; color: #1236a3; } table { width: 100%; border-collapse: collapse; font-size: 13px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: start; } th { width: 35%; background: #f3f6fd; color: #1236a3; }</style></head><body><h1>${title}</h1><table><tbody>${rows}</tbody></table></body></html>`
}

function openHtmlDocument(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function previewTableDocument<T>(
  title: string,
  columns: TableColumn<T>[],
  rows: T[],
) {
  openHtmlDocument(buildTableHtml(title, columns, rows))
}

export function printTableDocument<T>(
  title: string,
  columns: TableColumn<T>[],
  rows: T[],
) {
  downloadPdfFromTable(`${title}.pdf`, title, columns, rows)
}

export function previewFieldsDocument(
  title: string,
  fields: { label: string; value: string }[],
) {
  openHtmlDocument(buildFieldsHtml(title, fields))
}

export function printFieldsDocument(
  title: string,
  fields: { label: string; value: string }[],
) {
  downloadFieldsDocument(title, title, fields)
}

export function downloadFieldsDocument(
  filename: string,
  title: string,
  fields: { label: string; value: string }[],
) {
  const blob = new Blob([buildFieldsHtml(title, fields)], {
    type: 'text/html;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function matchesSearch(
  values: Array<string | number | null | undefined>,
  query: string,
) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(normalized),
  )
}
