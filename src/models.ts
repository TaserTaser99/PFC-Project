export type Term = '1' | '2' | '3'

export interface Course {
  id: string
  code: string
  title: string
  workload: number
  popularity: number
  terms: Term[]
}

export type PlannedCourses = Partial<Record<Term, string[]>>

export type User = {
  id: string
  name: string
  friendIds: string[]
  preferredWorkload: number
  completedCourseIds: string[]
  degree: string
  plannedCourses: PlannedCourses
}

export type UserProfile = Omit<User, 'friendIds'> & {
  degreeCourseIds: string[]
  createdAt?: string
}

export type AuthCredential = {
  id: string
  userId: string
  email: string
  passwordHash: string
  createdAt: string
}

export type FriendRequest = {
  id: string
  senderId: string
  recipientId: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  updatedAt?: string
}

export type Friendship = {
  id: string
  userA: string
  userB: string
  createdAt: string
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

export type SignupRequest = {
  name: string
  email: string
  password: string
  degree: string
}

export type LoginRequest = {
  email: string
  password: string
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
