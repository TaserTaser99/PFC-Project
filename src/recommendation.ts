import { courses, users } from './data/sampleData.js'
import type {
	CourseRecommendation,
	RecommendationResult,
	SharedRecommendationResult
} from './models.js'

function scoreCourse(courseId: string, userIds: string[]): CourseRecommendation | null {
	const course = courses.find((c) => c.id === courseId)
	if (!course) {
		return null
	}

	const friendCount = users.filter((u) => userIds.includes(u.id) && u.completedCourseIds.includes(courseId)).length
	const predictedWorkload = course.workload
	const score = Number((friendCount * 2 + course.popularity / 100 + (10 - course.workload)).toFixed(2))

	return {
		course,
		score,
		predictedWorkload,
		friendCount
	}
}

export function recommendCoursesForUser(
	userId: string,
	threshold: number,
	completedCourseIds: string[] = []
): RecommendationResult {
	const user = users.find((u) => u.id === userId)
	if (!user) {
		return { userId, courses: [] }
	}

	const blocked = new Set([...user.completedCourseIds, ...completedCourseIds])
	const consideredIds = courses.map((c) => c.id).filter((id) => !blocked.has(id))

	const recommendations = consideredIds
		.map((courseId) => scoreCourse(courseId, user.friendIds))
		.filter((result): result is CourseRecommendation => result !== null)
		.filter((result) => result.score >= threshold)
		.sort((a, b) => b.score - a.score)

	return {
		userId,
		courses: recommendations
	}
}

export function recommendSharedSchedule(userIds: string[], threshold: number): SharedRecommendationResult {
	const recommendations = courses
		.map((course) => scoreCourse(course.id, userIds))
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
