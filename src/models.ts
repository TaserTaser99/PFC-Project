export type Course = {
  id: string
  code: string
  title: string
  workload: number
  popularity: number
  term: string
}

export type User = {
  id: string
  name: string
  friendIds: string[]
  preferredWorkload: number
  completedCourseIds: string[]
}

export type RecommendationRequest = {
  userId: string
  threshold: number
  completedCourseIds?: string[]
}

export type SharedRecommendationRequest = {
  userIds: string[]
  threshold: number
}

export type CourseRecommendation = {
  course: Course
  score: number
  predictedWorkload: number
  friendCount: number
}

export type RecommendationResult = {
  userId: string
  courses: CourseRecommendation[]
}

export type SharedRecommendationResult = {
  userIds: string[]
  sharedCourses: CourseRecommendation[]
  recommendationNote: string
}
