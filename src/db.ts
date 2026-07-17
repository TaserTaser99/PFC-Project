import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { FriendRequest, Friendship, UserProfile } from './models.js'

const DATA_DIR = path.resolve(process.cwd(), process.env.DB_DIR ?? 'db')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const REQUESTS_FILE = path.join(DATA_DIR, 'friend_requests.json')
const FRIENDS_FILE = path.join(DATA_DIR, 'friendships.json')

let mutationQueue: Promise<void> = Promise.resolve()

function createDemoData() {
  const now = new Date().toISOString()
  const users: UserProfile[] = [
    { id: 'u1', name: 'Alex Chen', preferredWorkload: 18, completedCourseIds: ['c1', 'c2'], createdAt: now },
    { id: 'u2', name: 'Maya Singh', preferredWorkload: 16, completedCourseIds: ['c2', 'c5'], createdAt: now },
    { id: 'u3', name: 'Jordan Lee', preferredWorkload: 15, completedCourseIds: ['c1', 'c3'], createdAt: now },
    { id: 'u4', name: 'Sam Patel', preferredWorkload: 20, completedCourseIds: ['c4'], createdAt: now }
  ]
  const requests: FriendRequest[] = [
    {
      id: 'r-demo-jordan-alex',
      senderId: 'u3',
      recipientId: 'u1',
      status: 'pending',
      createdAt: now
    }
  ]
  const friendships: Friendship[] = [
    {
      id: 'f-demo-alex-maya',
      userA: 'u1',
      userB: 'u2',
      createdAt: now
    }
  ]
  return { users, requests, friendships }
}

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

async function writeJsonAtomic<T>(file: string, data: T[]) {
  await ensureDir()
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`
  await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  await fs.rename(temporaryFile, file)
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
  const [users, requests, friendships] = await Promise.all([
    readUsers(),
    readRequests(),
    readFriendships()
  ])

  await Promise.all([
    writeUsers(users),
    writeRequests(requests),
    writeFriendships(friendships)
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
  })
}

export async function resetDemoData() {
  await withDbMutation(async () => {
    const demoData = createDemoData()
    await Promise.all([
      writeUsers(demoData.users),
      writeRequests(demoData.requests),
      writeFriendships(demoData.friendships)
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
