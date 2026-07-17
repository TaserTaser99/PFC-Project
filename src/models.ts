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

export type UserProfile = Omit<User, 'friendIds'> & {
  createdAt: string
  programCode?: string
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

// ---------------------------------------------------------------------------
// Degree progression
//
// This is a separate concern from the friend/recommendation system above: it
// tracks a student's progress against a real UNSW program's requirement
// structure. It intentionally does not model prerequisites, optional
// majors/minors, or level-maturity rules - see PFC-Project conversation notes.
// ---------------------------------------------------------------------------

/** A real, credit-bearing course as it appears in a program's requirement structure. */
export type ProgramCourse = {
  code: string
  title: string
  uoc: number
}

export type CourseStatus = 'completed' | 'planned'

/** One row of a user's course progress against the real program course catalog. */
export type CourseProgressRecord = {
  userId: string
  courseCode: string
  status: CourseStatus
}

/** Matches courses by subject-code prefix and level digit (e.g. COMP level 3/4/6/9), used
 * instead of enumerating every course when a category says "any level N X course". */
export type CoursePattern = {
  prefixes: string[]
  levels: number[]
}

export type CourseExclusions = {
  facultyPrefixes?: string[]
  courseCodes?: string[]
}

/** A sub-rule inside a category, e.g. "at least 18 of these 30 UOC must be Level 3". */
export type SubsetRule = {
  matching?: string[]
  pattern?: CoursePattern
  uoc: number
}

export type RequirementRuleType =
  | 'explicit-pool'
  | 'any-course'
  | 'any-course-excluding'
  | 'pattern-match'
  | 'checklist'

export type RequirementCategory = {
  name: string
  uocRequired: number
  ruleType: RequirementRuleType
  coursePool?: string[]
  pattern?: CoursePattern
  exclusions?: CourseExclusions
  minSubsetUOC?: SubsetRule
  checklistItems?: string[]
}

/** A course-for-course(s) swap allowed inside one category, e.g. Actuarial Studies'
 * ACTL2131 -> MATH2901 + MATH2931, with any extra UOC overflowing to another category. */
export type ProgramSubstitution = {
  categoryName: string
  replaces: string
  with: string[]
  overflowTo?: string
}

export type ProgramConstraints = {
  minFacultyUOC?: { faculty: string; uoc: number }
  maxLevel1UOC?: number
}

export type Program = {
  code: string
  title: string
  totalUOC: number
  categories: RequirementCategory[]
  substitutions?: ProgramSubstitution[]
  constraints?: ProgramConstraints
}

export type CategoryProgress = {
  name: string
  uocRequired: number
  uocCompleted: number
  uocPlanned: number
  satisfied: boolean
  isChecklist: boolean
  checklistDone?: boolean
  /** Present only when the category has a minSubsetUOC rule (e.g. "at least 18 of
   * these 30 UOC must be Level 3"): whether the completed courses satisfy it. */
  subsetRequirementMet?: boolean
}

export type ProgressionResult = {
  userId: string
  programCode: string
  programTitle: string
  totalUOC: number
  uocCompleted: number
  uocPlanned: number
  uocRemaining: number
  categories: CategoryProgress[]
  /** Human-readable notes about program constraints (e.g. exceeding the Level 1
   * UOC cap). Faculty-ownership constraints aren't enforced - see progression.ts. */
  constraintWarnings: string[]
}
