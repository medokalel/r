import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  BuildingIcon,
  CheckIcon,
  PlusIcon,
  FileTextIcon,
  EditIcon,
  ShieldIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'

export interface AgendaItem {
  id: number
  processArea: string
  standardClause: string
  timeAst: string
  auditor: string
  status: 'Completed' | 'In progress' | 'Not started'
}

export interface EvidenceTask {
  id: string
  description: string
  relatedArea: string
  dueDate: string
  status: 'Open' | 'Submitted' | 'Verified' | 'Closed'
}

export interface FindingItem {
  id: string
  type: string
  requirementRef: string
  classification: string
  statement: string
  status: 'Draft' | 'Submitted' | 'Resolved'
  dueDate: string
}

export function CabAuditReportingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Active tab state
  const [activeTab, setActiveTab] = useState<'agenda' | 'evidence' | 'findings' | 'report'>('agenda')

  // Notification and dirty state
  const [toast, setToast] = useState<string | null>(null)
  const [_isDirty, setIsDirty] = useState(false)
  const [_isSaved, setIsSaved] = useState(true)
  const [reportFrozen, setReportFrozen] = useState(false)

  // Audit Agenda State
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: 1, processArea: 'Opening meeting', standardClause: '—', timeAst: '09:00 - 09:30', auditor: 'Lead Auditor', status: 'Completed' },
    { id: 2, processArea: 'Management system overview', standardClause: '4.1, 4.2', timeAst: '09:30 - 10:30', auditor: 'Lead Auditor', status: 'Completed' },
    { id: 3, processArea: 'Food safety policy and objectives', standardClause: '5.2', timeAst: '10:30 - 11:00', auditor: 'Lead Auditor', status: 'Completed' },
    { id: 4, processArea: 'HACCP plan', standardClause: '8.5', timeAst: '11:00 - 12:30', auditor: 'Auditor 2', status: 'In progress' },
    { id: 5, processArea: 'Operational control (production)', standardClause: '8.6', timeAst: '13:30 - 15:00', auditor: 'Auditor 2', status: 'Not started' },
    { id: 6, processArea: 'Monitoring and measurement', standardClause: '9.1', timeAst: '15:00 - 16:00', auditor: 'Lead Auditor', status: 'Not started' },
    { id: 7, processArea: 'Closing meeting', standardClause: '—', timeAst: '16:00 - 16:30', auditor: 'Lead Auditor', status: 'Not started' },
  ])

  // Open Evidence Tasks State
  const [evidenceTasks, setEvidenceTasks] = useState<EvidenceTask[]>([
    { id: 'EV-0101', description: 'Provide documented HACCP plan', relatedArea: 'HACCP', dueDate: '12 Mar 2025', status: 'Open' },
    { id: 'EV-0102', description: 'Latest internal audit report', relatedArea: 'Internal audit', dueDate: '12 Mar 2025', status: 'Open' },
    { id: 'EV-0103', description: 'Calibration records (last 12 months)', relatedArea: 'Monitoring', dueDate: '13 Mar 2025', status: 'Open' },
    { id: 'EV-0104', description: 'Allergen control procedure', relatedArea: 'Operational control', dueDate: '13 Mar 2025', status: 'Open' },
  ])

  // Findings List State
  const [findings] = useState<FindingItem[]>([
    {
      id: 'NC-0024',
      type: 'Nonconformity',
      requirementRef: 'ISO 9001:2015, Clause 8.5.1',
      classification: 'Pending scheme rules',
      statement: 'The organization has not maintained complete temperature records for the storage area.',
      status: 'Draft',
      dueDate: '12 Apr 2024',
    },
    {
      id: 'OFI-0012',
      type: 'Opportunity for Improvement',
      requirementRef: 'ISO 9001:2015, Clause 7.1.5',
      classification: 'OFI',
      statement: 'Calibration tagging could be enhanced with color coding.',
      status: 'Submitted',
      dueDate: '30 Apr 2024',
    },
  ])

  // Activity Log
  const [activities] = useState([
    { id: 1, time: '12 Mar 2025 11:18', user: 'Sara Ali', text: 'Updated agenda item 4 status to In progress', icon: EditIcon, color: 'text-primary-600' },
    { id: 2, time: '12 Mar 2025 10:42', user: 'Ahmed Khan', text: 'Added evidence task EV-0102', icon: PlusIcon, color: 'text-blue-600' },
    { id: 3, time: '12 Mar 2025 09:15', user: 'Sara Ali', text: 'Uploaded document "Food safety policy.pdf"', icon: FileTextIcon, color: 'text-amber-600' },
    { id: 4, time: '12 Mar 2025 09:05', user: 'Ahmed Khan', text: 'Marked agenda item 2 as completed', icon: CheckIcon, color: 'text-success-600' },
  ])

  // Add evidence modal state
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false)
  const [newEvidenceDesc, setNewEvidenceDesc] = useState('')
  const [newEvidenceArea, setNewEvidenceArea] = useState('HACCP')

  const handleSaveDraft = () => {
    setIsSaved(true)
    setIsDirty(false)
    showToast(t('cab.auditReporting.draftSaved', 'Audit workspace draft saved successfully.'))
  }

  const handleGenerateReport = () => {
    setReportFrozen(true)
    showToast(t('cab.auditReporting.reportGenerated', 'Final report generated & version frozen.'))
  }

  const handleToggleAgendaStatus = (id: number) => {
    setAgendaItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Completed' ? 'In progress' : item.status === 'In progress' ? 'Not started' : 'Completed'
          return { ...item, status: nextStatus }
        }
        return item
      })
    )
    setIsDirty(true)
    setIsSaved(false)
  }

  const handleAddEvidenceTask = () => {
    if (!newEvidenceDesc.trim()) return
    const newTask: EvidenceTask = {
      id: `EV-0${105 + evidenceTasks.length}`,
      description: newEvidenceDesc,
      relatedArea: newEvidenceArea,
      dueDate: '15 Mar 2025',
      status: 'Open',
    }
    setEvidenceTasks((prev) => [newTask, ...prev])
    setNewEvidenceDesc('')
    setShowAddEvidenceModal(false)
    showToast(t('cab.auditReporting.evidenceAdded', 'Evidence task added successfully.'))
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  // Calculate statistics
  const completedCount = agendaItems.filter((i) => i.status === 'Completed').length
  const inProgressCount = agendaItems.filter((i) => i.status === 'In progress').length
  const notStartedCount = agendaItems.filter((i) => i.status === 'Not started').length
  const progressPercent = Math.round((completedCount / agendaItems.length) * 100)

  return (
    <CabLayout sidebarVariant="auditReporting">
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <CabHeader />

        {/* Toast alert */}
        {toast && (
          <div className="fixed top-4 right-4 z-[9999] bg-[#1236a3] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border border-blue-400/30">
            <CheckIcon className="size-5 text-emerald-400 shrink-0 stroke-[3]" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        )}

        <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="hover:text-[#1236a3] transition-colors cursor-pointer" onClick={() => navigate('/cab/dashboard')}>
              {t('cab.auditReporting.title', 'Audit Reporting')}
            </span>
            <span className="text-neutral-400">/</span>
            <span className="font-bold text-neutral-900">{t('cab.auditReporting.workspace', 'Audit Workspace')}</span>
          </div>

          {/* Audit Header Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl bg-[#1236a3] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-900/20">
                <CheckIcon className="size-7 text-white stroke-[3]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-neutral-900 tracking-tight">AUD-0024</h1>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                    In progress
                  </span>
                </div>
                <p className="text-xs text-neutral-600 font-medium">
                  Stage 1 <span className="mx-1.5 text-neutral-300">•</span> Application: <span className="font-bold text-neutral-800">APP-0024</span> <span className="mx-1.5 text-neutral-300">•</span> Client: <span className="font-bold text-neutral-800">CL-0001</span>
                </p>
              </div>
            </div>

            {/* Client Info Widget */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-w-[320px]">
              <div className="size-11 rounded-xl bg-[#e8edfc] border border-[#c5d7fa] flex items-center justify-center text-[#1236a3] shrink-0 font-bold">
                <BuildingIcon className="size-6 text-[#1236a3]" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-neutral-900 text-sm">Al Noor Food Industries</div>
                <div className="text-neutral-500 font-medium">CL-0001 • Saudi Arabia</div>
                <div className="text-neutral-700 font-medium">
                  Primary contact: <span className="text-[#1236a3] font-bold">Sara Ali</span> (sara@alnoor.example)
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar / Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200/90 shadow-inner">
              {[
                { id: 'agenda', label: 'Agenda' },
                { id: 'evidence', label: 'Evidence' },
                { id: 'findings', label: `Findings (${findings.length})` },
                { id: 'report', label: 'Report' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'px-5 py-2 rounded-xl text-xs font-bold transition-all relative',
                    activeTab === tab.id
                      ? 'bg-[#1236a3] text-white shadow-md'
                      : 'text-neutral-700 hover:text-[#1236a3] hover:bg-white/80'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => showToast(t('common.options', 'More options menu opened.'))}
                className="size-10 flex items-center justify-center rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold transition-colors"
                title="Options"
              >
                •••
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-bold border border-neutral-300 rounded-xl text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm transition-colors"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#1236a3] hover:bg-[#0e2a80] shadow-md shadow-blue-900/10 transition-all flex items-center gap-2"
              >
                <FileTextIcon className="size-4 text-white" />
                Generate report
              </button>
            </div>
          </div>

          {/* Main Content Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* TAB 1: AGENDA */}
              {activeTab === 'agenda' && (
                <>
                  {/* Audit Agenda Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-neutral-900">Audit agenda</h2>
                        <p className="text-xs text-neutral-500 font-medium">Standard ISO 22000 / ISO 9001 Stage 1 Assessment</p>
                      </div>
                      <span className="text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-lg">
                        12 Mar 2025
                      </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                      <table className="w-full text-start text-xs">
                        <thead className="bg-neutral-100/80 text-neutral-800 font-bold border-b border-neutral-200">
                          <tr>
                            <th className="p-3.5 text-start w-8">#</th>
                            <th className="p-3.5 text-start">Process / Area</th>
                            <th className="p-3.5 text-start">Standard clause</th>
                            <th className="p-3.5 text-start">Time (AST)</th>
                            <th className="p-3.5 text-start">Auditor(s)</th>
                            <th className="p-3.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/60 text-neutral-800">
                          {agendaItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3.5 font-bold text-neutral-500">{item.id}</td>
                              <td className="p-3.5 font-bold text-neutral-900">{item.processArea}</td>
                              <td className="p-3.5 text-neutral-700 font-medium">{item.standardClause}</td>
                              <td className="p-3.5 font-mono text-neutral-700 font-semibold">{item.timeAst}</td>
                              <td className="p-3.5 text-neutral-700 font-medium">{item.auditor}</td>
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAgendaStatus(item.id)}
                                  className={cn(
                                    'px-3 py-1 rounded-full text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs',
                                    item.status === 'Completed' && 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200',
                                    item.status === 'In progress' && 'bg-sky-100 text-sky-900 border border-sky-300 hover:bg-sky-200',
                                    item.status === 'Not started' && 'bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200'
                                  )}
                                >
                                  {item.status}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Activity Card */}
                  <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <h2 className="text-lg font-bold text-neutral-900">Recent activity</h2>
                      <button
                        type="button"
                        onClick={() => showToast(t('common.viewAll', 'Displaying full activity timeline.'))}
                        className="text-xs font-bold text-[#1236a3] hover:text-[#0e2a80]"
                      >
                        View all
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {activities.map((act) => {
                        const IconComp = act.icon
                        return (
                          <div key={act.id} className="py-3 flex items-start gap-3.5 first:pt-0 last:pb-0">
                            <div className="p-2 rounded-xl bg-[#e8edfc] border border-[#c5d7fa] text-[#1236a3] shrink-0 mt-0.5">
                              <IconComp className="size-4 text-[#1236a3]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-neutral-900 font-medium">
                                <span className="font-bold text-neutral-900">{act.user}</span>: {act.text}
                              </p>
                              <span className="text-[11px] text-neutral-500 font-mono font-semibold">{act.time}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: EVIDENCE */}
              {activeTab === 'evidence' && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Audit evidence tasks</h2>
                      <p className="text-xs text-neutral-500 font-medium">
                        Evidence linked directly to audit clauses and requirements. Draft allowed; required checks apply on submission.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddEvidenceModal(true)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1236a3] text-white hover:bg-[#0e2a80] shadow-md transition-all flex items-center gap-1.5"
                    >
                      <PlusIcon className="size-3.5 text-white" />
                      Add evidence
                    </button>
                  </div>

                  <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
                    {evidenceTasks.map((task) => (
                      <div key={task.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1236a3] bg-[#e8edfc] px-2 py-0.5 rounded border border-[#c5d7fa]">
                              {task.id}
                            </span>
                            <span className="text-xs font-bold text-neutral-900">{task.description}</span>
                          </div>
                          <p className="text-xs text-neutral-600">
                            Related area: <span className="font-bold text-neutral-800">{task.relatedArea}</span> • Due date: <span className="font-bold text-neutral-800">{task.dueDate}</span>
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FINDINGS */}
              {activeTab === 'findings' && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Audit findings</h2>
                      <p className="text-xs text-neutral-500 font-medium">
                        Classifications and response due dates use configured scheme rules (no universal major/minor deadline).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/cab/audit-reporting/findings/new')}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#1236a3] text-white hover:bg-[#0e2a80] shadow-md transition-all flex items-center gap-1.5"
                    >
                      <PlusIcon className="size-4 text-white" />
                      + Add finding
                    </button>
                  </div>

                  <div className="space-y-3">
                    {findings.map((f) => (
                      <div key={f.id} className="p-4 rounded-xl border border-neutral-200 bg-slate-50/50 space-y-2 hover:border-[#1236a3] transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              {f.id}
                            </span>
                            <span className="text-xs font-bold text-neutral-900">{f.type}</span>
                          </div>
                          <span className="text-xs text-neutral-600 font-medium">
                            Due date: <span className="font-bold text-neutral-900">{f.dueDate}</span>
                          </span>
                        </div>
                        <p className="text-xs text-neutral-800 font-semibold leading-relaxed">{f.statement}</p>
                        <div className="flex items-center justify-between text-xs text-neutral-600 pt-2 border-t border-neutral-200/60">
                          <span>Ref: <strong className="text-neutral-900 font-bold">{f.requirementRef}</strong></span>
                          <span className="font-bold text-[#1236a3]">{f.classification}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: REPORT */}
              {activeTab === 'report' && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900">Audit report finalization</h2>
                      <p className="text-xs text-neutral-500 font-medium">
                        Report finalization freezes version. Technical review is a separate handoff; auditor recommendation is not certification decision.
                      </p>
                    </div>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-bold border', reportFrozen ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300')}>
                      {reportFrozen ? 'Frozen / Finalized v1.0' : 'Draft In Progress'}
                    </span>
                  </div>

                  {/* Scheme & Handoff Policy Alert */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                    <p className="font-bold flex items-center gap-2 text-sm text-[#1236a3]">
                      <ShieldIcon className="size-4 text-[#1236a3]" />
                      CAB Governance & Handoff Rule
                    </p>
                    <p className="text-blue-900 font-medium leading-relaxed">
                      Auditor recommendations logged in this workspace do not constitute a final certification decision. Technical review will occur as a separate handoff once the report version is frozen.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                      <h3 className="font-bold text-neutral-900 text-sm">Report Summary</h3>
                      <p className="text-neutral-700 font-medium">Audit AUD-0024 completed with 2 findings logged. Technical review handoff ready.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#1236a3] text-white hover:bg-[#0e2a80] shadow-md transition-all"
                      >
                        {reportFrozen ? 'Regenerate Frozen Report' : 'Freeze & Finalize Report'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (1/3 width Widgets) */}
            <div className="space-y-6">
              {/* Audit Progress Donut Chart Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-neutral-900">Audit progress</h2>

                {/* Donut Chart Visual */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative size-36 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-neutral-200"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#1236a3] transition-all duration-700"
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-neutral-900">{progressPercent}%</span>
                      <span className="block text-[11px] text-neutral-600 font-bold">Complete</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-neutral-700">
                    <div className="flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-emerald-500" />
                      <span>{completedCount} Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-[#1236a3]" />
                      <span>{inProgressCount} In progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-neutral-300" />
                      <span>{notStartedCount} Not started</span>
                    </div>
                  </div>
                </div>

                {/* Counters Bar */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-200 text-center">
                  <div>
                    <span className="text-xs text-neutral-600 font-semibold block">Agenda items</span>
                    <span className="text-lg font-black text-neutral-900">{agendaItems.length}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-600 font-semibold block">Evidence tasks</span>
                    <span className="text-lg font-black text-neutral-900">12</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-600 font-semibold block">Findings</span>
                    <span className="text-lg font-black text-neutral-900">{findings.length}</span>
                  </div>
                </div>
              </div>

              {/* Open Evidence Tasks Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h2 className="text-base font-bold text-neutral-900">Open evidence tasks</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('evidence')}
                    className="text-xs font-bold text-[#1236a3] hover:text-[#0e2a80]"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {evidenceTasks.slice(0, 4).map((et) => (
                    <div key={et.id} className="p-3 rounded-xl border border-neutral-200 bg-slate-50/70 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-neutral-900 truncate">{et.description}</div>
                        <div className="text-[11px] text-neutral-500 font-medium">{et.relatedArea} • {et.dueDate}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                        {et.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-neutral-900 mb-2 border-b border-neutral-100 pb-2">Quick actions</h2>

                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusIcon className="size-4 text-[#1236a3]" />
                  Add evidence
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-reporting/findings/new')}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusIcon className="size-4 text-[#1236a3]" />
                  + Add finding
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-[#1236a3] text-white hover:bg-[#0e2a80] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckIcon className="size-4 text-white" />
                  Save draft
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Add Evidence Modal */}
        {showAddEvidenceModal && (
          <div className="fixed inset-0 z-[999] bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-neutral-900">Add evidence task</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Description*</label>
                  <input
                    type="text"
                    value={newEvidenceDesc}
                    onChange={(e) => setNewEvidenceDesc(e.target.value)}
                    placeholder="e.g. Temperature log records"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Related Area*</label>
                  <select
                    value={newEvidenceArea}
                    onChange={(e) => setNewEvidenceArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                  >
                    <option value="HACCP">HACCP</option>
                    <option value="Internal audit">Internal audit</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Operational control">Operational control</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEvidenceTask}
                  className="px-4 py-2 text-xs font-bold bg-[#1236a3] text-white rounded-xl hover:bg-[#0e2a80]"
                >
                  Add evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
