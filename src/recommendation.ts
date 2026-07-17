import { courses, users as sampleUsers } from './data/sampleData.js'
import type {
  CourseRecommendation,
  RecommendationResult,
  SharedRecommendationResult,
  User
} from './models.js'

type RecommendationUser = Omit<User, 'friendIds'> & { friendIds?: string[] }

function scoreCourse(
  courseId: string,
  userIds: string[],
  users: RecommendationUser[]
): CourseRecommendation | null {
  const course = courses.find((candidate) => candidate.id === courseId)
  if (!course) return null

  const friendCount = users.filter(
    (user) => userIds.includes(user.id) && user.completedCourseIds.includes(courseId)
  ).length
  const predictedWorkload = course.workload
  const score = Number(
    (friendCount * 2 + course.popularity / 100 + (10 - course.workload)).toFixed(2)
  )

  return { course, score, predictedWorkload, friendCount }
}

export function recommendCoursesForUser(
  userId: string,
  threshold: number,
  completedCourseIds: string[] = [],
  allUsers: RecommendationUser[] = sampleUsers,
  friendIds: string[] = []
): RecommendationResult {
  const user = allUsers.find((candidate) => candidate.id === userId)
  if (!user) return { userId, courses: [] }

  const blockedCourseIds = new Set([
    ...user.completedCourseIds,
    ...completedCourseIds
  ])

  const recommendations = courses
    .filter((course) => !blockedCourseIds.has(course.id))
    .map((course) => scoreCourse(course.id, friendIds, allUsers))
    .filter((result): result is CourseRecommendation => result !== null)
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return { userId, courses: recommendations }
}

export function recommendSharedSchedule(
  userIds: string[],
  threshold: number,
  allUsers: RecommendationUser[] = sampleUsers
): SharedRecommendationResult {
  const recommendations = courses
    .map((course) => scoreCourse(course.id, userIds, allUsers))
    .filter((result): result is CourseRecommendation => result !== null)
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return {
    userIds,
    sharedCourses: recommendations,
    recommendationNote: recommendations.length
      ? 'Found shared courses that meet the threshold.'
      : 'No shared courses met the threshold.'
  }
}
