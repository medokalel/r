import type { AttendeeRecord, AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import type { StageReportAcknowledgement, StageReportState } from '@/lib/api/stageReport'

/**
 * What the audit client may see of an audit's execution and report. Pure view
 * helpers over the plan the CAB already stores: the client never sees internal
 * notes, team review, time sheets or signatures.
 */

export const OPENING_MEETING_STEP = 2
export const CLOSING_MEETING_STEP = 5

export interface ClientAttendee {
  id: string
  name: string
  position: string
  organization: AttendeeRecord['organization']
  attendedRemotely: boolean
}

export interface ClientMeetingSummary {
  held: boolean
  attendees: ClientAttendee[]
}

export interface ClientClosingSummary extends ClientMeetingSummary {
  findingsPresented: boolean
  clientPosition: 'Agrees' | 'Partly agrees' | 'Disagrees' | ''
  clientComments: string
  ncResponseDueBy: string
}

export interface ClientExecutionSummary {
  /** False until the audit team started the execution: nothing to show yet. */
  started: boolean
  opening: ClientMeetingSummary
  closing: ClientClosingSummary
}

function toAttendees(list: AttendeeRecord[] | undefined): ClientAttendee[] {
  return (list ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    position: a.position,
    organization: a.organization,
    attendedRemotely: Boolean(a.attendedRemotely),
  }))
}

/** Meetings count as held once the audit team completed their step. */
export function getClientExecutionSummary(plan: AuditPlan): ClientExecutionSummary {
  const execution = plan.execution
  const completed = execution?.completedSteps ?? []
  return {
    started: Boolean(execution?.started),
    opening: {
      held: completed.includes(OPENING_MEETING_STEP),
      attendees: toAttendees(execution?.openingMeeting?.attendees),
    },
    closing: {
      held: completed.includes(CLOSING_MEETING_STEP),
      attendees: toAttendees(execution?.closingMeeting?.attendees),
      findingsPresented: Boolean(execution?.closingMeeting?.findingsPresented),
      clientPosition: execution?.closingMeeting?.clientPosition ?? '',
      clientComments: execution?.closingMeeting?.clientComments ?? '',
      ncResponseDueBy: execution?.closingMeeting?.ncResponseDueBy ?? '',
    },
  }
}

export type ClientReportStatus = 'notIssued' | 'issued' | 'acknowledged'

/** The report is visible to the client only once issued with its frozen snapshot. */
export function getClientReportStatus(plan: Pick<AuditPlan, 'stageReport'>): ClientReportStatus {
  const report: StageReportState | undefined = plan.stageReport
  if (!report || report.status !== 'issued' || !report.snapshot) return 'notIssued'
  return report.acknowledgement ? 'acknowledged' : 'issued'
}

export function getClientReportAcknowledgement(
  plan: Pick<AuditPlan, 'stageReport'>,
): StageReportAcknowledgement | null {
  return plan.stageReport?.acknowledgement ?? null
}
