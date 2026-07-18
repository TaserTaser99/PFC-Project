import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

const TEST_DB_DIR = path.resolve(process.cwd(), 'test-db')
process.env.DB_DIR = TEST_DB_DIR

let db: any
let authService: any

before(async () => {
  db = await import('../src/db.js')
  authService = await import('../src/services/authService.js')
})

after(async () => {
  await fs.rm(TEST_DB_DIR, { recursive: true, force: true })
})

afterEach(async () => {
  await fs.rm(TEST_DB_DIR, { recursive: true, force: true })
})

describe('Auth service', () => {
  it('should persist signup credentials and allow login', async () => {
    await db.migrate()

    const signup = await authService.signup(
      'Alice Example',
      'alice@example.com',
      'password123',
      'computer-science'
    )
    assert.ok(signup.user.id)
    assert.strictEqual(signup.user.name, 'Alice Example')
    assert.strictEqual(signup.user.degree, 'Computer Science')
    assert.ok(signup.user.degreeCourseIds.length > 0)

    const login = await authService.login('alice@example.com', 'password123')
    assert.strictEqual(login.user.id, signup.user.id)

    const users = await db.readUsers()
    const credentials = await db.readCredentials()
    assert.strictEqual(users.length, 1)
    assert.strictEqual(credentials.length, 1)
    assert.strictEqual(credentials[0].userId, signup.user.id)
  })

  it('should reject duplicate emails and bad credentials', async () => {
    await db.migrate()

    await authService.signup(
      'Bob Example',
      'bob@example.com',
      'password123',
      'economics'
    )

    await assert.rejects(
      () =>
        authService.signup(
          'Another Bob',
          'bob@example.com',
          'password123',
          'economics'
        ),
      { message: 'email_in_use' }
    )

    await assert.rejects(
      () => authService.login('bob@example.com', 'wrong-password'),
      { message: 'invalid_credentials' }
    )
  })
})
