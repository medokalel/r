import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { fieldLabelClassName } from '@/components/ui/fieldStyles'
import {
  fromIsoDate,
  toIsoDate,
  type PersonnelFormState,
} from '@/components/dashboard/cab/personnelFormHelpers'

export interface PersonnelEmploymentSectionProps {
  form: PersonnelFormState
  onChangeForm: React.Dispatch<React.SetStateAction<PersonnelFormState>>
}

export function PersonnelEmploymentSection({
  form,
  onChangeForm,
}: PersonnelEmploymentSectionProps) {
  const { t } = useTranslation()
  const label = (key: string, fallback?: string) =>
    t(`cab.competence.memberProfile.${key}`, fallback ?? key)

  return (
    <div>
      <SectionHeading title={label('employmentDetails')} accordion>
        <div className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={`block ${fieldLabelClassName}`}>{label('startDate')}</span>
              <div className="mt-1">
                <DatePicker
                  value={fromIsoDate(form.employmentStartDate)}
                  onChange={(date) =>
                    onChangeForm((prev) => ({
                      ...prev,
                      employmentStartDate: toIsoDate(date),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <span className={`block ${fieldLabelClassName}`}>{label('endDate')}</span>
              <div className="mt-1">
                <DatePicker
                  disabled={form.currentlyWorksHere}
                  value={
                    form.currentlyWorksHere
                      ? undefined
                      : fromIsoDate(form.employmentEndDate)
                  }
                  onChange={(date) =>
                    onChangeForm((prev) => ({
                      ...prev,
                      currentlyWorksHere: false,
                      employmentEndDate: toIsoDate(date),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3 rounded-[8px] border border-[#ececec] bg-[#f9fafc] px-4 py-2.5 select-none">
            <Checkbox
              checked={form.currentlyWorksHere}
              onChange={() =>
                onChangeForm((prev) => ({
                  ...prev,
                  currentlyWorksHere: !prev.currentlyWorksHere,
                  employmentEndDate: !prev.currentlyWorksHere ? '' : prev.employmentEndDate,
                }))
              }
            />
            <span className="text-[14px] font-medium text-neutral-800">
              {label('currentlyWorksHere', 'Currently works here (no end date)')}
            </span>
          </label>
        </div>
      </SectionHeading>
    </div>
  )
}
