import { cn } from '@/lib/utils'

export type DocumentIconKey =
  | 'documentarySystem'
  | 'organizationalStructure'
  | 'commercialRegistry'
  | 'vatCertificate'
  | 'brandImage'
  | 'nationalAddress'
  | 'qualityPolicy'
  | 'other'

export const documentIconSources: Record<DocumentIconKey, string> = {
  documentarySystem: '/entity-documents/doc-1.svg',
  organizationalStructure: '/entity-documents/doc-2.svg',
  commercialRegistry: '/entity-documents/doc-4.svg',
  vatCertificate: '/entity-documents/doc-4.svg',
  brandImage: '/entity-documents/doc-5.svg',
  nationalAddress: '/entity-documents/doc-6.svg',
  qualityPolicy: '/entity-documents/doc-7.svg',
  other: '/entity-documents/document-text.svg',
}

interface DocumentIconProps {
  icon: DocumentIconKey
  uploaded?: boolean
  className?: string
}

export function DocumentIcon({ icon, uploaded = false, className }: DocumentIconProps) {
  const src = documentIconSources[icon]

  return (
    <span
      className={cn(
        'shrink-0 bg-current',
        uploaded ? 'text-[#26a65b]' : 'text-primary',
        className
      )}
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
      aria-hidden
    />
  )
}
