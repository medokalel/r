import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCompetenceEvaluationTourSteps } from '@/config/competenceEvaluationTourSteps'
import {
  AppIcon,
  ChevronDownIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import {
  getPersonById,
  savePersonEvaluation,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { cn } from '@/lib/utils'

export function CabCompetenceEvaluationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = useCompetenceEvaluationTourSteps()

  const [person, setPerson] = useState<CompetencePerson | undefined>(() =>
    getPersonById(id || 'per-1')
  )
  const [activeTab, setActiveTab] = useState<
    | 'evaluation'
    | 'training'
    | 'auditLog'
    | 'witnessing'
    | 'evidence'
    | 'restrictions'
    | 'renewal'
  >('evaluation')

  // Form states
  const [fullName, setFullName] = useState(person?.name || '')
  const [role, setRole] = useState(person?.role || 'Auditor')
  const [email, setEmail] = useState(person?.email || '')
  const [phone, setPhone] = useState(person?.phone || '')

  const [scheme, setScheme] = useState(person?.evaluation?.scheme || 'ISO 9001')
  const [proposedSector, setProposedSector] = useState(
    person?.evaluation?.proposedSector || 'Food Manufacturing'
  )
  const [evaluationDate, setEvaluationDate] = useState(
    person?.evaluation?.evaluationDate || '2025-04-25'
  )
  const [evaluator, setEvaluator] = useState(person?.evaluation?.evaluator || 'Sara Ali')
  const [overallResult, setOverallResult] = useState<
    'Competent' | 'Not Yet Competent' | 'Requires Training'
  >(person?.evaluation?.overallResult || 'Competent')
  const [comments, setComments] = useState(
    person?.evaluation?.comments ||
      'Meets competence requirements for ISO 9001 in the proposed sector based on training, experience and witnessed audits.'
  )

  const [highestQualification, setHighestQualification] = useState(
    person?.evaluation?.highestQualification || "Bachelor's Degree"
  )
  const [fieldOfStudy, setFieldOfStudy] = useState(
    person?.evaluation?.fieldOfStudy || 'Industrial Engineering'
  )
  const [relevantExperienceYears, setRelevantExperienceYears] = useState(
    person?.evaluation?.relevantExperienceYears || 8
  )
  const [sectorExperienceYears, setSectorExperienceYears] = useState(
    person?.evaluation?.sectorExperienceYears || 5
  )
  const [additionalNotes, setAdditionalNotes] = useState(
    person?.evaluation?.additionalNotes ||
      'Extensive experience in food manufacturing environments, including HACCP and regulatory requirements.'
  )

  const [lastSaved, setLastSaved] = useState(
    person?.evaluation?.lastSaved || '25 Apr 2025, 10:24'
  )
  const [evalStatus, setEvalStatus] = useState(person?.evaluation?.status || 'In progress')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Sub-items Modals
  const [isAddTrainingModal, setIsAddTrainingModal] = useState(false)
  const [isAddAuditLogModal, setIsAddAuditLogModal] = useState(false)
  const [isAddWitnessingModal, setIsAddWitnessingModal] = useState(false)

  // New item form buffers
  const [newTraining, setNewTraining] = useState({
    course: '',
    provider: '',
    date: new Date().toISOString().split('T')[0],
    result: 'Completed' as const,
  })
  const [newAuditLog, setNewAuditLog] = useState({
    client: '',
    activity: 'Stage 1 Audit',
    role: 'Auditor',
    date: new Date().toISOString().split('T')[0],
    result: 'Satisfactory' as const,
  })
  const [newWitnessing, setNewWitnessing] = useState({
    client: '',
    auditType: 'Stage 2 Audit',
    witnessedBy: 'Dr. Layla Hassan',
    date: new Date().toISOString().split('T')[0],
    outcome: 'Positive' as const,
  })

  useEffect(() => {
    if (!person && id) {
      const found = getPersonById(id)
      if (found) setPerson(found)
    }
  }, [id, person])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSaveDraft = () => {
    if (!person) return
    const updated = savePersonEvaluation(person.id, {
      name: fullName,
      role: role as any,
      email,
      phone,
      evaluation: {
        scheme,
        proposedSector,
        evaluationDate,
        evaluator,
        overallResult,
        comments,
        highestQualification,
        fieldOfStudy,
        relevantExperienceYears: Number(relevantExperienceYears),
        sectorExperienceYears: Number(sectorExperienceYears),
        additionalNotes,
        status: evalStatus as any,
        lastSaved: '',
      },
    })
    if (updated) {
      setPerson(updated)
      setLastSaved(updated.evaluation?.lastSaved || '')
      showToast(t('cab.competence.evaluation.toastDraftSaved', 'Evaluation draft saved successfully.'))
    }
  }

  const handleSubmitForAuthorization = () => {
    if (!person) return
    const updated = savePersonEvaluation(person.id, {
      name: fullName,
      role: role as any,
      email,
      phone,
      status: 'Authorized',
      evaluation: {
        scheme,
        proposedSector,
        evaluationDate,
        evaluator,
        overallResult,
        comments,
        highestQualification,
        fieldOfStudy,
        relevantExperienceYears: Number(relevantExperienceYears),
        sectorExperienceYears: Number(sectorExperienceYears),
        additionalNotes,
        status: 'Authorized',
        lastSaved: '',
      },
    })
    if (updated) {
      setPerson(updated)
      setEvalStatus('Authorized')
      setLastSaved(updated.evaluation?.lastSaved || '')
      showToast(t('cab.competence.evaluation.toastSubmitted', 'Evaluation submitted for authorization successfully.'))
    }
  }

  const handleAddTraining = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTraining.course || !person) return
    const updatedList = [
      ...(person.trainings || []),
      {
        id: `tr-${Date.now()}`,
        course: newTraining.course,
        provider: newTraining.provider || 'Accredited Academy',
        date: newTraining.date,
        result: newTraining.result,
      },
    ]
    const saved = savePersonEvaluation(person.id, { trainings: updatedList })
    if (saved) setPerson(saved)
    setIsAddTrainingModal(false)
    setNewTraining({ course: '', provider: '', date: '', result: 'Completed' })
    showToast(t('cab.competence.evaluation.toastDraftSaved', 'Training record added.'))
  }

  const handleAddAuditLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAuditLog.client || !person) return
    const updatedList = [
      ...(person.auditLogs || []),
      {
        id: `al-${Date.now()}`,
        client: newAuditLog.client,
        clientCode: `CL-000${(person.auditLogs?.length || 0) + 1}`,
        activity: newAuditLog.activity,
        role: newAuditLog.role,
        date: newAuditLog.date,
        result: newAuditLog.result,
      },
    ]
    const saved = savePersonEvaluation(person.id, { auditLogs: updatedList })
    if (saved) setPerson(saved)
    setIsAddAuditLogModal(false)
    setNewAuditLog({ client: '', activity: 'Stage 1 Audit', role: 'Auditor', date: '', result: 'Satisfactory' })
    showToast(t('cab.competence.evaluation.toastDraftSaved', 'Audit log record added.'))
  }

  const handleAddWitnessing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWitnessing.client || !person) return
    const updatedList = [
      ...(person.witnessings || []),
      {
        id: `wit-${Date.now()}`,
        client: newWitnessing.client,
        clientCode: `CL-000${(person.witnessings?.length || 0) + 1}`,
        auditType: newWitnessing.auditType,
        witnessedBy: newWitnessing.witnessedBy,
        date: newWitnessing.date,
        outcome: newWitnessing.outcome,
      },
    ]
    const saved = savePersonEvaluation(person.id, { witnessings: updatedList })
    if (saved) setPerson(saved)
    setIsAddWitnessingModal(false)
    setNewWitnessing({ client: '', auditType: 'Stage 2 Audit', witnessedBy: 'Dr. Layla Hassan', date: '', outcome: 'Positive' })
    showToast(t('cab.competence.evaluation.toastDraftSaved', 'Witnessing evaluation record added.'))
  }

  if (!person) {
    return (
      <CabLayout sidebarVariant="competence">
        <CabHeader title={t('cab.competence.title', 'Competence')} />
        <div className="p-8 text-center text-neutral-500">Personnel not found.</div>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      sidebarVariant="competence"
      tourId="competence-evaluation-tour"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.competence.evaluation.pageTitle', 'Competence evaluation')} />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 end-5 z-50 flex items-center gap-2 rounded-[8px] bg-[#1236a3] px-4 py-3 text-white shadow-xl">
          <AppIcon icon={SuccessCircleIcon} size={18} className="text-[#38bdf8]" />
          <span className="text-[14px] font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 bg-[#f9fafc] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
            <button
              type="button"
              onClick={() => navigate('/cab/competence')}
              className="text-primary hover:underline font-semibold"
            >
              {t('cab.competence.title', 'Competence')}
            </button>
            <span className="text-neutral-300">/</span>
            <button
              type="button"
              onClick={() => navigate('/cab/competence')}
              className="text-primary hover:underline font-semibold"
            >
              {t('cab.competence.personnelRegister', 'Persons')}
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-600 font-medium">{person.code}</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-900 font-semibold">{t('cab.competence.evaluation.tabs.evaluation', 'Evaluation')}</span>
          </div>

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CabTourStep steps={tourSteps} stepId="eval-header">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[22px] sm:text-[26px] font-extrabold text-neutral-900 tracking-tight">
                    {t('cab.competence.evaluation.pageTitle', 'Competence evaluation')}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-0.5 text-[12px] font-bold text-primary border border-[#c7d7f9]">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {evalStatus === 'Authorized'
                      ? t('cab.competence.statusAuthorized', 'Authorized')
                      : evalStatus === 'In progress'
                      ? t('cab.competence.evaluation.statusInProg', 'In progress')
                      : t('cab.competence.statusUnderReview', 'Under review')}
                  </span>
                </div>
                <p className="mt-1 text-[13px] sm:text-[14px] text-neutral-500">
                  {t('cab.competence.evaluation.pageSubtitle', 'Assess and record competence for personnel')}
                </p>
              </div>
            </CabTourStep>

            <CabTourStep steps={tourSteps} stepId="eval-actions">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="hidden text-[13px] text-neutral-400 lg:inline-block font-medium">
                  {t('cab.competence.evaluation.lastSaved', { time: lastSaved })}
                </span>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none rounded-[8px] border-2 border-primary bg-white px-4 py-2 text-[14px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-[0.99] text-center"
                >
                  {t('cab.competence.evaluation.btnSave', 'Save evaluation')}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForAuthorization}
                  className="flex-1 sm:flex-none rounded-[8px] bg-primary px-5 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all shadow-sm active:scale-[0.99] text-center"
                >
                  {t('cab.competence.evaluation.btnSubmitAuth', 'Submit for authorization')}
                </button>

                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-neutral-600 hover:bg-neutral-50 shrink-0"
                >
                  ···
                </button>
              </div>
            </CabTourStep>
          </div>

          {/* Personnel Quick Info Profile Card */}
          <CabTourStep steps={tourSteps} stepId="eval-profile">
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Profile Info */}
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary text-[18px] font-bold text-white shadow-sm shrink-0">
                    {person.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-neutral-900">{person.name}</h2>
                    <p className="text-[13px] text-neutral-500 font-medium">{person.code}</p>
                  </div>
                </div>

                {/* Attributes Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-12">
                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.status', 'Status')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-[13px] sm:text-[14px] font-semibold text-neutral-800">
                        {person.status === 'Authorized'
                          ? t('cab.competence.statusAuthorized', 'Authorized')
                          : t('cab.competence.statusUnderReview', 'Under review')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.role', 'Role')}
                    </span>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-neutral-800 mt-0.5 block">
                      {person.role}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.email', 'Email')}
                    </span>
                    <a
                      href={`mailto:${person.email}`}
                      className="text-[13px] sm:text-[14px] font-medium text-primary hover:underline mt-0.5 block truncate max-w-[180px]"
                    >
                      {person.email}
                    </a>
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.phone', 'Phone')}
                    </span>
                    <span className="text-[13px] sm:text-[14px] font-medium text-neutral-800 mt-0.5 block" dir="ltr">
                      {person.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Navigation Tabs */}
          <CabTourStep steps={tourSteps} stepId="eval-tabs">
            <div className="border-b border-[#e5e7eb] overflow-x-auto scrollbar-none">
              <nav className="flex gap-6 sm:gap-8 min-w-max pb-0.5">
                {[
                  { id: 'evaluation', label: t('cab.competence.evaluation.tabs.evaluation', 'Evaluation') },
                  { id: 'training', label: t('cab.competence.evaluation.tabs.training', 'Training') },
                  { id: 'auditLog', label: t('cab.competence.evaluation.tabs.auditLog', 'Audit log') },
                  { id: 'witnessing', label: t('cab.competence.evaluation.tabs.witnessing', 'Witnessing') },
                  { id: 'evidence', label: t('cab.competence.evaluation.tabs.evidence', 'Assessment evidence') },
                  { id: 'restrictions', label: t('cab.competence.evaluation.tabs.restrictions', 'Restrictions') },
                  { id: 'renewal', label: t('cab.competence.evaluation.tabs.renewal', 'Renewal') },
                ].map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'whitespace-nowrap pb-3 text-[13px] sm:text-[14px] font-semibold border-b-2 transition-colors',
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-neutral-500 hover:text-neutral-800'
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </CabTourStep>

          {/* Tab 1: Evaluation Content */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              {/* 3 Columns Form Card */}
              <CabTourStep steps={tourSteps} stepId="eval-general-form">
                <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Column 1: General information */}
                    <div className="space-y-4">
                      <h3 className="text-[16px] font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                        {t('cab.competence.evaluation.sections.generalInfo', 'General information')}
                      </h3>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.personId', 'Person ID')}
                        </label>
                        <input
                          type="text"
                          disabled
                          value={person.code}
                          className="h-10 w-full rounded-[8px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[14px] text-neutral-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.fullName', 'Full name')}
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.role', 'Role')}
                        </label>
                        <div className="relative">
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="Auditor">{t('cab.competence.evaluation.roles.auditor', 'Auditor')}</option>
                            <option value="Lead Auditor">{t('cab.competence.evaluation.roles.leadAuditor', 'Lead Auditor')}</option>
                            <option value="Technical Expert">{t('cab.competence.evaluation.roles.technicalExpert', 'Technical Expert')}</option>
                            <option value="Decision Maker">{t('cab.competence.evaluation.roles.decisionMaker', 'Decision Maker')}</option>
                            <option value="Reviewer">{t('cab.competence.evaluation.roles.reviewer', 'Reviewer')}</option>
                          </select>
                          <AppIcon
                            icon={ChevronDownIcon}
                            size={14}
                            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.email', 'Email')}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.phone', 'Phone')}
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Column 2: Evaluation details */}
                    <div className="space-y-4">
                      <h3 className="text-[16px] font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                        {t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}
                      </h3>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.scheme', 'Scheme')}
                        </label>
                        <div className="relative">
                          <select
                            value={scheme}
                            onChange={(e) => setScheme(e.target.value)}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="ISO 9001">ISO 9001</option>
                            <option value="ISO 14001">ISO 14001</option>
                            <option value="ISO 45001">ISO 45001</option>
                            <option value="ISO 22000">ISO 22000</option>
                            <option value="ISO 27001">ISO 27001</option>
                            <option value="HACCP">HACCP</option>
                          </select>
                          <AppIcon
                            icon={ChevronDownIcon}
                            size={14}
                            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.proposedSector', 'Proposed sector')}
                        </label>
                        <div className="relative">
                          <select
                            value={proposedSector}
                            onChange={(e) => setProposedSector(e.target.value)}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="Food Manufacturing">Food Manufacturing</option>
                            <option value="Chemicals & Plastics">Chemicals & Plastics</option>
                            <option value="Construction & Engineering">Construction & Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                          </select>
                          <AppIcon
                            icon={ChevronDownIcon}
                            size={14}
                            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.evalDate', 'Evaluation date')}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={evaluationDate}
                            onChange={(e) => setEvaluationDate(e.target.value)}
                            className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.evaluator', 'Evaluator')}
                        </label>
                        <input
                          type="text"
                          value={evaluator}
                          onChange={(e) => setEvaluator(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.overallResult', 'Overall result')}
                        </label>
                        <div className="relative">
                          <select
                            value={overallResult}
                            onChange={(e) => setOverallResult(e.target.value as any)}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="Competent">{t('cab.competence.evaluation.results.competent', 'Competent')}</option>
                            <option value="Not Yet Competent">{t('cab.competence.evaluation.results.notYetCompetent', 'Not Yet Competent')}</option>
                            <option value="Requires Training">{t('cab.competence.evaluation.results.requiresTraining', 'Requires Training')}</option>
                          </select>
                          <AppIcon
                            icon={ChevronDownIcon}
                            size={14}
                            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.comments', 'Comments')}
                        </label>
                        <textarea
                          rows={3}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="w-full rounded-[8px] border border-[#e2e2e2] p-2.5 text-[13px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Column 3: Qualifications and experience */}
                    <div className="space-y-4">
                      <h3 className="text-[16px] font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                        {t('cab.competence.evaluation.sections.qualifications', 'Qualifications and experience')}
                      </h3>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.highestQualification', 'Highest qualification')}
                        </label>
                        <div className="relative">
                          <select
                            value={highestQualification}
                            onChange={(e) => setHighestQualification(e.target.value)}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="Bachelor's Degree">{t('cab.competence.evaluation.qualifications.bachelor', "Bachelor's Degree")}</option>
                            <option value="Master's Degree">{t('cab.competence.evaluation.qualifications.master', "Master's Degree")}</option>
                            <option value="Doctorate / PhD">{t('cab.competence.evaluation.qualifications.doctorate', 'Doctorate / PhD')}</option>
                            <option value="Diploma">{t('cab.competence.evaluation.qualifications.diploma', 'Diploma')}</option>
                          </select>
                          <AppIcon
                            icon={ChevronDownIcon}
                            size={14}
                            className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.fieldOfStudy', 'Field of study')}
                        </label>
                        <input
                          type="text"
                          value={fieldOfStudy}
                          onChange={(e) => setFieldOfStudy(e.target.value)}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.relevantExp', 'Relevant experience (years)')}
                        </label>
                        <input
                          type="number"
                          value={relevantExperienceYears}
                          onChange={(e) => setRelevantExperienceYears(Number(e.target.value))}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.sectorExp', 'Sector experience (years)')}
                        </label>
                        <input
                          type="number"
                          value={sectorExperienceYears}
                          onChange={(e) => setSectorExperienceYears(Number(e.target.value))}
                          className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                          {t('cab.competence.evaluation.fields.additionalNotes', 'Additional notes')}
                        </label>
                        <textarea
                          rows={3}
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          className="w-full rounded-[8px] border border-[#e2e2e2] p-2.5 text-[13px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CabTourStep>

              {/* Bottom Cards: Training + Audit Log + Witnessing */}
              <CabTourStep steps={tourSteps} stepId="eval-quick-records">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Training Card */}
                    <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-neutral-900">
                          {t('cab.competence.evaluation.sections.training', 'Training')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsAddTrainingModal(true)}
                          className="rounded-[8px] border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          {t('cab.competence.evaluation.modals.addTraining', '+ Add training')}
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                        <table className="w-full text-start text-[13px]">
                          <thead className="bg-primary text-white font-semibold">
                            <tr>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.course', 'Course')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.provider', 'Provider')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.result', 'Result')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f5f9]">
                            {(person.trainings || []).map((tr) => (
                              <tr key={tr.id} className="hover:bg-neutral-50/70">
                                <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">{tr.date}</td>
                                <td className="py-3 px-3 font-semibold text-neutral-900">{tr.course}</td>
                                <td className="py-3 px-3 text-neutral-600">{tr.provider}</td>
                                <td className="py-3 px-3">
                                  <span className="inline-flex rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-semibold text-[#166534]">
                                    {tr.result}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => setActiveTab('training')}
                          className="text-[13px] font-bold text-primary hover:underline"
                        >
                          {t('cab.competence.evaluation.table.viewAllTraining', 'View all training →')}
                        </button>
                      </div>
                    </div>

                    {/* Audit Log Card */}
                    <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-neutral-900">
                          {t('cab.competence.evaluation.sections.auditLog', 'Audit log')}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsAddAuditLogModal(true)}
                          className="rounded-[8px] border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          {t('cab.competence.evaluation.modals.addAuditLog', '+ Add audit log')}
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                        <table className="w-full text-start text-[13px]">
                          <thead className="bg-primary text-white font-semibold">
                            <tr>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.client', 'Client')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.activity', 'Activity')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.role', 'Role')}</th>
                              <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.result', 'Result')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f5f9]">
                            {(person.auditLogs || []).map((al) => (
                              <tr key={al.id} className="hover:bg-neutral-50/70">
                                <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">{al.date}</td>
                                <td className="py-3 px-3 font-semibold text-neutral-900">
                                  {al.client}{' '}
                                  <span className="text-[11px] text-neutral-400">
                                    ({al.clientCode})
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-neutral-600">{al.activity}</td>
                                <td className="py-3 px-3 text-neutral-600">{al.role}</td>
                                <td className="py-3 px-3">
                                  <span className="inline-flex rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-semibold text-[#166534]">
                                    {al.result}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => setActiveTab('auditLog')}
                          className="text-[13px] font-bold text-primary hover:underline"
                        >
                          {t('cab.competence.evaluation.table.viewAllAuditLog', 'View all audit log →')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Witnessing Card */}
                  <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-bold text-neutral-900">
                        {t('cab.competence.evaluation.sections.witnessing', 'Witnessing')}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddWitnessingModal(true)}
                        className="rounded-[8px] border-2 border-primary bg-white px-3 py-1.5 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        {t('cab.competence.evaluation.modals.addWitnessing', '+ Add witnessing')}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                      <table className="w-full text-start text-[13px]">
                        <thead className="bg-primary text-white font-semibold">
                          <tr>
                            <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                            <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.client', 'Client')}</th>
                            <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.auditType', 'Audit type')}</th>
                            <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.witnessedBy', 'Witnessed by')}</th>
                            <th className="py-2.5 px-3 text-start">{t('cab.competence.evaluation.table.outcome', 'Outcome')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                          {(person.witnessings || []).map((wit) => (
                            <tr key={wit.id} className="hover:bg-neutral-50/70">
                              <td className="py-3 px-3 text-neutral-600 whitespace-nowrap">{wit.date}</td>
                              <td className="py-3 px-3 font-semibold text-neutral-900">
                                {wit.client}{' '}
                                <span className="text-[11px] text-neutral-400">
                                  ({wit.clientCode})
                                </span>
                              </td>
                              <td className="py-3 px-3 text-neutral-600">{wit.auditType}</td>
                              <td className="py-3 px-3 text-neutral-600">{wit.witnessedBy}</td>
                              <td className="py-3 px-3">
                                <span className="inline-flex rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-semibold text-[#166534]">
                                  {wit.outcome}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CabTourStep>
            </div>
          )}

          {/* Tab: Training full view */}
          {activeTab === 'training' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-neutral-900">
                    {t('cab.competence.evaluation.sections.trainingRecords', 'Training Records')}
                  </h2>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {t('cab.competence.evaluation.sections.trainingSubtitle', { name: person.name })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTrainingModal(true)}
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all shadow-sm"
                >
                  {t('cab.competence.evaluation.modals.addTraining', '+ Add training')}
                </button>
              </div>
              <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                <table className="w-full text-start text-[14px]">
                  <thead className="bg-primary text-white font-semibold">
                    <tr>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.courseTitle', 'Course Title')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.trainingProvider', 'Training Provider')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.statusResult', 'Status / Result')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {(person.trainings || []).map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-neutral-50">
                        <td className="p-3.5 text-neutral-600">{tItem.date}</td>
                        <td className="p-3.5 font-bold text-neutral-900">{tItem.course}</td>
                        <td className="p-3.5 text-neutral-600">{tItem.provider}</td>
                        <td className="p-3.5">
                          <span className="inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#166534]">
                            {tItem.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Audit Log full view */}
          {activeTab === 'auditLog' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-neutral-900">
                    {t('cab.competence.evaluation.sections.auditHistory', 'Audit History & Experience')}
                  </h2>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {t('cab.competence.evaluation.sections.auditHistorySubtitle', 'Logged audit missions, assessments, and client assignments.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddAuditLogModal(true)}
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all shadow-sm"
                >
                  {t('cab.competence.evaluation.modals.addAuditLog', '+ Add audit log')}
                </button>
              </div>
              <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                <table className="w-full text-start text-[14px]">
                  <thead className="bg-primary text-white font-semibold">
                    <tr>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.clientOrg', 'Client Organization')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.activity', 'Activity')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.assignedRole', 'Assigned Role')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.result', 'Result')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {(person.auditLogs || []).map((al) => (
                      <tr key={al.id} className="hover:bg-neutral-50">
                        <td className="p-3.5 text-neutral-600">{al.date}</td>
                        <td className="p-3.5 font-bold text-neutral-900">
                          {al.client} <span className="font-normal text-neutral-400">({al.clientCode})</span>
                        </td>
                        <td className="p-3.5 text-neutral-600">{al.activity}</td>
                        <td className="p-3.5 text-neutral-600">{al.role}</td>
                        <td className="p-3.5">
                          <span className="inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#166534]">
                            {al.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Witnessing full view */}
          {activeTab === 'witnessing' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-neutral-900">
                    {t('cab.competence.evaluation.sections.witnessedAudits', 'Witnessed Audits')}
                  </h2>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {t('cab.competence.evaluation.sections.witnessedSubtitle', 'Peer witnessing evaluations and lead auditor supervisory records.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddWitnessingModal(true)}
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all shadow-sm"
                >
                  {t('cab.competence.evaluation.modals.addWitnessing', '+ Add witnessing')}
                </button>
              </div>
              <div className="overflow-x-auto rounded-[8px] border border-[#e5e7eb]">
                <table className="w-full text-start text-[14px]">
                  <thead className="bg-primary text-white font-semibold">
                    <tr>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.date', 'Date')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.client', 'Client')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.auditType', 'Audit Type')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.witnessedBy', 'Witnessed By')}</th>
                      <th className="p-3.5 text-start">{t('cab.competence.evaluation.table.outcome', 'Outcome')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {(person.witnessings || []).map((w) => (
                      <tr key={w.id} className="hover:bg-neutral-50">
                        <td className="p-3.5 text-neutral-600">{w.date}</td>
                        <td className="p-3.5 font-bold text-neutral-900">
                          {w.client} <span className="font-normal text-neutral-400">({w.clientCode})</span>
                        </td>
                        <td className="p-3.5 text-neutral-600">{w.auditType}</td>
                        <td className="p-3.5 text-neutral-600">{w.witnessedBy}</td>
                        <td className="p-3.5">
                          <span className="inline-flex rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#166534]">
                            {w.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Assessment Evidence */}
          {activeTab === 'evidence' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.sections.evidenceTitle', 'Assessment Evidence & Files')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {t('cab.competence.evaluation.sections.evidenceSubtitle', 'Documents, certificates, degrees and exam results supporting competence evaluation.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafc] flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-neutral-900">Degree_Certificate.pdf</p>
                    <p className="text-[12px] text-neutral-500">2.4 MB · Verified</p>
                  </div>
                  <span className="text-[12px] font-semibold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <div className="p-4 rounded-[10px] border border-[#e5e7eb] bg-[#f9fafc] flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-neutral-900">ISO_9001_Exam_Result.pdf</p>
                    <p className="text-[12px] text-neutral-500">1.1 MB · Verified</p>
                  </div>
                  <span className="text-[12px] font-semibold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Restrictions */}
          {activeTab === 'restrictions' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.sections.restrictionsTitle', 'Sector & Scheme Restrictions')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {t('cab.competence.evaluation.sections.restrictionsSubtitle', 'Boundaries, limits, and conditional authorizations assigned to this person.')}
              </p>
              <div className="p-4 rounded-[10px] border border-primary/20 bg-primary-subtle/40 text-[14px] text-neutral-800">
                <p className="font-bold text-primary">
                  {t('cab.competence.evaluation.sections.restrictionsAlertTitle', 'Authorized for ISO 9001 Food Sector only.')}
                </p>
                <p className="text-[13px] text-neutral-600 mt-1">
                  {t('cab.competence.evaluation.sections.restrictionsAlertDesc', 'Excluded from high-risk medical device manufacturing until Stage 3 audit witnessing is completed.')}
                </p>
              </div>
            </div>
          )}

          {/* Tab: Renewal */}
          {activeTab === 'renewal' && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.sections.renewalTitle', 'Competence Re-evaluation & Renewal')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {t('cab.competence.evaluation.sections.renewalSubtitle', 'Tracks expiration cycles, periodic surveillance reviews, and renewal milestones.')}
              </p>
              <div className="p-4 rounded-[10px] border border-emerald-100 bg-emerald-50/50">
                <p className="font-semibold text-emerald-900">
                  {t('cab.competence.evaluation.sections.currentExpiry', { date: person.expiryDate })}
                </p>
                <p className="text-[13px] text-neutral-600 mt-1">
                  {t('cab.competence.evaluation.sections.nextSurveillance', 'Next annual surveillance assessment scheduled for March 2026.')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Add Training */}
      {isAddTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[16px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.modals.addTrainingTitle', 'Add Training Record')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTrainingModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTraining} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.courseNameReq', 'Course Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={newTraining.course}
                  onChange={(e) => setNewTraining({ ...newTraining, course: e.target.value })}
                  placeholder="e.g. ISO 9001 Lead Auditor"
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.table.provider', 'Provider')}
                </label>
                <input
                  type="text"
                  value={newTraining.provider}
                  onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                  placeholder="e.g. QualityLearn"
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.completionDate', 'Completion Date')}
                </label>
                <input
                  type="date"
                  value={newTraining.date}
                  onChange={(e) => setNewTraining({ ...newTraining, date: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsAddTrainingModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all"
                >
                  {t('cab.competence.evaluation.modals.saveTraining', 'Save Training')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Audit Log */}
      {isAddAuditLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[16px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.modals.addAuditLogTitle', 'Add Audit Log Record')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAuditLogModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAuditLog} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.clientOrgReq', 'Client Organization *')}
                </label>
                <input
                  type="text"
                  required
                  value={newAuditLog.client}
                  onChange={(e) => setNewAuditLog({ ...newAuditLog, client: e.target.value })}
                  placeholder="e.g. Al Noor Food Industries"
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.auditActivity', 'Audit Activity')}
                </label>
                <select
                  value={newAuditLog.activity}
                  onChange={(e) => setNewAuditLog({ ...newAuditLog, activity: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="Stage 1 Audit">Stage 1 Audit</option>
                  <option value="Stage 2 Audit">Stage 2 Audit</option>
                  <option value="Surveillance Audit">Surveillance Audit</option>
                  <option value="Recertification Audit">Recertification Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.fields.role', 'Role')}
                </label>
                <input
                  type="text"
                  value={newAuditLog.role}
                  onChange={(e) => setNewAuditLog({ ...newAuditLog, role: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.auditDate', 'Audit Date')}
                </label>
                <input
                  type="date"
                  value={newAuditLog.date}
                  onChange={(e) => setNewAuditLog({ ...newAuditLog, date: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsAddAuditLogModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all"
                >
                  {t('cab.competence.evaluation.modals.saveAuditLog', 'Save Audit Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Witnessing */}
      {isAddWitnessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[16px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h3 className="text-[18px] font-bold text-neutral-900">
                {t('cab.competence.evaluation.modals.addWitnessingTitle', 'Add Witnessing Record')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddWitnessingModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddWitnessing} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.modals.clientOrgReq', 'Client Organization *')}
                </label>
                <input
                  type="text"
                  required
                  value={newWitnessing.client}
                  onChange={(e) => setNewWitnessing({ ...newWitnessing, client: e.target.value })}
                  placeholder="e.g. Al Noor Food Industries"
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.table.auditType', 'Audit Type')}
                </label>
                <input
                  type="text"
                  value={newWitnessing.auditType}
                  onChange={(e) =>
                    setNewWitnessing({ ...newWitnessing, auditType: e.target.value })
                  }
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.table.witnessedBy', 'Witnessed By')}
                </label>
                <input
                  type="text"
                  value={newWitnessing.witnessedBy}
                  onChange={(e) =>
                    setNewWitnessing({ ...newWitnessing, witnessedBy: e.target.value })
                  }
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.evaluation.table.date', 'Date')}
                </label>
                <input
                  type="date"
                  value={newWitnessing.date}
                  onChange={(e) => setNewWitnessing({ ...newWitnessing, date: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsAddWitnessingModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-semibold text-white hover:bg-primary-hover active:bg-primary-active transition-all"
                >
                  {t('cab.competence.evaluation.modals.saveWitnessing', 'Save Witnessing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
