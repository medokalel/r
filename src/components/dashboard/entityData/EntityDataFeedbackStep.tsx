import { useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, AttachIcon, BoldIcon, ExternalLinkIcon, LinkIcon, UserIcon } from '@/components/icons'
import { fieldTitleClassName } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

type MessageAuthor = 'reviewer' | 'applicant'

interface FeedbackMessage {
  id: string
  author: MessageAuthor
  name: string
  role: string
  timestamp: string
  text: string
  attachments?: string[]
  showCommentLink?: boolean
}

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/
const BOLD_RE = /\*\*([^*]+)\*\*/

/** Renders **bold** and [text](url) markdown inline for message bodies. */
function renderRichText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const link = rest.match(LINK_RE)
    const bold = rest.match(BOLD_RE)
    const linkAt = link ? link.index! : Infinity
    const boldAt = bold ? bold.index! : Infinity
    if (linkAt === Infinity && boldAt === Infinity) {
      nodes.push(rest)
      break
    }
    if (linkAt < boldAt) {
      if (linkAt > 0) nodes.push(rest.slice(0, linkAt))
      nodes.push(
        <a
          key={key++}
          href={link![2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {link![1]}
        </a>
      )
      rest = rest.slice(linkAt + link![0].length)
    } else {
      if (boldAt > 0) nodes.push(rest.slice(0, boldAt))
      nodes.push(
        <strong key={key++} className="font-semibold">
          {bold![1]}
        </strong>
      )
      rest = rest.slice(boldAt + bold![0].length)
    }
  }
  return nodes
}

function TimelineDot({ variant }: { variant: 'primary' | 'muted' }) {
  return (
    <span
      className={cn(
        'mt-1 size-6 shrink-0 rounded-full border-4 border-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]',
        variant === 'primary' ? 'bg-primary' : 'bg-[#7c7c7c]'
      )}
      aria-hidden
    />
  )
}

function ComposerToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[var(--radius-sm)] p-2 text-neutral-600 hover:bg-white"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function AttachmentChips({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#d1dbfa] bg-[#f3f6fd] px-2.5 py-1 text-[13px] text-neutral-700"
        >
          <AppIcon icon={AttachIcon} size={14} className="text-primary" />
          {name}
        </span>
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: FeedbackMessage }) {
  const { t } = useTranslation()
  const isReviewer = message.author === 'reviewer'

  return (
    <div className={cn('flex items-start gap-5', !isReviewer && 'justify-end')}>
      {isReviewer && <TimelineDot variant="primary" />}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-[15px] rounded-[var(--radius-md)] p-[25px]',
          isReviewer
            ? 'border border-[#a3b8f5] bg-[rgba(232,237,252,0.5)]'
            : 'border border-[#989898] bg-[#f4f4f4]'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isReviewer ? (
              <UserAvatar
                alt={message.name}
                className="size-10 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#7c7c7c]">
                <AppIcon icon={UserIcon} size={24} className="text-white" />
              </span>
            )}
            <div>
              <p className={cn(fieldTitleClassName, 'text-neutral-900')}>{message.name}</p>
              <p className={cn('text-[12px] leading-normal', isReviewer ? 'text-neutral-600' : 'text-[#7c7c7c]')}>
                {message.role}
              </p>
            </div>
          </div>
          <time className={cn('text-[14px] leading-[1.6]', isReviewer ? 'text-neutral-600' : 'text-[#7c7c7c]')}>
            {message.timestamp}
          </time>
        </div>

        <p className="whitespace-pre-wrap text-[16px] leading-[1.6] text-neutral-900">
          {renderRichText(message.text)}
        </p>

        {message.attachments && message.attachments.length > 0 && (
          <AttachmentChips names={message.attachments} />
        )}

        {message.showCommentLink && (
          <Button
            type="button"
            variant="primary"
            className="h-12 w-fit gap-2 rounded-[var(--radius-sm)] px-6 text-[14px] font-semibold"
          >
            {t('accreditation.entityData.feedback.goToCommentReview')}
            <AppIcon icon={ExternalLinkIcon} size={14} className="text-white" />
          </Button>
        )}
      </div>
      {!isReviewer && <TimelineDot variant="muted" />}
    </div>
  )
}

export function EntityDataFeedbackStep() {
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const applicantName =
    session?.user?.email ?? t('accreditation.entityData.feedback.applicantName')
  const applicantRole = session?.role?.name ?? t('accreditation.entityData.feedback.applicantRole')

  const [reply, setReply] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)

  // TODO: backend integration — استبدل الدالة دي بنداء API حقيقي لما الـ endpoint يجهز

  // useEffect(() => {
  //   setLoading(true)
  //   getApplicationFeedback(applicationId)
  //     .then(setMessages)
  //     .finally(() => setLoading(false))
  // }, [applicationId])
  const loadFeedbackMessages = (): FeedbackMessage[] => []

  const [messages, setMessages] = useState<FeedbackMessage[]>(loadFeedbackMessages)

  const formatNow = () =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

  /** Wraps the current selection (or inserts a placeholder) with markers. */
  const surroundSelection = (before: string, after: string, placeholder: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = reply.slice(start, end) || placeholder
    const next = reply.slice(0, start) + before + selected + after + reply.slice(end)
    setReply(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + before.length + selected.length
      el.setSelectionRange(caret, caret)
    })
  }

  const applyBold = () => surroundSelection('**', '**', t('accreditation.entityData.feedback.boldPlaceholder'))

  const insertLink = () => {
    const url = window.prompt(t('accreditation.entityData.feedback.linkPrompt'))
    if (!url) return
    const el = textareaRef.current
    const selected =
      el && el.selectionStart !== el.selectionEnd
        ? reply.slice(el.selectionStart, el.selectionEnd)
        : t('accreditation.entityData.feedback.linkText')
    surroundSelection(`[${selected}](`, ')', url)
  }

  const onSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(event.target.files ?? []).map((file) => file.name)
    if (names.length) setAttachments((prev) => [...prev, ...names])
    event.target.value = ''
  }

  const canSend = reply.trim().length > 0 || attachments.length > 0

  const sendReply = () => {
    if (!canSend) return
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: 'applicant',
        name: applicantName,
        role: applicantRole,
        timestamp: formatNow(),
        text: reply.trim(),
        attachments: attachments.length ? attachments : undefined,
      },
    ])
    setReply('')
    setAttachments([])
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
      {loading ? (
        <p className="text-center text-[14px] text-neutral-500">
          {t('accreditation.entityData.feedback.loading')}
        </p>
      ) : messages.length === 0 ? (
        <p className="text-center text-[14px] text-neutral-500">
          {t('accreditation.entityData.feedback.noFeedback')}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>

      <div className="rounded-[var(--radius-md)] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_6px_20px_rgba(153,155,168,0.1)]">
        <div className="rounded-[var(--radius-md)] bg-[#f4f4f4] p-2">
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                sendReply()
              }
            }}
            placeholder={t('accreditation.entityData.feedback.replyPlaceholder')}
            className="min-h-24 w-full resize-none rounded-[var(--radius-md)] border-0 bg-transparent p-4 text-[16px] leading-[1.6] text-neutral-900 placeholder:text-[#989898] focus:outline-none focus:ring-0"
          />

          {attachments.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((name, index) => (
                  <span
                    key={`${name}-${index}`}
                    className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[#d1dbfa] bg-white px-2.5 py-1 text-[13px] text-neutral-700"
                  >
                    <AppIcon icon={AttachIcon} size={14} className="text-primary" />
                    {name}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                      className="text-neutral-400 hover:text-error-500"
                      aria-label={t('accreditation.entityData.feedback.removeAttachment')}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#bdbdbd] px-4 pb-4 pt-[17px]">
            <div className="flex items-center gap-4">
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.bold')} onClick={applyBold}>
                <AppIcon icon={BoldIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-[#bdbdbd]" aria-hidden />
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.insertLink')} onClick={insertLink}>
                <AppIcon icon={LinkIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-[#bdbdbd]" aria-hidden />
              <ComposerToolbarButton
                label={t('accreditation.entityData.feedback.attach')}
                onClick={() => fileInputRef.current?.click()}
              >
                <AppIcon icon={AttachIcon} size={20} />
              </ComposerToolbarButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onSelectFiles}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={sendReply}
              disabled={!canSend}
              className="h-12 rounded-[var(--radius-sm)] px-6 text-[16px] font-semibold"
            >
              {t('accreditation.entityData.feedback.sendReply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
