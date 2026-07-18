import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { degreePlans } from './data/degreePlans.js'
import type {
  AuthCredential,
  CourseProgressRecord,
  FriendRequest,
  Friendship,
  UserProfile
} from './models.js'

const DATA_DIR = path.resolve(process.cwd(), process.env.DB_DIR ?? 'db')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const REQUESTS_FILE = path.join(DATA_DIR, 'friend_requests.json')
const FRIENDS_FILE = path.join(DATA_DIR, 'friendships.json')
const COURSE_PROGRESS_FILE = path.join(DATA_DIR, 'course_progress.json')
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json')

let mutationQueue: Promise<void> = Promise.resolve()

async function enqueueMutation<T>(fn: () => Promise<T>): Promise<T> {
  const previous = mutationQueue
  const resultP = (async () => {
    await previous
    return fn()
  })()
  mutationQueue = resultP.then(() => {}).catch(() => {})
  return resultP
}

function createDemoData() {
  const now = new Date().toISOString()
  const degreePlanById = new Map(degreePlans.map((plan) => [plan.id, plan]))
  const degreeOf = (id: string) => {
    const plan = degreePlanById.get(id as (typeof degreePlans)[number]['id'])
    if (!plan) {
      throw new Error(`Missing degree plan: ${id}`)
    }
    return { label: plan.label, courseIds: plan.courseIds }
  }

  const compSci = degreeOf('computer-science')
  const commerce = degreeOf('commerce')
  const economics = degreeOf('economics')
  const actuarial = degreeOf('actuarial-studies')

  const users: UserProfile[] = [
    {
      id: 'u1',
      name: 'Alex Chen',
      preferredWorkload: 18,
      completedCourseIds: ['c1', 'c2'],
      degree: compSci.label,
      degreeCourseIds: compSci.courseIds,
      plannedCourses: { '1': ['c2', 'c5'], '2': ['c1', 'c3'], '3': ['c4', 'c6'] },
      createdAt: now,
      programCode: 'computer-science'
    },
    {
      id: 'u2',
      name: 'Maya Singh',
      preferredWorkload: 16,
      completedCourseIds: ['c2', 'c5'],
      degree: commerce.label,
      degreeCourseIds: commerce.courseIds,
      plannedCourses: { '1': ['c2'], '2': ['c3'], '3': ['c6'] },
      createdAt: now,
      programCode: 'software-engineering'
    },
    {
      id: 'u3',
      name: 'Jordan Lee',
      preferredWorkload: 15,
      completedCourseIds: ['c1', 'c3'],
      degree: economics.label,
      degreeCourseIds: economics.courseIds,
      plannedCourses: { '1': ['c5'], '2': ['c1', 'c3'], '3': ['c4'] },
      createdAt: now,
      programCode: 'actuarial-studies'
    },
    {
      id: 'u4',
      name: 'Sam Patel',
      preferredWorkload: 20,
      completedCourseIds: ['c4'],
      degree: actuarial.label,
      degreeCourseIds: actuarial.courseIds,
      plannedCourses: { '1': ['c2'], '2': ['c1'], '3': ['c4', 'c6'] },
      createdAt: now,
      programCode: 'commerce-finance'
    }
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
  const courseProgress: CourseProgressRecord[] = [
    { userId: 'u1', courseCode: 'COMP1511', status: 'completed' },
    { userId: 'u1', courseCode: 'COMP1521', status: 'completed' },
    { userId: 'u1', courseCode: 'MATH1081', status: 'completed' },
    { userId: 'u1', courseCode: 'COMP1531', status: 'planned' },
    { userId: 'u2', courseCode: 'COMP1511', status: 'completed' },
    { userId: 'u2', courseCode: 'COMP1521', status: 'completed' },
    { userId: 'u2', courseCode: 'COMP1531', status: 'completed' },
    { userId: 'u2', courseCode: 'DESN1000', status: 'completed' },
    { userId: 'u3', courseCode: 'ACTL1101', status: 'completed' },
    { userId: 'u3', courseCode: 'COMM1170', status: 'completed' },
    { userId: 'u3', courseCode: 'MATH1151', status: 'planned' },
    { userId: 'u4', courseCode: 'COMM1100', status: 'completed' },
    { userId: 'u4', courseCode: 'COMM1110', status: 'completed' }
  ]
  return { users, requests, friendships, courseProgress }
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
  return enqueueMutation(async () => {
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
  })
}

export async function withDbMutation<T>(operation: () => Promise<T>): Promise<T> {
  return enqueueMutation(operation)
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
