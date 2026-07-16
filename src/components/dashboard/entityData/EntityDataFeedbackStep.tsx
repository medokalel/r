import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, AttachIcon, BoldIcon, ExternalLinkIcon, LinkIcon, UserIcon } from '@/components/icons'
import { fieldTitleClassName } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'

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
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="rounded-[var(--radius-sm)] p-2 text-neutral-600 hover:bg-white"
      aria-label={label}
    >
      {children}
    </button>
  )
}

export function EntityDataFeedbackStep() {
  const { t } = useTranslation()
  const [reply, setReply] = useState('')

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-5">
            <TimelineDot variant="primary" />
            <div className="flex min-w-0 flex-1 flex-col gap-[15px] rounded-[var(--radius-md)] border border-[#a3b8f5] bg-[rgba(232,237,252,0.5)] p-[25px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    alt={t('accreditation.entityData.feedback.reviewerName')}
                    className="size-10 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
                  />
                  <div>
                    <p className={cn(fieldTitleClassName, 'text-neutral-900')}>
                      {t('accreditation.entityData.feedback.reviewerName')}
                    </p>
                    <p className="text-[12px] leading-normal text-neutral-600">
                      {t('accreditation.entityData.feedback.reviewerRole')}
                    </p>
                  </div>
                </div>
                <time className="text-[14px] leading-[1.6] text-neutral-600">
                  {t('accreditation.entityData.feedback.reviewerTimestamp')}
                </time>
              </div>

              <p className="whitespace-pre-wrap text-[16px] leading-[1.6] text-neutral-900">
                {t('accreditation.entityData.feedback.reviewerMessage')}
              </p>

              <Button
                type="button"
                variant="primary"
                className="h-12 w-fit gap-2 rounded-[var(--radius-sm)] px-6 text-[14px] font-semibold"
              >
                {t('accreditation.entityData.feedback.goToCommentReview')}
                <AppIcon icon={ExternalLinkIcon} size={14} className="text-white" />
              </Button>
            </div>
          </div>

          <div className="flex items-start justify-end gap-5">
            <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#989898] bg-[#f4f4f4] p-[25px]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#7c7c7c]">
                      <AppIcon icon={UserIcon} size={24} className="text-white" />
                    </span>
                    <div>
                      <p className={cn(fieldTitleClassName, 'text-neutral-900')}>
                        {t('accreditation.entityData.feedback.applicantName')}
                      </p>
                      <p className="text-[12px] leading-normal text-[#7c7c7c]">
                        {t('accreditation.entityData.feedback.applicantRole')}
                      </p>
                    </div>
                  </div>
                  <time className="text-[14px] leading-[1.6] text-[#7c7c7c]">
                    {t('accreditation.entityData.feedback.applicantTimestamp')}
                  </time>
                </div>

                <p className="text-[16px] leading-[1.6] text-neutral-900">
                  {t('accreditation.entityData.feedback.applicantMessage')}
                </p>
              </div>
            </div>
            <TimelineDot variant="muted" />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_6px_20px_rgba(153,155,168,0.1)]">
        <div className="rounded-[var(--radius-md)] bg-[#f4f4f4] p-2">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder={t('accreditation.entityData.feedback.replyPlaceholder')}
            className="min-h-24 w-full resize-none rounded-[var(--radius-md)] border-0 bg-transparent p-4 text-[16px] leading-[1.6] text-neutral-900 placeholder:text-[#989898] focus:outline-none focus:ring-0"
          />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#bdbdbd] px-4 pb-4 pt-[17px]">
            <div className="flex items-center gap-4">
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.bold')}>
                <AppIcon icon={BoldIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-[#bdbdbd]" aria-hidden />
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.insertLink')}>
                <AppIcon icon={LinkIcon} size={20} />
              </ComposerToolbarButton>
              <span className="h-6 w-px bg-[#bdbdbd]" aria-hidden />
              <ComposerToolbarButton label={t('accreditation.entityData.feedback.attach')}>
                <AppIcon icon={AttachIcon} size={20} />
              </ComposerToolbarButton>
            </div>
            <Button
              type="button"
              variant="primary"
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
