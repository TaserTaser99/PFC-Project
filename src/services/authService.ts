import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { degreePlans } from '../data/degreePlans.js'
import { readCredentials, readUsers, withDbMutation, writeCredentials, writeUsers } from '../db.js'
import type { AuthCredential, UserProfile } from '../models.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 100)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex')
}

function encodePassword(password: string): string {
  const salt = randomUUID().split('-').join('')
  const digest = hashPassword(password, salt)
  return `${salt}:${digest}`
}

function verifyPassword(password: string, encoded: string): boolean {
  const [salt, digest] = encoded.split(':')
  if (!salt || !digest) return false

  const expected = Buffer.from(digest, 'hex')
  const actual = Buffer.from(hashPassword(password, salt), 'hex')
  if (expected.length !== actual.length) return false

  return timingSafeEqual(expected, actual)
}

function normalizeDegreePlanId(degreePlanId: string): string {
  return degreePlanId.trim()
}

function resolveDegreePlan(degreePlanId: string) {
  return degreePlans.find((plan) => plan.id === normalizeDegreePlanId(degreePlanId))
}

function assertValidSignupInput(
  name: string,
  email: string,
  password: string,
  degreePlanId: string
) {
  if (normalizeName(name).length < 2) throw new Error('invalid_name')
  if (!EMAIL_PATTERN.test(normalizeEmail(email))) throw new Error('invalid_email')
  if (password.length < 8) throw new Error('invalid_password')
  if (!resolveDegreePlan(degreePlanId)) throw new Error('invalid_degree')
}

const DEFAULT_DEGREE = degreePlans[0]?.label ?? 'General Studies'
const DEFAULT_DEGREE_COURSE_IDS = degreePlans[0]?.courseIds ?? []

function toPublicUser(user: UserProfile) {
  return {
    id: user.id,
    name: user.name,
    preferredWorkload: user.preferredWorkload,
    completedCourseIds: user.completedCourseIds,
    degree: user.degree ?? DEFAULT_DEGREE,
    degreeCourseIds: user.degreeCourseIds?.length ? user.degreeCourseIds : DEFAULT_DEGREE_COURSE_IDS
  }
}

export async function signup(
  name: string,
  email: string,
  password: string,
  degreePlanId: string
) {
  assertValidSignupInput(name, email, password, degreePlanId)

  const normalizedName = normalizeName(name)
  const normalizedEmail = normalizeEmail(email)
  const degreePlan = resolveDegreePlan(degreePlanId)
  if (!degreePlan) {
    throw new Error('invalid_degree')
  }

  return withDbMutation(async () => {
    const [users, credentials] = await Promise.all([readUsers(), readCredentials()])
    const existing = credentials.find((entry) => entry.email === normalizedEmail)
    if (existing) throw new Error('email_in_use')

    const now = new Date().toISOString()
    const user: UserProfile = {
      id: `u-${randomUUID()}`,
      name: normalizedName,
      preferredWorkload: 16,
      completedCourseIds: [],
      degree: degreePlan.label,
      degreeCourseIds: degreePlan.courseIds,
      plannedCourses: {},
      createdAt: now
    }

    const credential: AuthCredential = {
      id: `cred-${randomUUID()}`,
      userId: user.id,
      email: normalizedEmail,
      passwordHash: encodePassword(password),
      createdAt: now
    }

    users.push(user)
    credentials.push(credential)

    await Promise.all([writeUsers(users), writeCredentials(credentials)])

    return { user: toPublicUser(user) }
  })
}

export async function login(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  if (!EMAIL_PATTERN.test(normalizedEmail)) throw new Error('invalid_credentials')
  if (!password) throw new Error('invalid_credentials')

  const [credentials, users] = await Promise.all([readCredentials(), readUsers()])
  const credential = credentials.find((entry) => entry.email === normalizedEmail)
  if (!credential) throw new Error('invalid_credentials')

  if (!verifyPassword(password, credential.passwordHash)) {
    throw new Error('invalid_credentials')
  }

  const user = users.find((candidate) => candidate.id === credential.userId)
  if (!user) throw new Error('user_not_found')

  return { user: toPublicUser(user) }
}
