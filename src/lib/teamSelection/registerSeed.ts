import type { RelationshipType, UnavailabilityReason } from './catalog'

/**
 * Demo impartiality and availability records for the personnel register.
 * Same records as the reference implementation; replace with the register API later.
 */

export interface RelationshipSeedEntry {
  id: string
  personId: string
  clientName: string
  type: RelationshipType
  description: string
  startDate: string | null
  endDate: string | null
  reviewStatus: 'CONFIRMED' | 'PENDING' | 'DISMISSED'
}

export interface UnavailabilitySeedEntry {
  id: string
  personId: string
  startDate: string
  endDate: string
  reason: UnavailabilityReason
  notes: string
}

/** Every person with approved standards signed their annual declaration on this date. */
export const ANNUAL_DECLARATION_VALID_UNTIL = '2027-10-05'

export const RELATIONSHIPS_SEED: RelationshipSeedEntry[] = [
  {
    id: 'rel-0001',
    personId: 'emp-0003',
    clientName: 'Al Noor Food Industries',
    type: 'CONSULTANCY',
    description: 'Helped Al Noor prepare its HACCP and ISO 9001 documentation as an external consultant.',
    startDate: '2024-03-01',
    endDate: '2025-12-31',
    reviewStatus: 'CONFIRMED',
  },
  {
    id: 'rel-0002',
    personId: 'emp-0004',
    clientName: 'Al Waha Trading Co.',
    type: 'FAMILY',
    description: 'Cousin is a shareholder of Al Waha Trading Co.',
    startDate: null,
    endDate: null,
    reviewStatus: 'CONFIRMED',
  },
]

export const UNAVAILABILITY_SEED: UnavailabilitySeedEntry[] = [
  {
    id: 'una-0001',
    personId: 'emp-0003',
    startDate: '2026-12-09',
    endDate: '2026-12-15',
    reason: 'LEAVE',
    notes: 'Annual leave',
  },
  {
    id: 'una-0002',
    personId: 'emp-0002',
    startDate: '2026-11-02',
    endDate: '2026-11-05',
    reason: 'TRAINING',
    notes: 'FSSC 22000 v6 update course',
  },
]
