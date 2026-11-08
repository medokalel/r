import { getImportLists } from '@/lib/api/dataMigrationMockData'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import { buildTemplateSheets, templateFileName, type ImportLanguage, type Translate } from '@/lib/dataMigrationForm'
import type { ImportEntityKey } from '@/lib/dataMigrationTypes'
import { downloadXlsxWorkbook } from '@/lib/xlsxDownload'

/** Builds the template of an area, downloads it and returns the file name. */
export function downloadImportTemplate(
  entityKey: ImportEntityKey,
  language: ImportLanguage,
  translate: Translate,
): string {
  const fileName = templateFileName(entityKey)
  downloadXlsxWorkbook(fileName, buildTemplateSheets(getImportEntity(entityKey), language, getImportLists(), translate))
  return fileName
}