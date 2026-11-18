import { AVAILABLE_AUDITORS_POOL, type AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
import { SelectField } from '@/components/ui/Select'

interface BuildPlanTeamStepProps {
  leadAuditor: string
  leadMember: AuditTeamMember
  teamMembers: AuditTeamMember[]
  otherAuditors: AuditTeamMember[]
  showRecommendations: boolean
  auditTrailNote: string
  onChangeLeadAuditor: (name: string) => void
  onAddMember: (personId: string, role?: AuditTeamMember['role']) => void
  onRemoveMember: (id: string) => void
  onToggleRecommendations: () => void
  onChangeAuditTrailNote: (value: string) => void
  onConfirmTeam: () => void
}

export function BuildPlanTeamStep({
  leadAuditor,
  leadMember,
  teamMembers,
  otherAuditors,
  showRecommendations,
  auditTrailNote,
  onChangeLeadAuditor,
  onAddMember,
  onRemoveMember,
  onToggleRecommendations,
  onChangeAuditTrailNote,
  onConfirmTeam,
}: BuildPlanTeamStepProps) {
  return (
    <section className="space-y-6 rounded-[12px] border border-[#ececec] bg-white p-6 shadow-none">
      <div>
        <h2 className="text-[16px] font-bold text-neutral-900">Audit team hierarchy</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Assign a qualified Lead Auditor and build the audit team. Competence, availability, and impartiality checks run automatically.
        </p>
      </div>

      <div className="flex flex-col items-center">
        {/* Top Node: Lead Auditor */}
        <div className="w-full max-w-md rounded-[12px] border border-[#e2e2e2] bg-white p-4 shadow-xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-400">
              Lead Auditor
            </span>
            <div className="w-52">
              <SelectField
                value={leadAuditor}
                onChange={onChangeLeadAuditor}
                options={AVAILABLE_AUDITORS_POOL.filter((a) => a.role === 'Lead Auditor').map((a) => ({
                  value: a.name,
                  label: a.name,
                }))}
                className="h-9 text-[12px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[8px] border border-[#f0f0f0] bg-[#fcfcfd] px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="select-none text-neutral-300">⋮⋮</span>
              <div className="relative flex size-9 items-center justify-center rounded-full bg-[#e8edfc] text-[12px] font-bold text-[#1236a3]">
                {leadMember.initials}
                <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-white bg-[#16a34a]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-neutral-900">{leadMember.name}</p>
                <p className="text-[12px] text-neutral-500">Passes the checks</p>
              </div>
            </div>
            <span className="inline-flex size-7 items-center justify-center rounded-[6px] border border-[#ececec] text-neutral-400">
              −
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-[#d4d8e2]" />

        {/* Auditors Box */}
        <div className="w-full max-w-3xl space-y-3.5 rounded-[12px] border border-[#d6e0f5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-neutral-900">Auditors</h3>
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700">
                  {otherAuditors.length}
                </span>
              </div>
              <p className="text-[12px] text-neutral-400">Approved auditors</p>
            </div>
            <span className="inline-flex size-8 items-center justify-center rounded-[6px] bg-[#1236a3] font-bold text-white">
              −
            </span>
          </div>

          <SelectField
            value=""
            placeholder="Add Auditor"
            onChange={(val) => {
              if (val) onAddMember(val, 'Auditor')
            }}
            options={AVAILABLE_AUDITORS_POOL.filter(
              (a) => !teamMembers.some((m) => m.id === a.id),
            ).map((a) => ({
              value: a.id,
              label: `${a.name} — ${a.role} (${a.schemes.join(', ')})`,
            }))}
            className="h-11"
          />

          <div className="space-y-2">
            {otherAuditors.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-[8px] border border-[#f0f0f0] bg-white px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="select-none text-neutral-300">⋮⋮</span>
                  <div className="relative flex size-9 items-center justify-center rounded-full bg-[#e8edfc] text-[12px] font-bold text-[#1236a3]">
                    {member.initials}
                    <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-white bg-[#16a34a]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-neutral-900">{member.name}</p>
                      {member.role !== 'Auditor' && (
                        <span className="rounded-[4px] bg-[#f3f6fd] px-2 py-0.5 text-[11px] font-medium text-[#1236a3]">
                          {member.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-neutral-500">Passes the checks</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveMember(member.id)}
                  className="inline-flex size-7 items-center justify-center rounded-[6px] border border-[#ececec] text-neutral-500 hover:bg-neutral-50 hover:text-error-600"
                  title="Remove from team"
                >
                  −
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Role Quick-Add Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {[
            { id: 'aud-tarek', role: 'Technical Expert' as const, label: '+ Technical expert' },
            { id: 'aud-nadia', role: 'Trainee Auditor' as const, label: '+ Trainee auditor' },
            { id: 'aud-karim', role: 'Observer' as const, label: '+ Observer' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onAddMember(btn.id, btn.role)}
              className="rounded-full border border-dashed border-[#b9c8ea] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd]"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations and reasons */}
      <div>
        <button
          type="button"
          onClick={onToggleRecommendations}
          className="text-[13px] font-semibold text-[#1236a3] hover:underline"
        >
          {showRecommendations ? 'Hide recommendations and reasons' : 'Show recommendations and reasons'}
        </button>

        {showRecommendations && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-[10px] border border-[#e2e8f5] bg-[#f8faff] p-4 sm:grid-cols-2">
            {teamMembers.map((m) => (
              <div key={m.id} className="rounded-[8px] border border-white bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-neutral-900">
                    {m.name} ({m.role})
                  </span>
                  <span className="rounded-[4px] bg-[#dcfce7] px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                    Eligible
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-neutral-600">
                  {m.reason ||
                    `Authorized for ${m.schemes.join(', ')} (${m.iafCodes.join(', ')}). Available and conflict-free.`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit trail note + Confirm */}
      <div className="space-y-3 border-t border-[#f0f0f0] pt-4">
        <label className="block text-[13px] font-semibold text-neutral-800">
          Note for the audit trail (optional)
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={auditTrailNote}
            onChange={(e) => onChangeAuditTrailNote(e.target.value)}
            placeholder="For example: agreed with the technical manager"
            className="h-11 flex-1 rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
          />
          <button
            type="button"
            onClick={onConfirmTeam}
            className="h-11 shrink-0 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0e2a80]"
          >
            Confirm team
          </button>
        </div>

        <div className="flex items-center gap-3 pt-1 text-[12px] font-semibold text-[#1236a3]">
          <span>Exceptions (0, pending 0)</span>
          <span className="text-neutral-300">|</span>
          <span>Team history (1)</span>
        </div>
      </div>
    </section>
  )
}
