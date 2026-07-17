import { randomUUID } from 'node:crypto'
import {
  readFriendships,
  readRequests,
  readUsers,
  withDbMutation,
  writeFriendships,
  writeRequests
} from '../db.js'
import type { FriendRequest, Friendship } from '../models.js'

export async function getFriendDataFor(userId: string) {
  const [users, requests, friendships] = await Promise.all([
    readUsers(),
    readRequests(),
    readFriendships()
  ])

  if (!users.some((user) => user.id === userId)) throw new Error('user_not_found')

  const friendIds = friendships
    .filter((friendship) => friendship.userA === userId || friendship.userB === userId)
    .map((friendship) => (friendship.userA === userId ? friendship.userB : friendship.userA))

  const incoming = requests.filter(
    (request) => request.recipientId === userId && request.status === 'pending'
  )
  const outgoing = requests.filter(
    (request) => request.senderId === userId && request.status === 'pending'
  )

  const publicUsers = users.map(({ id, name, preferredWorkload, completedCourseIds }) => ({
    id,
    name,
    preferredWorkload,
    completedCourseIds
  }))

  return {
    friends: publicUsers.filter((user) => friendIds.includes(user.id)),
    incoming,
    outgoing,
    users: publicUsers,
    currentUserId: userId,
    friendIds
  }
}

export async function getFriendIdsForUser(userId: string): Promise<string[]> {
  const friendships = await readFriendships()
  return friendships
    .filter((friendship) => friendship.userA === userId || friendship.userB === userId)
    .map((friendship) => (friendship.userA === userId ? friendship.userB : friendship.userA))
}

export async function sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
  if (senderId === recipientId) throw new Error('cannot_friend_self')

  return withDbMutation(async () => {
    const [users, requests, friendships] = await Promise.all([
      readUsers(),
      readRequests(),
      readFriendships()
    ])

    const senderExists = users.some((user) => user.id === senderId)
    const recipientExists = users.some((user) => user.id === recipientId)
    if (!senderExists || !recipientExists) throw new Error('user_not_found')

    const alreadyFriends = friendships.some(
      (friendship) =>
        (friendship.userA === senderId && friendship.userB === recipientId) ||
        (friendship.userA === recipientId && friendship.userB === senderId)
    )
    if (alreadyFriends) throw new Error('already_friends')

    const existingRequest = requests.find(
      (request) =>
        request.status === 'pending' &&
        ((request.senderId === senderId && request.recipientId === recipientId) ||
          (request.senderId === recipientId && request.recipientId === senderId))
    )
    if (existingRequest) return existingRequest

    const request: FriendRequest = {
      id: `r-${randomUUID()}`,
      senderId,
      recipientId,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    requests.push(request)
    await writeRequests(requests)
    return request
  })
}

export async function acceptFriendRequest(requestId: string, actingUserId: string) {
  return withDbMutation(async () => {
    const [requests, friendships] = await Promise.all([readRequests(), readFriendships()])
    const request = requests.find((item) => item.id === requestId)
    if (!request) throw new Error('request_not_found')
    if (request.recipientId !== actingUserId) throw new Error('not_authorised')
    if (request.status !== 'pending') throw new Error('invalid_state')

    const [userA, userB] = [request.senderId, request.recipientId].sort()
    let friendship = friendships.find(
      (item) => item.userA === userA && item.userB === userB
    )

    if (!friendship) {
      friendship = {
        id: `f-${randomUUID()}`,
        userA,
        userB,
        createdAt: new Date().toISOString()
      }
      friendships.push(friendship)
    }

    request.status = 'accepted'
    request.updatedAt = new Date().toISOString()

    await Promise.all([writeRequests(requests), writeFriendships(friendships)])
    return { friendship, request }
  })
}

export async function declineFriendRequest(
  requestId: string,
  actingUserId: string
): Promise<FriendRequest> {
  return withDbMutation(async () => {
    const requests = await readRequests()
    const request = requests.find((item) => item.id === requestId)
    if (!request) throw new Error('request_not_found')
    if (request.recipientId !== actingUserId) throw new Error('not_authorised')
    if (request.status !== 'pending') throw new Error('invalid_state')

    request.status = 'declined'
    request.updatedAt = new Date().toISOString()
    await writeRequests(requests)
    return request
  })
}

export async function cancelOutgoingRequest(
  requestId: string,
  actingUserId: string
): Promise<FriendRequest> {
  return withDbMutation(async () => {
    const requests = await readRequests()
    const request = requests.find((item) => item.id === requestId)
    if (!request) throw new Error('request_not_found')
    if (request.senderId !== actingUserId) throw new Error('not_authorised')
    if (request.status !== 'pending') throw new Error('invalid_state')

    request.status = 'cancelled'
    request.updatedAt = new Date().toISOString()
    await writeRequests(requests)
    return request
  })
}

export async function removeFriend(userId: string, otherId: string): Promise<Friendship> {
  return withDbMutation(async () => {
    const friendships = await readFriendships()
    const friendshipIndex = friendships.findIndex(
      (friendship) =>
        (friendship.userA === userId && friendship.userB === otherId) ||
        (friendship.userA === otherId && friendship.userB === userId)
    )
    if (friendshipIndex === -1) throw new Error('not_friends')

    const [removed] = friendships.splice(friendshipIndex, 1)
    await writeFriendships(friendships)
    return removed
  })
}
