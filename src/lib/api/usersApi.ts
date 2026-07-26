/**
 * User-management data layer.
 *
 * The iCasco Platform API doc does not (yet) expose user-management
 * endpoints (list / create / update status / delete), so everything below
 * is mocked — same approach as dashboardApi.ts. Once the backend ships real
 * endpoints, only the bodies of these functions need to change to call
 * `authorizedClient`; the page itself needs no edits.
 */

export type AppUserRole = 'auditor' | 'reviewer'
export type AppUserStatus = 'active' | 'inactive'

export interface AppUser {
  id: string
  name: string
  role: AppUserRole
  email: string
  phone: string
  status: AppUserStatus
}

export interface UsersStats {
  inactive: number
  active: number
  total: number
}

const MOCK_USERS: AppUser[] = [
  {
    id: '1',
    name: 'احمد خالد',
    role: 'auditor',
    email: 'ahmed675@gmail.com',
    phone: '+20 100 123 4567',
    status: 'inactive',
  },
  {
    id: '2',
    name: 'مروان احمد',
    role: 'reviewer',
    email: 'marwan679@gmail.com',
    phone: '+20 111 234 5678',
    status: 'active',
  },
  {
    id: '3',
    name: 'احمد خالد',
    role: 'auditor',
    email: 'ahmed675@gmail.com',
    phone: '+20 100 123 4567',
    status: 'inactive',
  },
]

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function statsFromUsers(users: AppUser[]): UsersStats {
  const active = users.filter((user) => user.status === 'active').length
  return { inactive: users.length - active, active, total: users.length }
}

// TODO: replace with `authorizedRequest<AppUser[]>('/users')` once the
// backend exposes this endpoint (see userApi.ts for the pattern).
export function listUsers(): Promise<AppUser[]> {
  return delay(MOCK_USERS)
}

export function getUsersStats(): Promise<UsersStats> {
  return delay(MOCK_USERS).then(statsFromUsers)
}

// TODO: replace with `authorizedRequest('/users', { method: 'PATCH', body: { status } })`
export function setUserStatus(id: string, status: AppUserStatus): Promise<void> {
  const user = MOCK_USERS.find((u) => u.id === id)
  if (user) user.status = status
  return delay(undefined)
}

// TODO: replace with `authorizedRequest('/users/{id}', { method: 'DELETE' })`
export function deleteUser(id: string): Promise<void> {
  const index = MOCK_USERS.findIndex((u) => u.id === id)
  if (index !== -1) MOCK_USERS.splice(index, 1)
  return delay(undefined)
}