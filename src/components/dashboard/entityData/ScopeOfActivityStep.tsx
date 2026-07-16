import { useRef, useState } from 'react'
import { DatePicker } from '@/components/ui/DatePicker'
import { useTranslation } from 'react-i18next'
import { TrashIcon } from '@/components/icons'
import { AppIcon } from '@/components/icons'
import {
  FormField,
  FormSection,
  RadioGroup,
  SelectField,
  MultiSelect,
  TextField,
  Textarea,
} from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'

const defaultBranchAddress =
  '9000 Prince Miteb, Al Aziziyah District - Jeddah 23342 - 3041, Unit No. 7, Kingdom of Saudi Arabia.'

const economicFieldOptions = [
  '01 A Agriculture, hunting, forestry and fishing',
  '02 B Fishing',
  '03 C Food, beverage and tobacco products',
  '10 D Mining and quarrying',
  '27 E Manufacturing',
  '41 F Construction',
  '45 G Wholesale and retail trade',
]

interface Branch {
  id: number
  integratedSystem: string
  centralAdministration: string
}

function BranchForm({
  branch,
  onChange,
}: {
  branch: Branch
  onChange: (id: number, field: keyof Branch, value: string) => void
}) {
  const { t } = useTranslation()

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  return (
    <FormSection>
      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.branchEmployees')}
          required
          variant="question"
        >
          <TextField type="number" min={0} defaultValue={12} />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.auditScopeEmployees')}
          required
          variant="question"
        >
          <TextField type="number" min={0} defaultValue={6} />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.shiftCount')}
          required
          variant="question"
        >
          <TextField type="number" min={0} defaultValue={2} />
        </FormField>

        <FormField label={t('accreditation.entityData.fields.scope.openingHours')} variant="question">
          <TextField type="number" min={0} defaultValue={8} />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField label={t('accreditation.entityData.fields.scope.weeklyVacation')} variant="question">
          <SelectField
            value={t('accreditation.entityData.fields.scope.twoDays')}
            options={[
              t('accreditation.entityData.fields.scope.oneDay'),
              t('accreditation.entityData.fields.scope.twoDays'),
            ]}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.productionLines')}
          variant="question"
        >
          <TextField
            type="number"
            min={0}
            defaultValue={4}
            placeholder={t('accreditation.entityData.fields.scope.productionLinesPlaceholder')}
          />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.firstPhaseDate')}
          required
          variant="question"
        >
          <DatePicker />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.branchName')}
          required
          variant="question"
        >
          <TextField
            type="text"
            placeholder={t('accreditation.entityData.fields.scope.branchNamePlaceholder')}
          />
        </FormField>
      </div>

      <FormField
        label={t('accreditation.entityData.fields.scope.branchAddress')}
        required
        variant="question"
      >
        <TextField type="text" defaultValue={defaultBranchAddress} />
      </FormField>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={t('accreditation.entityData.fields.scope.integratedSystem')}
          required
          variant="question"
        >
          <RadioGroup
            name={`integratedSystem-${branch.id}`}
            value={branch.integratedSystem}
            onChange={(v) => onChange(branch.id, 'integratedSystem', v)}
            options={yesNoOptions}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.centralAdministration')}
          required
          variant="question"
        >
          <RadioGroup
            name={`centralAdministration-${branch.id}`}
            value={branch.centralAdministration}
            onChange={(v) => onChange(branch.id, 'centralAdministration', v)}
            options={yesNoOptions}
          />
        </FormField>
      </div>

      <FormField
        label={t('accreditation.entityData.fields.scope.activitiesToAudit')}
        required
        variant="question"
      >
        <TextField
          type="text"
          placeholder={t('accreditation.entityData.fields.scope.chooseActivities')}
        />
      </FormField>

      <FormField
        label={t('accreditation.entityData.fields.scope.productsServices')}
        required
        variant="question"
      >
        <Textarea placeholder={t('accreditation.entityData.fields.common.writeHere')} />
      </FormField>

      <FormField
        label={t('accreditation.entityData.fields.scope.technicalCommunication')}
        required
        variant="question"
      >
        <Textarea placeholder={t('accreditation.entityData.fields.common.writeHere')} />
      </FormField>
    </FormSection>
  )
}

let nextId = 2

export function ScopeOfActivityStep() {
  const { t } = useTranslation()
  const [economicFields, setEconomicFields] = useState([
    '01 A Agriculture, hunting, forestry and fishing',
    '03 C Food, beverage and tobacco products',
  ])
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, integratedSystem: 'yes', centralAdministration: 'yes' },
  ])
  const branchRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  function addBranch() {
    const newId = nextId++
    setBranches((prev) => [
      ...prev,
      { id: newId, integratedSystem: 'yes', centralAdministration: 'yes' },
    ])
    setTimeout(() => {
      branchRefs.current.get(newId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function removeBranch(id: number) {
    branchRefs.current.delete(id)
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  function updateBranch(id: number, field: keyof Branch, value: string) {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  const branchLabel = (index: number) =>
    t('accreditation.entityData.fields.scope.branchNumber', { number: index + 1 })

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title={t('accreditation.entityData.fields.scope.operationalData')} />
      <FormSection>
        <FormField
          label={t('accreditation.entityData.fields.scope.scopeOfWork')}
          required
          variant="question"
        >
          <TextField
            type="text"
            placeholder={t('accreditation.entityData.fields.scope.scopeOfWorkPlaceholder')}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.economicField')}
          required
          variant="question"
        >
          <MultiSelect
            tags={economicFields}
            options={economicFieldOptions}
            onChange={setEconomicFields}
          />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.productsServicesNature')}
          required
          variant="question"
        >
          <Textarea placeholder={t('accreditation.entityData.fields.common.writeHere')} />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.annualProductionCapacity')}
          required
          variant="question"
        >
          <Textarea placeholder={t('accreditation.entityData.fields.common.writeHere')} />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.technicalSpecifications')}
          required
          variant="question"
        >
          <Textarea placeholder={t('accreditation.entityData.fields.common.writeHere')} />
        </FormField>

        <FormField
          label={t('accreditation.entityData.fields.scope.branchCount')}
          variant="question"
          className="max-w-xl"
        >
          <button
            type="button"
            onClick={addBranch}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-primary bg-primary-subtle py-3 text-primary transition-colors hover:bg-[#dbe4fa]"
          >
            <span className="text-xl leading-none">+</span>
            <span className="text-body-2">{t('accreditation.entityData.fields.scope.addBranch')}</span>
          </button>
        </FormField>
      </FormSection>

      {branches.map((branch, index) => (
        <div key={branch.id} ref={(el) => { if (el) branchRefs.current.set(branch.id, el); }}>
          <div className="flex items-center justify-between">
            <SectionHeading title={branchLabel(index)} />
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeBranch(branch.id)}
                className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-error-500 transition-colors hover:bg-error-50"
                aria-label={t('accreditation.entityData.fields.scope.removeBranch')}
              >
                <AppIcon icon={TrashIcon} size={16} />
                <span className="text-body-3">{t('accreditation.entityData.fields.scope.removeBranch')}</span>
              </button>
            )}
          </div>
          <BranchForm branch={branch} onChange={updateBranch} />
        </div>
      ))}
    </div>
  )
}
