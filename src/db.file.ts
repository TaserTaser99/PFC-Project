import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createDemoData } from './data/demoData.js'
import type {
  AuthCredential,
  CourseProgressRecord,
  FriendRequest,
  Friendship,
  UserProfile
} from './models.js'

// Serverless platforms (Vercel, AWS Lambda) only allow writes under the OS
// temporary directory, so the store defaults there when deployed. Data written
// to /tmp is ephemeral: it disappears whenever the function instance recycles.
const DEFAULT_DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join(os.tmpdir(), 'pfc-db')
    : path.resolve(process.cwd(), 'db')

const DATA_DIR = process.env.DB_DIR
  ? path.resolve(process.cwd(), process.env.DB_DIR)
  : DEFAULT_DATA_DIR
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const REQUESTS_FILE = path.join(DATA_DIR, 'friend_requests.json')
const FRIENDS_FILE = path.join(DATA_DIR, 'friendships.json')
const COURSE_PROGRESS_FILE = path.join(DATA_DIR, 'course_progress.json')
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json')

let mutationQueue: Promise<void> = Promise.resolve()

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readJsonArray<T>(file: string): Promise<T[]> {
  try {
    const text = await fs.readFile(file, 'utf-8')
    const parsed: unknown = JSON.parse(text)
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected an array in ${path.basename(file)}`)
    }
    return parsed as T[]
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

// Deliberately does not take the mutation queue: callers that need
// read-modify-write consistency wrap the whole operation in withDbMutation,
// and taking the queue here as well would deadlock those callers.
async function writeJsonAtomic<T>(file: string, data: T[]) {
  await ensureDir()
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`
  await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  try {
    await fs.rename(temporaryFile, file)
  } catch (err) {
    try {
      await fs.unlink(file).catch(() => {})
      await fs.rename(temporaryFile, file)
    } catch (err2) {
      await fs.unlink(temporaryFile).catch(() => {})
      throw err2
    }
  }
}

export async function withDbMutation<T>(operation: () => Promise<T>): Promise<T> {
  const previous = mutationQueue
  let release!: () => void
  mutationQueue = new Promise<void>((resolve) => {
    release = resolve
  })

  await previous
  try {
    return await operation()
  } finally {
    release()
  }
}

export async function migrate() {
  await ensureDir()
  const [users, requests, friendships, courseProgress, credentials] = await Promise.all([
    readUsers(),
    readRequests(),
    readFriendships(),
    readCourseProgress(),
    readCredentials()
  ])

  await Promise.all([
    writeUsers(users),
    writeRequests(requests),
    writeFriendships(friendships),
    writeCourseProgress(courseProgress),
    writeCredentials(credentials)
  ])
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
  await ensureDir()
  return readJsonArray<UserProfile>(USERS_FILE)
}

export async function writeUsers(users: UserProfile[]) {
  await writeJsonAtomic(USERS_FILE, users)
}

export async function readRequests(): Promise<FriendRequest[]> {
  await ensureDir()
  return readJsonArray<FriendRequest>(REQUESTS_FILE)
}

export async function writeRequests(requests: FriendRequest[]) {
  await writeJsonAtomic(REQUESTS_FILE, requests)
}

export async function readFriendships(): Promise<Friendship[]> {
  await ensureDir()
  return readJsonArray<Friendship>(FRIENDS_FILE)
}

export async function writeFriendships(friendships: Friendship[]) {
  await writeJsonAtomic(FRIENDS_FILE, friendships)
}

export async function readCourseProgress(): Promise<CourseProgressRecord[]> {
  await ensureDir()
  return readJsonArray<CourseProgressRecord>(COURSE_PROGRESS_FILE)
}

export async function writeCourseProgress(records: CourseProgressRecord[]) {
  await writeJsonAtomic(COURSE_PROGRESS_FILE, records)
}

export async function readCredentials(): Promise<AuthCredential[]> {
  await ensureDir()
  return readJsonArray<AuthCredential>(CREDENTIALS_FILE)
}

export async function writeCredentials(credentials: AuthCredential[]) {
  await writeJsonAtomic(CREDENTIALS_FILE, credentials)
}

if (['migrate', 'seed', 'reset-demo'].includes(process.argv[2] ?? '')) {
  void (async () => {
    try {
      const command = process.argv[2]
      await migrate()
      if (command === 'seed') await seedIfEmpty()
      if (command === 'reset-demo') await resetDemoData()
      console.log('Database files created or updated in', DATA_DIR)
    } catch (error) {
      console.error(error)
      process.exitCode = 1
    }
  })()
}
