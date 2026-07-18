import assert from 'node:assert'
import { buildHeatmapCourses, topNCourses } from '../src/Heatmap.js'
import type { Course } from '../src/models.js'

const sampleCourses: Course[] = [
  {
    id: 'c1',
    code: 'COMP1001',
    title: 'Intro One',
    workload: 9,
    popularity: 90,
    terms: ['1']
  },
  {
    id: 'c2',
    code: 'COMP2001',
    title: 'Intro Two',
    workload: 5,
    popularity: 350,
    terms: ['1']
  },
  {
    id: 'c3',
    code: 'COMP3001',
    title: 'Intro Three',
    workload: 6,
    popularity: 300,
    terms: ['1']
  }
]

describe('Heatmap logic', () => {
  it('ranks by friend count first, then recommendation importance', () => {
    const friendCourseIds = [['c1', 'c2'], ['c1'], ['c3']]
    const rows = buildHeatmapCourses(sampleCourses, friendCourseIds, 12)

    assert.strictEqual(rows[0].course.id, 'c1')
    assert.strictEqual(rows[0].friendCount, 2)
    assert.strictEqual(rows[1].course.id, 'c2')
    assert.strictEqual(rows[2].course.id, 'c3')
  })

  it('always returns up to 12 courses', () => {
    const courses: Course[] = Array.from({ length: 20 }, (_, index) => ({
      id: `c${index + 1}`,
      code: `COMP${1000 + index}`,
      title: `Course ${index + 1}`,
      workload: 5,
      popularity: 100,
      terms: ['1']
    }))

    const friendCourseIds = [['c1'], ['c2'], ['c3']]
    assert.strictEqual(buildHeatmapCourses(courses, friendCourseIds, 16).length, 12)
    assert.strictEqual(buildHeatmapCourses(courses, friendCourseIds, 99).length, 12)
    assert.strictEqual(topNCourses(courses, 16).length, 12)
  })

  it('maps high friend counts toward red and zero counts toward green', () => {
    const friendCourseIds = [['c1'], ['c1']]
    const rows = buildHeatmapCourses(sampleCourses, friendCourseIds, 12)

    const hottest = rows.find((row) => row.course.id === 'c1')
    const coldest = rows.find((row) => row.course.id !== 'c1' && row.friendCount === 0)

    assert.strictEqual(hottest?.color, 'hsl(0 75% 42%)')
    assert.strictEqual(coldest?.color, 'hsl(120 75% 42%)')
  })

  it('is not red unless all friends are taking the course', () => {
    const friendCourseIds = [['c1'], ['c1'], ['c2'], []]
    const rows = buildHeatmapCourses(sampleCourses, friendCourseIds, 12)

    const partial = rows.find((row) => row.course.id === 'c1')
    assert.notStrictEqual(partial?.color, 'hsl(0 75% 42%)')
  })
})
