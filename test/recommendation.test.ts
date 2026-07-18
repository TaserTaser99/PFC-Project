import assert from 'node:assert'
import { recommendCoursesForUser, recommendSharedSchedule } from '../src/recommendation.js'
import type { User } from '../src/models.js'

describe('Recommendation service', () => {
  const users: User[] = [
    {
      id: 'u1',
      name: 'Alice',
      friendIds: ['u2'],
      preferredWorkload: 18,
      completedCourseIds: ['c2'],
      degree: 'Computer Science',
      plannedCourses: {}
    },
    {
      id: 'u2',
      name: 'Bob',
      friendIds: ['u1'],
      preferredWorkload: 16,
      completedCourseIds: ['c1'],
      degree: 'Software Engineering',
      plannedCourses: {}
    },
    {
      id: 'u3',
      name: 'Charlie',
      friendIds: [],
      preferredWorkload: 15,
      completedCourseIds: [],
      degree: 'Mathematics',
      plannedCourses: {}
    }
  ]

  it('recommends courses based on friend completed courses', () => {
    const result = recommendCoursesForUser('u1', 0, [], users, ['u2'])
    assert.strictEqual(result.userId, 'u1')
    assert.ok(result.courses.some((r) => r.course.id === 'c1'))
  })

  it('does not recommend courses already completed by the current user', () => {
    const result = recommendCoursesForUser('u1', 0, [], users, ['u2'])
    assert.ok(result.courses.every((r) => r.course.id !== 'c2'))
  })

  it('returns an empty recommendation list for unknown users', () => {
    const result = recommendCoursesForUser('unknown', 0, [], users, [])
    assert.deepStrictEqual(result.courses, [])
  })

  it('calculates shared schedule recommendations for multiple user IDs', () => {
    const result = recommendSharedSchedule(['u1', 'u2'], 0, users)
    assert.strictEqual(result.userIds[0], 'u1')
    assert.ok(result.sharedCourses.length > 0)
  })
})
