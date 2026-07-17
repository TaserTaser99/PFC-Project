import { randomUUID } from 'node:crypto'
import { readUsers, withDbMutation, writeUsers } from '../db.js'
import type { UserProfile } from '../models.js'

export type PublicUser = Pick<UserProfile, 'id' | 'name' | 'preferredWorkload' | 'completedCourseIds'>
export type SearchUser = Pick<UserProfile, 'id' | 'name'>

function toPublicUser(user: UserProfile): PublicUser {
  return {
    id: user.id,
    name: user.name,
    preferredWorkload: user.preferredWorkload,
    completedCourseIds: user.completedCourseIds
  }
}

export async function listPublicUsers(): Promise<PublicUser[]> {
  const users = await readUsers()
  return users.map(toPublicUser)
}

export async function searchUsers(query: string, limit = 10): Promise<SearchUser[]> {
  const users = await readUsers()
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return []

  const boundedLimit = Math.max(1, Math.min(limit, 20))
  return users
    .filter((user) => user.name.toLocaleLowerCase().includes(normalizedQuery))
    .slice(0, boundedLimit)
    .map(({ id, name }) => ({ id, name }))
}

export async function createUser(name: string): Promise<UserProfile> {
  const normalizedName = name.trim().replace(/\s+/g, ' ').slice(0, 100)
  if (normalizedName.length < 2) throw new Error('invalid_name')

  return withDbMutation(async () => {
    const users = await readUsers()
    const newUser: UserProfile = {
      id: `u-${randomUUID()}`,
      name: normalizedName,
      preferredWorkload: 16,
      completedCourseIds: [],
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    await writeUsers(users)
    return newUser
  })
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const users = await readUsers()
  return users.find((user) => user.id === id) ?? null
}
