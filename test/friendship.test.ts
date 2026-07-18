import assert from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path'

const TEST_DB_DIR = path.resolve(process.cwd(), 'test-db')
process.env.DB_DIR = TEST_DB_DIR

let db: any
let userService: any
let friendService: any

before(async () => {
  db = await import('../src/db.js')
  userService = await import('../src/services/userService.js')
  friendService = await import('../src/services/friendService.js')
})

after(async () => {
  await fs.rm(TEST_DB_DIR, { recursive: true, force: true })
})

afterEach(async () => {
  await fs.rm(TEST_DB_DIR, { recursive: true, force: true })
})

async function setupUsers() {
  await db.migrate()
  await db.writeUsers([
    { id: 'u1', name: 'Alice', preferredWorkload: 18, completedCourseIds: [], degree: 'CS', degreeCourseIds: [], plannedCourses: {}, createdAt: new Date().toISOString() },
    { id: 'u2', name: 'Bob', preferredWorkload: 16, completedCourseIds: [], degree: 'CS', degreeCourseIds: [], plannedCourses: {}, createdAt: new Date().toISOString() },
    { id: 'u3', name: 'Charlie', preferredWorkload: 15, completedCourseIds: [], degree: 'CS', degreeCourseIds: [], plannedCourses: {}, createdAt: new Date().toISOString() }
  ])
  await db.writeRequests([])
  await db.writeFriendships([])
}

describe('Friendship lifecycle', () => {
  it('should search users only when query is provided', async () => {
    await setupUsers()
    const results = await userService.searchUsers('ali')
    assert.strictEqual(results.length, 1)
    assert.strictEqual(results[0].id, 'u1')
    assert.deepStrictEqual(await userService.searchUsers(''), [])
  })

  it('should not allow friending yourself', async () => {
    await setupUsers()
    await assert.rejects(() => friendService.sendFriendRequest('u1', 'u1'), {
      message: 'cannot_friend_self'
    })
  })

  it('should create a pending outgoing request and allow recipient to accept', async () => {
    await setupUsers()
    const request = await friendService.sendFriendRequest('u1', 'u2')
    assert.strictEqual(request.senderId, 'u1')
    assert.strictEqual(request.recipientId, 'u2')
    assert.strictEqual(request.status, 'pending')

    const requesterData = await friendService.getFriendDataFor('u1')
    assert.strictEqual(requesterData.outgoing.length, 1)
    const recipientData = await friendService.getFriendDataFor('u2')
    assert.strictEqual(recipientData.incoming.length, 1)

    await assert.rejects(() => friendService.acceptFriendRequest(request.id, 'u1'), {
      message: 'not_authorised'
    })

    await friendService.acceptFriendRequest(request.id, 'u2')
    const acceptedData = await friendService.getFriendDataFor('u1')
    assert.strictEqual(acceptedData.friends.length, 1)
    assert.strictEqual(acceptedData.friendIds[0], 'u2')
  })

  it('should reject duplicate or reverse-direction pending requests idempotently', async () => {
    await setupUsers()
    const requestA = await friendService.sendFriendRequest('u1', 'u2')
    const requestB = await friendService.sendFriendRequest('u2', 'u1')
    assert.strictEqual(requestA.id, requestB.id)
    assert.strictEqual(requestB.status, 'pending')
  })

  it('should allow canceling outgoing requests only by the sender', async () => {
    await setupUsers()
    const request = await friendService.sendFriendRequest('u1', 'u2')
    await assert.rejects(() => friendService.cancelOutgoingRequest(request.id, 'u2'), {
      message: 'not_authorised'
    })
    const canceled = await friendService.cancelOutgoingRequest(request.id, 'u1')
    assert.strictEqual(canceled.status, 'cancelled')
  })

  it('should remove an accepted friendship for both users', async () => {
    await setupUsers()
    const request = await friendService.sendFriendRequest('u1', 'u2')
    await friendService.acceptFriendRequest(request.id, 'u2')

    await friendService.removeFriend('u1', 'u2')
    const aData = await friendService.getFriendDataFor('u1')
    const bData = await friendService.getFriendDataFor('u2')
    assert.strictEqual(aData.friends.length, 0)
    assert.strictEqual(bData.friends.length, 0)
  })

  it('should persist friendship state across separate service calls', async () => {
    await setupUsers()
    const request = await friendService.sendFriendRequest('u1', 'u2')
    await friendService.acceptFriendRequest(request.id, 'u2')

    const readAgain = await friendService.getFriendDataFor('u1')
    assert.strictEqual(readAgain.friends.length, 1)
    assert.strictEqual(readAgain.friendIds[0], 'u2')
  })
})
