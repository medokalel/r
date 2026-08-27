import { AppIcon, HeadsetIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'

interface NeedHelpCardProps {
  title: string
  description: string
  contactSupportLabel: string
  onContactSupport?: () => void
}

/** Small bordered sidebar card offering support contact — shared by every
 *  Application Draft step that shows one, so the copy/styling only needs to
 *  change in one place. */
export function NeedHelpCard({ title, description, contactSupportLabel, onContactSupport }: NeedHelpCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
      <h3 className="mb-2 text-[16px] font-semibold text-neutral-900">{title}</h3>
      <p className="mb-4 text-[13px] text-neutral-500">{description}</p>
      <Button type="button" variant="secondary" className="w-full gap-2 rounded-[var(--radius-sm)]" onClick={onContactSupport}>
        <AppIcon icon={HeadsetIcon} size={18} />
        {contactSupportLabel}
      </Button>
    </div>
  )
}