// Load .env for local development; on Vercel env vars are injected directly
// and no .env file exists, and Node < 20.12 lacks loadEnvFile entirely.
try {
  process.loadEnvFile()
} catch {
  // no .env file (or unsupported Node): fall through to whatever is set
}

// Facade loader. An explicit DB_DIR (used by the test suite) pins the file
// backend so tests stay hermetic even when a DATABASE_URL is configured;
// otherwise a DATABASE_URL selects postgres. DB_TYPE overrides everything.
const DB_TYPE =
  process.env.DB_TYPE ??
  (process.env.DB_DIR ? 'file' : process.env.DATABASE_URL ? 'postgres' : 'file')

const implPromise: Promise<any> =
  DB_TYPE === 'postgres' ? import('./db.postgres.js') : import('./db.file.js')

export async function withDbMutation<T>(operation: () => Promise<T>): Promise<T> {
  const impl = await implPromise
  return impl.withDbMutation(operation)
}

export async function migrate() {
  const impl = await implPromise
  return impl.migrate()
}

export async function seedIfEmpty() {
  const impl = await implPromise
  return impl.seedIfEmpty()
}

export async function resetDemoData() {
  const impl = await implPromise
  return impl.resetDemoData()
}

export async function readUsers() {
  const impl = await implPromise
  return impl.readUsers()
}

export async function writeUsers(users: any[]) {
  const impl = await implPromise
  return impl.writeUsers(users)
}

export async function readRequests() {
  const impl = await implPromise
  return impl.readRequests()
}

export async function writeRequests(requests: any[]) {
  const impl = await implPromise
  return impl.writeRequests(requests)
}

export async function readFriendships() {
  const impl = await implPromise
  return impl.readFriendships()
}

export async function writeFriendships(friendships: any[]) {
  const impl = await implPromise
  return impl.writeFriendships(friendships)
}

export async function readCourseProgress() {
  const impl = await implPromise
  return impl.readCourseProgress()
}

export async function writeCourseProgress(records: any[]) {
  const impl = await implPromise
  return impl.writeCourseProgress(records)
}

export async function readCredentials() {
  const impl = await implPromise
  return impl.readCredentials()
}

export async function writeCredentials(credentials: any[]) {
  const impl = await implPromise
  return impl.writeCredentials(credentials)
}

// If invoked directly via node, pass through CLI commands to implementation
if (['migrate', 'seed', 'reset-demo'].includes(process.argv[2] ?? '')) {
  void (async () => {
    try {
      const impl = await implPromise
      const command = process.argv[2]
      await impl.migrate()
      if (command === 'seed') await impl.seedIfEmpty()
      if (command === 'reset-demo') await impl.resetDemoData()
      console.log('Database backend', DB_TYPE)
    } catch (error) {
      console.error(error)
      process.exitCode = 1
    }
  })()
}
