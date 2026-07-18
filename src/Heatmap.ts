import type { Course } from './models.js'

export type HeatmapCourse = {
	course: Course
	friendCount: number
	importanceScore: number
	color: string
}

const HEATMAP_LIMIT = 12

function calculateImportance(course: Course): number {
	return Number((course.popularity / 100 + (10 - course.workload)).toFixed(2))
}

function colorForFriendCount(friendCount: number, totalFriendCount: number): string {
	if (totalFriendCount <= 0) {
		return 'hsl(120 75% 42%)'
	}

	const ratio = Math.max(0, Math.min(1, friendCount / totalFriendCount))
	const hue = Math.round(120 - ratio * 120)
	return `hsl(${hue} 75% 42%)`
}

export function buildHeatmapCourses(
	courses: Course[],
	friendCourseIds: string[][],
	_requestedLimit = HEATMAP_LIMIT
): HeatmapCourse[] {
	const totalFriendCount = friendCourseIds.length

	const courseRows = courses.map((course) => {
		const friendCount = friendCourseIds.reduce((count, courseIds) => {
			const friendCourses = new Set(courseIds)
			return friendCourses.has(course.id) ? count + 1 : count
		}, 0)

		return {
			course,
			friendCount,
			importanceScore: calculateImportance(course)
		}
	})

	const ranked = courseRows
		.sort((a, b) => {
			if (b.friendCount !== a.friendCount) return b.friendCount - a.friendCount
			if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore
			return a.course.code.localeCompare(b.course.code)
		})
		.slice(0, HEATMAP_LIMIT)

	return ranked.map((row) => ({
		...row,
		color: colorForFriendCount(row.friendCount, totalFriendCount)
	}))
}

export function topNCourses(courses: Course[], n: number): Course[] {
	void n
	return courses.slice(0, HEATMAP_LIMIT)
}