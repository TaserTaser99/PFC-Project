import { degreePlans } from './degreePlans.js'
import type {
  CourseProgressRecord,
  FriendRequest,
  Friendship,
  UserProfile
} from '../models.js'

export function createDemoData() {
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
