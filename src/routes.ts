import { Router } from 'express'
import { courses, users } from './data/sampleData.js'
import { recommendCoursesForUser, recommendSharedSchedule } from './recommendation.js'
import type { RecommendationRequest, SharedRecommendationRequest } from './models.js'

export const router = Router()

router.get('/courses', (_, res) => {
  res.json(courses)
})

router.get('/users', (_, res) => {
  res.json(users)
})

router.post('/recommendations', (req, res) => {
  const payload = req.body as RecommendationRequest
  const result = recommendCoursesForUser(payload.userId, payload.threshold, payload.completedCourseIds ?? [])
  res.json(result)
})

router.post('/recommendations/shared', (req, res) => {
  const payload = req.body as SharedRecommendationRequest
  const result = recommendSharedSchedule(payload.userIds, payload.threshold)
  res.json(result)
})
