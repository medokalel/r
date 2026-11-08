/**
 * Reads an uploaded import file (.csv or .xlsx) into plain cells, in the
 * browser, without a spreadsheet library. An .xlsx file is a zip of XML parts:
 * we read the zip directory, inflate the parts we need with the browser's
 * `DecompressionStream`, and pick the cells out of the sheet XML.
 *
 * Everything here only turns bytes into rows. Which column is which, and
 * whether a value is valid, is decided in `dataMigrationForm.ts`.
 */
import type { ImportErrorCode, ImportTable } from '@/lib/dataMigrationTypes'

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
export const MAX_IMPORT_ROWS = 5000

/** The sheet of the iCASCO template that holds the records. */
export const TEMPLATE_DATA_SHEET = 'Data'

export class ImportFileError extends Error {
  code: ImportErrorCode

  constructor(code: ImportErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'ImportFileError'
    this.code = code
  }
}

// ---------------------------------------------------------------- CSV

function detectDelimiter(firstLine: string): string {
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = 0
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1
    if (count > bestCount) {
      best = candidate
      bestCount = count
    }
  }
  return best
}

/** Parses CSV text: quoted cells, doubled quotes, CRLF, and a `,` `;` or tab delimiter. */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  const endRow = () => {
    endCell()
    rows.push(row)
    row = []
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      endCell()
    } else if (char === '\n') {
      endRow()
    } else if (char === '\r') {
      if (text[index + 1] === '\n') index += 1
      endRow()
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) endRow()
  return rows
}

// ---------------------------------------------------------------- ZIP

interface ZipEntry {
  name: string
  method: number
  compressedSize: number
  localHeaderOffset: number
}

const decoder = new TextDecoder('utf-8')

function readZipDirectory(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  const lowest = Math.max(0, bytes.length - 22 - 0xffff)
  for (let offset = bytes.length - 22; offset >= lowest; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset
      break
    }
  }
  if (eocd < 0) throw new ImportFileError('FILE_UNREADABLE', 'Not a zip file.')

  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const entries = new Map<string, ZipEntry>()
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new ImportFileError('FILE_UNREADABLE', 'Broken zip directory.')
    }
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    entries.set(name, { name, method, compressedSize, localHeaderOffset })
    offset += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function readZipEntry(bytes: Uint8Array, entry: ZipEntry): Promise<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(entry.localHeaderOffset, true) !== 0x04034b50) {
    throw new ImportFileError('FILE_UNREADABLE', 'Broken zip entry.')
  }
  const nameLength = view.getUint16(entry.localHeaderOffset + 26, true)
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true)
  const start = entry.localHeaderOffset + 30 + nameLength + extraLength
  const raw = bytes.subarray(start, start + entry.compressedSize)
  if (entry.method === 0) return decoder.decode(raw)
  if (entry.method === 8) return decoder.decode(await inflateRaw(raw))
  throw new ImportFileError('FILE_UNREADABLE', `Unsupported zip method ${entry.method}.`)
}

// ---------------------------------------------------------------- XLSX XML

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeXml(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? match
  })
}

function attribute(attributes: string, name: string): string | null {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)
  return match ? decodeXml(match[1]) : null
}

/** All `<t>` text inside a fragment (a shared string can be split into rich-text runs). */
function textOf(fragment: string): string {
  let text = ''
  for (const match of fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) text += decodeXml(match[1])
  return text
}

export function parseSharedStrings(xml: string): string[] {
  return Array.from(xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g), (match) => textOf(match[1]))
}

/** `B3` to the zero-based column index 1. */
function columnIndexOf(reference: string): number {
  let index = 0
  for (const char of reference.replace(/[0-9]/g, '')) index = index * 26 + (char.toUpperCase().charCodeAt(0) - 64)
  return index - 1
}

/** Cells of one sheet as rows (row N of the file is `rows[N - 1]`; gaps are empty strings). */
export function parseSheetXml(xml: string, sharedStrings: string[]): unknown[][] {
  const rows: unknown[][] = []
  for (const rowMatch of xml.matchAll(/<row\s([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(attribute(rowMatch[1], 'r'))
    if (!Number.isFinite(rowNumber) || rowNumber < 1) continue
    const row: unknown[] = []
    for (const cellMatch of (rowMatch[2] ?? '').matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const reference = attribute(cellMatch[1], 'r')
      if (!reference) continue
      const type = attribute(cellMatch[1], 't')
      const body = cellMatch[2] ?? ''
      const rawValue = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1]
      let value: unknown = ''
      if (type === 'inlineStr') value = textOf(body)
      else if (rawValue !== undefined) {
        const text = decodeXml(rawValue)
        if (type === 's') value = sharedStrings[Number(text)] ?? ''
        else if (type === 'b') value = text === '1'
        else if (type === 'str') value = text
        else if (type === 'e') value = ''
        else value = Number.isFinite(Number(text)) && text.trim() !== '' ? Number(text) : text
      }
      const column = columnIndexOf(reference)
      while (row.length < column) row.push('')
      row[column] = value
    }
    while (rows.length < rowNumber - 1) rows.push([])
    rows[rowNumber - 1] = row
  }
  return rows
}

function resolveSheetPath(target: string): string {
  const clean = target.replace(/^\/+/, '')
  return clean.startsWith('xl/') ? clean : `xl/${clean}`
}

/** Reads the `Data` sheet of an iCASCO template, or the first sheet of any other workbook. */
export async function readXlsxTable(buffer: ArrayBuffer): Promise<ImportTable> {
  const bytes = new Uint8Array(buffer)
  const entries = readZipDirectory(bytes)
  const read = async (name: string): Promise<string | null> => {
    const entry = entries.get(name)
    return entry ? readZipEntry(bytes, entry) : null
  }

  const workbook = await read('xl/workbook.xml')
  const relationships = await read('xl/_rels/workbook.xml.rels')
  if (!workbook || !relationships) throw new ImportFileError('FILE_UNREADABLE', 'Not an Excel workbook.')

  const targets = new Map<string, string>()
  for (const match of relationships.matchAll(/<Relationship\s([^>]*?)\/?>/g)) {
    const id = attribute(match[1], 'Id')
    const target = attribute(match[1], 'Target')
    if (id && target) targets.set(id, resolveSheetPath(target))
  }
  const sheets = Array.from(workbook.matchAll(/<sheet\s([^>]*?)\/?>/g), (match) => ({
    name: attribute(match[1], 'name') ?? '',
    path: targets.get(attribute(match[1], 'r:id') ?? ''),
  })).filter((sheet): sheet is { name: string; path: string } => !!sheet.path)
  const sheet = sheets.find((candidate) => candidate.name === TEMPLATE_DATA_SHEET) ?? sheets[0]
  if (!sheet) throw new ImportFileError('FILE_UNREADABLE', 'The workbook has no sheets.')

  const sheetXml = await read(sheet.path)
  if (!sheetXml) throw new ImportFileError('FILE_UNREADABLE', 'The sheet could not be read.')
  const sharedXml = await read('xl/sharedStrings.xml')
  return { rows: parseSheetXml(sheetXml, sharedXml ? parseSharedStrings(sharedXml) : []) }
}

// ---------------------------------------------------------------- entry point

/** Reads a user-selected file into rows, or throws an `ImportFileError`. */
export async function readImportFile(file: File): Promise<ImportTable> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xls')) throw new ImportFileError('XLS_NOT_SUPPORTED')
  if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) throw new ImportFileError('FILE_TYPE')
  if (file.size > MAX_IMPORT_FILE_BYTES) throw new ImportFileError('FILE_TOO_LARGE')

  try {
    if (name.endsWith('.csv')) return { rows: parseCsv(await file.text()) }
    return await readXlsxTable(await file.arrayBuffer())
  } catch (error) {
    if (error instanceof ImportFileError) throw error
    throw new ImportFileError('FILE_UNREADABLE')
  }
}