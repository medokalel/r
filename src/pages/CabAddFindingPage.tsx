import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  FileTextIcon,
  CheckIcon,
  ChevronDownIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'

export function CabAddFindingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Form Field States
  const [findingId] = useState('NC-0024')
  const [findingType, setFindingType] = useState('Nonconformity')
  const [classification, setClassification] = useState('')
  const [requirementRef, setRequirementRef] = useState('ISO 9001:2015, Clause 8.5.1')
  const [objectiveEvidence, setObjectiveEvidence] = useState(
    'During the facility tour, storage area temperature records for March 2024 were incomplete. Records were available for 1–10 March only.'
  )
  const [findingStatement, setFindingStatement] = useState(
    'The organization has not maintained complete temperature records for the storage area in accordance with ISO 9001:2015, Clause 8.5.1.'
  )

  // More Details Accordion State
  const [isMoreDetailsOpen, setIsMoreDetailsOpen] = useState(true)
  const [process, setProcess] = useState('Storage and Handling')
  const [responsibleContact, setResponsibleContact] = useState('Sara Ali (sara@alnoor.example)')
  const [dueDate, setDueDate] = useState('2024-04-12')
  const [additionalComments, setAdditionalComments] = useState('')

  // Attachments State
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'IMG_4281.jpg', size: '2.4 MB', type: 'image/jpeg' },
    { id: 2, name: 'Storage_Temp_Records_Mar2024.pdf', size: '450 KB', type: 'application/pdf' },
  ])

  // UI state
  const [toast, setToast] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSchemeInfoModal, setShowSchemeInfoModal] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const handleRemoveAttachment = (id: number) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setIsDirty(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const newAtt = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
      }
      setAttachments((prev) => [...prev, newAtt])
      setIsDirty(true)
    }
  }

  const handleSaveDraft = () => {
    setIsDirty(false)
    showToast(t('cab.auditReporting.findingDraftSaved', 'Finding draft saved.'))
  }

  const handleSubmitFinding = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDirty(false)
    showToast(t('cab.auditReporting.findingSubmitted', 'Finding submitted successfully.'))
    setTimeout(() => {
      navigate('/cab/audit-reporting')
    }, 1200)
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true)
    } else {
      navigate('/cab/audit-reporting')
    }
  }

  return (
    <CabLayout sidebarVariant="auditReporting">
      <div className="flex flex-col min-h-screen">
        <CabHeader />

        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-4 right-4 z-[9999] bg-[#1236a3] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckIcon className="size-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        )}

        <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto pb-24">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="hover:text-[#1236a3] cursor-pointer transition-colors" onClick={() => navigate('/cab/audit-reporting')}>
              Audit Reporting
            </span>
            <span className="text-neutral-400">/</span>
            <span className="hover:text-[#1236a3] cursor-pointer transition-colors" onClick={() => navigate('/cab/audit-reporting')}>
              Findings
            </span>
            <span className="text-neutral-400">/</span>
            <span className="font-bold text-neutral-900">Add finding</span>
          </div>

          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-neutral-900">Add finding</h1>
              <p className="text-xs text-neutral-600 font-medium mt-0.5">
                Record a finding from the audit. Complete all relevant details and submit when ready.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-bold border border-neutral-300 rounded-xl text-neutral-700 bg-white hover:bg-neutral-50 shadow-sm flex items-center gap-2 self-start transition-colors"
            >
              ← Back to findings
            </button>
          </div>

          <form onSubmit={handleSubmitFinding} className="space-y-6">
            {/* Section 1: Audit and client information */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                Audit and client information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Application</label>
                  <input
                    type="text"
                    readOnly
                    value="APP-0024"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 text-neutral-900 font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Client</label>
                  <input
                    type="text"
                    readOnly
                    value="CL-0001 – Al Noor Food Industries"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 text-neutral-900 font-bold cursor-not-allowed truncate"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Site</label>
                  <input
                    type="text"
                    readOnly
                    value="Riyadh Production Site"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 text-neutral-900 font-bold cursor-not-allowed truncate"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Audit</label>
                  <input
                    type="text"
                    readOnly
                    value="QMS Surveillance Audit 2024"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 text-neutral-900 font-bold cursor-not-allowed truncate"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Audit date</label>
                  <input
                    type="text"
                    readOnly
                    value="12 Mar 2024 – 15 Mar 2024"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 text-neutral-900 font-bold cursor-not-allowed truncate"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Finding details */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                Finding details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Finding ID */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Finding ID</label>
                  <input
                    type="text"
                    readOnly
                    value={findingId}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-slate-50 font-black text-neutral-900 cursor-not-allowed"
                  />
                </div>

                {/* Classification */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block font-bold text-neutral-800">Classification*</label>
                    <button
                      type="button"
                      onClick={() => setShowSchemeInfoModal(true)}
                      className="size-4 rounded-full bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-[10px] hover:bg-neutral-300 transition-colors"
                      title="Scheme Rules Information"
                    >
                      i
                    </button>
                  </div>
                  <select
                    value={classification}
                    onChange={(e) => {
                      setClassification(e.target.value)
                      setIsDirty(true)
                    }}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                  >
                    <option value="">Select classification (pending scheme rules)</option>
                    <option value="Major Nonconformity">Major Nonconformity</option>
                    <option value="Minor Nonconformity">Minor Nonconformity</option>
                    <option value="Observation">Observation</option>
                    <option value="Opportunity for Improvement">Opportunity for Improvement</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Type*</label>
                  <select
                    value={findingType}
                    onChange={(e) => {
                      setFindingType(e.target.value)
                      setIsDirty(true)
                    }}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                  >
                    <option value="Nonconformity">Nonconformity</option>
                    <option value="Observation">Observation</option>
                    <option value="Opportunity for Improvement">Opportunity for Improvement</option>
                  </select>
                </div>

                {/* Requirement reference */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Requirement reference*</label>
                  <input
                    type="text"
                    required
                    value={requirementRef}
                    onChange={(e) => {
                      setRequirementRef(e.target.value)
                      setIsDirty(true)
                    }}
                    placeholder="e.g. ISO 9001:2015, Clause 8.5.1"
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                  />
                </div>

                {/* Objective evidence */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Objective evidence*</label>
                  <textarea
                    rows={4}
                    required
                    value={objectiveEvidence}
                    onChange={(e) => {
                      setObjectiveEvidence(e.target.value)
                      setIsDirty(true)
                    }}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white leading-relaxed"
                  />
                </div>

                {/* Finding statement */}
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Finding statement*</label>
                  <textarea
                    rows={4}
                    required
                    value={findingStatement}
                    onChange={(e) => {
                      setFindingStatement(e.target.value)
                      setIsDirty(true)
                    }}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: More details (Collapsible) */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setIsMoreDetailsOpen((prev) => !prev)}
                className="w-full p-6 flex items-center justify-between font-bold text-neutral-900 text-base border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
              >
                <span>More details</span>
                <ChevronDownIcon className={cn('size-5 text-neutral-500 transition-transform duration-200', isMoreDetailsOpen && 'rotate-180')} />
              </button>

              {isMoreDetailsOpen && (
                <div className="p-6 space-y-6">
                  {/* Attachments */}
                  <div className="space-y-3">
                    <label className="block font-bold text-neutral-800 text-xs">Attachments</label>

                    {/* Drag and Drop Zone */}
                    <div className="relative border-2 border-dashed border-neutral-300 rounded-2xl p-6 text-center hover:border-[#1236a3] transition-colors bg-slate-50/60">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 size-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="size-10 rounded-xl bg-[#e8edfc] border border-[#c5d7fa] text-[#1236a3] flex items-center justify-center">
                          <FileTextIcon className="size-5 text-[#1236a3]" />
                        </div>
                        <p className="text-xs font-bold text-neutral-800">
                          <span className="text-[#1236a3] hover:underline">Drag and drop files here</span> or click to upload
                        </p>
                        <p className="text-[11px] text-neutral-500 font-medium">Supported formats: PDF, DOC, DOCX, XLSX, JPG, PNG (Max 10 MB)</p>
                      </div>
                    </div>

                    {/* Attached file list */}
                    {attachments.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white text-xs">
                            <div className="flex items-center gap-3">
                              <FileTextIcon className="size-4 text-[#1236a3] shrink-0" />
                              <span className="font-bold text-neutral-900">{att.name}</span>
                              <span className="text-neutral-500 font-mono">({att.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="size-6 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form fields grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Process*</label>
                      <select
                        value={process}
                        onChange={(e) => {
                          setProcess(e.target.value)
                          setIsDirty(true)
                        }}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                      >
                        <option value="Storage and Handling">Storage and Handling</option>
                        <option value="Production">Production</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Responsible contact*</label>
                      <select
                        value={responsibleContact}
                        onChange={(e) => {
                          setResponsibleContact(e.target.value)
                          setIsDirty(true)
                        }}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                      >
                        <option value="Sara Ali (sara@alnoor.example)">Sara Ali (sara@alnoor.example)</option>
                        <option value="Ahmed Khan (ahmed@alnoor.example)">Ahmed Khan (ahmed@alnoor.example)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">Proposed response due date*</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value)
                          setIsDirty(true)
                        }}
                        className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                      />
                    </div>
                  </div>

                  {/* Additional comments */}
                  <div className="text-xs">
                    <label className="block font-bold text-neutral-800 mb-1">Additional comments</label>
                    <textarea
                      rows={3}
                      value={additionalComments}
                      onChange={(e) => {
                        setAdditionalComments(e.target.value)
                        setIsDirty(true)
                      }}
                      placeholder="Add any additional notes (optional)"
                      className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-[#1236a3] focus:border-[#1236a3] font-medium bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Footer Action Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-40 shadow-xl">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 text-xs font-bold border border-neutral-300 rounded-xl text-neutral-800 hover:bg-neutral-50 shadow-sm transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 text-xs font-bold border border-neutral-300 rounded-xl text-neutral-800 bg-white hover:bg-neutral-50 shadow-sm transition-colors"
                  >
                    Save draft
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#1236a3] text-white hover:bg-[#0e2a80] shadow-md transition-all cursor-pointer"
                  >
                    Submit finding
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>

        {/* Dirty Cancel Warning Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-[999] bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-neutral-900">Discard unsaved changes?</h3>
              <p className="text-xs text-neutral-600 font-medium">
                You have unsaved changes in this finding. Are you sure you want to discard them?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700"
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-reporting')}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheme Rules Classification Info Modal */}
        {showSchemeInfoModal && (
          <div className="fixed inset-0 z-[999] bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">Scheme Rules Classification</h3>
                <button
                  type="button"
                  onClick={() => setShowSchemeInfoModal(false)}
                  className="size-6 rounded-lg text-neutral-500 hover:text-neutral-900 font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                Classifications and due dates follow configured scheme rules. No universal major/minor deadline applies automatically across all certification schemes.
              </p>
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowSchemeInfoModal(false)}
                  className="px-4 py-2 text-xs font-bold bg-[#1236a3] text-white rounded-xl hover:bg-[#0e2a80]"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
