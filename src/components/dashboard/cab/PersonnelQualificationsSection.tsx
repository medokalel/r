import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddCircleIcon, AppIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import {
  fieldHeightClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import {
  createCabEmployeeQualificationCategory,
  deleteCabEmployeeQualification,
  uploadCabEmployeeQualification,
  uploadStagedCabEmployeeQualification,
} from '@/lib/api/cabEmployeesApi'
import { ApiError } from '@/lib/api/client'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { cn } from '@/lib/utils'
import {
  formatFileSize,
  mapBackendQualificationToFile,
  MAX_QUALIFICATION_BYTES,
  normalizeCategoryName,
  QUALIFICATION_ACCEPT,
  SUGGESTED_CATEGORIES,
  type QualificationCategoryItem,
} from '@/components/dashboard/cab/personnelFormHelpers'

export interface PersonnelQualificationsSectionProps {
  savedEmployeeId?: string
  qualCategories: QualificationCategoryItem[]
  onChangeQualCategories: React.Dispatch<React.SetStateAction<QualificationCategoryItem[]>>
  uncategorizedFiles: UploadedDocumentFile[]
  onChangeUncategorizedFiles: React.Dispatch<React.SetStateAction<UploadedDocumentFile[]>>
  loadingQuals: boolean
  isSubmitting: boolean
  onBusyChange: (busy: boolean) => void
  onError: (message: string, details?: string[]) => void
}

export function PersonnelQualificationsSection({
  savedEmployeeId,
  qualCategories,
  onChangeQualCategories,
  uncategorizedFiles,
  onChangeUncategorizedFiles,
  loadingQuals,
  isSubmitting,
  onBusyChange,
  onError,
}: PersonnelQualificationsSectionProps) {
  const { t, i18n } = useTranslation()
  const label = (key: string, fallback?: string) =>
    t(`cab.competence.memberProfile.${key}`, fallback ?? key)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null)

  const setCreatingState = (val: boolean) => {
    setCreatingCategory(val)
    onBusyChange(val || Boolean(busyCategoryId))
  }

  const setBusyCategoryState = (id: string | null) => {
    setBusyCategoryId(id)
    onBusyChange(creatingCategory || Boolean(id))
  }

  const handleAddCategory = async (rawName?: string) => {
    const trimmed = (rawName ?? newCategoryName).trim().replace(/\s+/g, ' ')
    if (!trimmed) return

    const normalized = normalizeCategoryName(trimmed)
    const duplicate = qualCategories.some(
      (cat) => normalizeCategoryName(cat.name) === normalized,
    )
    if (duplicate) {
      onError(
        t(
          'cab.competence.qualifications.duplicateCategory',
          'A qualification category with this name already exists for this employee.',
        ),
      )
      return
    }

    onError('', [])

    if (savedEmployeeId) {
      setCreatingState(true)
      try {
        const { category } = await createCabEmployeeQualificationCategory(
          savedEmployeeId,
          trimmed,
        )
        onChangeQualCategories((prev) => [
          ...prev.filter((c) => c.isPersisted || c.isExplicit || c.documents.length > 0),
          {
            id: category.id,
            isPersisted: true,
            isExplicit: true,
            name: category.name,
            documents: (category.documents ?? []).map((doc) =>
              mapBackendQualificationToFile(doc, i18n.language),
            ),
          },
        ])
        if (!rawName) setNewCategoryName('')
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message, err.errors ?? [])
        } else {
          onError(
            t(
              'cab.competence.qualifications.createCategoryFailed',
              'Could not create qualification category.',
            ),
          )
        }
      } finally {
        setCreatingState(false)
      }
    } else {
      onChangeQualCategories((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          isPersisted: false,
          isExplicit: true,
          name: trimmed,
          documents: [],
        },
      ])
      if (!rawName) setNewCategoryName('')
    }
  }

  const handleSelectCategoryFile = async (category: QualificationCategoryItem, file: File) => {
    if (file.size > MAX_QUALIFICATION_BYTES) {
      onError(
        t('cab.competence.messages.fileTooLarge', 'File size exceeds the 20 MB limit.'),
      )
      return
    }
    onError('', [])
    setBusyCategoryState(category.id)

    try {
      if (savedEmployeeId) {
        let targetCategoryId = category.isPersisted ? category.id : undefined

        if (!targetCategoryId) {
          const { category: createdCat } = await createCabEmployeeQualificationCategory(
            savedEmployeeId,
            category.name,
          )
          targetCategoryId = createdCat.id
          onChangeQualCategories((prev) =>
            prev.map((c) =>
              c.id === category.id
                ? {
                    ...c,
                    id: createdCat.id,
                    isPersisted: true,
                    isExplicit: true,
                    name: createdCat.name,
                  }
                : c,
            ),
          )
        }

        const { qualification } = await uploadCabEmployeeQualification(savedEmployeeId, file, {
          categoryId: targetCategoryId,
          documentType: category.name,
        })

        const uploadedFile = mapBackendQualificationToFile(qualification, i18n.language)
        onChangeQualCategories((prev) =>
          prev.map((c) =>
            c.id === category.id || c.id === targetCategoryId
              ? { ...c, documents: [uploadedFile, ...c.documents] }
              : c,
          ),
        )
      } else {
        const staged = await uploadStagedCabEmployeeQualification(file)
        const stagedDoc: QualificationCategoryItem['documents'][number] = {
          id: staged.uploadId,
          uploadId: staged.uploadId,
          name: staged.originalName || file.name,
          sizeLabel: formatFileSize(staged.fileSize || file.size),
          dateLabel: new Intl.DateTimeFormat(i18n.language, {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }).format(new Date()),
          url: resolvePublicAssetUrl(staged.fileUrl) || URL.createObjectURL(file),
        }

        onChangeQualCategories((prev) =>
          prev.map((c) =>
            c.id === category.id
              ? { ...c, isExplicit: true, documents: [stagedDoc, ...c.documents] }
              : c,
          ),
        )
      }
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message, err.errors ?? [])
      } else {
        onError(
          t(
            'cab.competence.messages.uploadFailed',
            'The file could not be uploaded. Please try again.',
          ),
        )
      }
    } finally {
      setBusyCategoryState(null)
    }
  }

  const handleDeleteCategoryFile = async (
    category: QualificationCategoryItem,
    docId: string,
  ) => {
    const targetDoc = category.documents.find((d) => d.id === docId)
    if (!targetDoc) return

    onError('', [])

    if (targetDoc.uploadId && !savedEmployeeId) {
      if (targetDoc.url?.startsWith('blob:')) {
        URL.revokeObjectURL(targetDoc.url)
      }
      onChangeQualCategories((prev) =>
        prev.map((c) =>
          c.id === category.id
            ? { ...c, documents: c.documents.filter((d) => d.id !== docId) }
            : c,
        ),
      )
      return
    }

    if (savedEmployeeId) {
      setBusyCategoryState(category.id)
      try {
        await deleteCabEmployeeQualification(savedEmployeeId, docId)
        onChangeQualCategories((prev) =>
          prev.map((c) =>
            c.id === category.id
              ? { ...c, documents: c.documents.filter((d) => d.id !== docId) }
              : c,
          ),
        )
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message, err.errors ?? [])
        } else {
          onError(
            t(
              'cab.competence.messages.deleteFailed',
              'The file could not be deleted. Please try again.',
            ),
          )
        }
      } finally {
        setBusyCategoryState(null)
      }
    }
  }

  const handleDeleteUncategorizedFile = async (docId: string) => {
    if (!savedEmployeeId) return
    setBusyCategoryState('uncategorized')
    try {
      await deleteCabEmployeeQualification(savedEmployeeId, docId)
      onChangeUncategorizedFiles((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message, err.errors ?? [])
      }
    } finally {
      setBusyCategoryState(null)
    }
  }

  const handleOpenQualFile = (file: UploadedDocumentFile) => {
    if (file.url) {
      window.open(resolvePublicAssetUrl(file.url), '_blank', 'noopener,noreferrer')
    }
  }

  const unusedSuggestions = SUGGESTED_CATEGORIES.filter(
    (suggestion) =>
      !qualCategories.some(
        (cat) => normalizeCategoryName(cat.name) === normalizeCategoryName(suggestion),
      ),
  )

  return (
    <div className="md:col-span-2 space-y-4 border-t border-[#ececec] pt-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className={`block ${fieldLabelClassName}`}>
            {label('qualifications', 'Qualifications & Document Categories')}
          </span>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {t(
              'cab.competence.qualifications.subtitle',
              'Create qualification categories and upload supporting certificates (PDF, Word, Excel, Images — max 20 MB).',
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAddCategory()
              }
            }}
            placeholder={t(
              'cab.competence.qualifications.categoryPlaceholder',
              'e.g. Auditor Certificates, Academic Degrees...',
            )}
            maxLength={100}
            className={cn(fieldInputClassName, fieldHeightClassName, 'flex-1 bg-white')}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!newCategoryName.trim() || creatingCategory}
            icon={<AppIcon icon={AddCircleIcon} size={18} />}
            onClick={() => void handleAddCategory()}
            className="h-12 shrink-0 whitespace-nowrap"
          >
            {creatingCategory
              ? t('common.loading', 'Loading...')
              : t('cab.competence.qualifications.addCategory', 'Add category')}
          </Button>
        </div>

        {unusedSuggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-neutral-500">
              {t('cab.competence.qualifications.suggestedCategories', 'Quick add:')}
            </span>
            {unusedSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={creatingCategory}
                onClick={() => void handleAddCategory(suggestion)}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-[#1236a3] transition-colors hover:bg-[#dbe4fb] disabled:opacity-50"
              >
                <span>+</span>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col divide-y divide-[#f0f0f0] rounded-[12px] border border-dashed border-primary/30 bg-white p-3">
        {qualCategories.map((category) => (
          <div key={category.id} className="py-1 first:pt-0 last:pb-0">
            <DocumentUploadField
              title={category.name}
              note={t(
                'cab.competence.qualificationsDesc',
                'PDF, Word, Excel, Images (max 20 MB)',
              )}
              files={category.documents}
              busy={
                loadingQuals ||
                isSubmitting ||
                busyCategoryId === category.id
              }
              accept={QUALIFICATION_ACCEPT}
              onSelectFile={(file) => void handleSelectCategoryFile(category, file)}
              onDeleteFile={(docId) => void handleDeleteCategoryFile(category, docId)}
              onOpenFile={handleOpenQualFile}
            />
          </div>
        ))}

        {uncategorizedFiles.length > 0 && (
          <div className="py-1 first:pt-0 last:pb-0">
            <DocumentUploadField
              title={t(
                'cab.competence.qualifications.generalDocuments',
                'General Qualification Documents',
              )}
              note={t(
                'cab.competence.qualificationsDesc',
                'PDF, Word, Excel, Images (max 20 MB)',
              )}
              files={uncategorizedFiles}
              busy={
                loadingQuals ||
                isSubmitting ||
                busyCategoryId === 'uncategorized'
              }
              accept={QUALIFICATION_ACCEPT}
              onDeleteFile={(docId) => void handleDeleteUncategorizedFile(docId)}
              onOpenFile={handleOpenQualFile}
            />
          </div>
        )}
      </div>
    </div>
  )
}
