import pg from 'pg'
import { createDemoData } from './data/demoData.js'
import type {
  AuthCredential,
  CourseProgressRecord,
  FriendRequest,
  Friendship,
  UserProfile
} from './models.js'

// Postgres backend for the JSON-array store. Each logical collection
// (users, credentials, ...) is one row in a `collections` table holding the
// whole array as jsonb, mirroring the file backend's read-all/write-all
// interface so the services need no changes. Unlike files under /tmp, this
// store is shared by every serverless instance and survives cold starts.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL must be set to use the postgres backend')
}

const pool = new pg.Pool({ connectionString, max: 5 })

const USERS = 'users'
const REQUESTS = 'friend_requests'
const FRIENDS = 'friendships'
const COURSE_PROGRESS = 'course_progress'
const CREDENTIALS = 'credentials'

let schemaReady: Promise<unknown> | undefined

function ensureSchema() {
  schemaReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      name text PRIMARY KEY,
      data jsonb NOT NULL DEFAULT '[]'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  return schemaReady
}

async function readCollection<T>(name: string): Promise<T[]> {
  await ensureSchema()
  const result = await pool.query('SELECT data FROM collections WHERE name = $1', [name])
  const data: unknown = result.rows[0]?.data ?? []
  if (!Array.isArray(data)) {
    throw new Error(`Expected an array in collection ${name}`)
  }
  return data as T[]
}

async function writeCollection<T>(name: string, data: T[]) {
  await ensureSchema()
  await pool.query(
    `INSERT INTO collections (name, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [name, JSON.stringify(data)]
  )
}

// Global mutex for read-modify-write sequences. A transaction-scoped advisory
// lock is held on a dedicated connection for the duration of the operation,
// serialising mutations across ALL serverless instances, not just this
// process (which is all the file backend's in-process queue could do). The
// transaction exists only to hold the lock; the operation's own queries run
// through the pool and each commit independently.
const MUTATION_LOCK_KEY = 727201

export async function withDbMutation<T>(operation: () => Promise<T>): Promise<T> {
  await ensureSchema()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [MUTATION_LOCK_KEY])
    try {
      const result = await operation()
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } finally {
    client.release()
  }
}

export async function migrate() {
  await ensureSchema()
}

export async function seedIfEmpty() {
  await withDbMutation(async () => {
    let users = await readUsers()
    if (users.length === 0) {
      users = createDemoData().users
      await writeUsers(users)
    }

    const hasDemoUsers = ['u1', 'u2', 'u3'].every((id) =>
      users.some((user) => user.id === id)
    )
    if (!hasDemoUsers) return

    const requests = await readRequests()
    if (requests.length === 0) {
      await writeRequests(createDemoData().requests)
    }

    const friendships = await readFriendships()
    if (friendships.length === 0) {
      await writeFriendships(createDemoData().friendships)
    }

    const courseProgress = await readCourseProgress()
    if (courseProgress.length === 0) {
      await writeCourseProgress(createDemoData().courseProgress)
    }
  })
}

export async function resetDemoData() {
  await withDbMutation(async () => {
    const demoData = createDemoData()
    await Promise.all([
      writeUsers(demoData.users),
      writeRequests(demoData.requests),
      writeFriendships(demoData.friendships),
      writeCourseProgress(demoData.courseProgress),
      writeCredentials([])
    ])
  })
}

export async function readUsers(): Promise<UserProfile[]> {
  return readCollection<UserProfile>(USERS)
}

export async function writeUsers(users: UserProfile[]) {
  await writeCollection(USERS, users)
}

export async function readRequests(): Promise<FriendRequest[]> {
  return readCollection<FriendRequest>(REQUESTS)
}

export async function writeRequests(requests: FriendRequest[]) {
  await writeCollection(REQUESTS, requests)
}

export async function readFriendships(): Promise<Friendship[]> {
  return readCollection<Friendship>(FRIENDS)
}

export async function writeFriendships(friendships: Friendship[]) {
  await writeCollection(FRIENDS, friendships)
}

export async function readCourseProgress(): Promise<CourseProgressRecord[]> {
  return readCollection<CourseProgressRecord>(COURSE_PROGRESS)
}

export async function writeCourseProgress(records: CourseProgressRecord[]) {
  await writeCollection(COURSE_PROGRESS, records)
}

export async function readCredentials(): Promise<AuthCredential[]> {
  return readCollection<AuthCredential>(CREDENTIALS)
}

export async function writeCredentials(credentials: AuthCredential[]) {
  await writeCollection(CREDENTIALS, credentials)
}
