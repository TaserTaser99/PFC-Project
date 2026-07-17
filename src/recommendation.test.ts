import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { searchCourses } from './recommendation.js'

test('searchCourses returns matching courses from the SQLite-backed catalog', () => {
  const db = new Database(':memory:')

  db.prepare(`
    CREATE TABLE courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      workload INTEGER NOT NULL,
      popularity INTEGER NOT NULL,
      term TEXT NOT NULL
    )
  `).run()

  db.prepare(`
    INSERT INTO courses (id, code, title, workload, popularity, term)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('c1', 'MATH1081', 'Discrete Math', 8, 120, '2')

  const results = searchCourses(db, 'math')

  assert.ok(results.length > 0, 'expected at least one matching course')
  assert.ok(
    results.some((result) =>
      result.course.code.toLowerCase().includes('math') || result.course.title.toLowerCase().includes('math')
    ),
    'expected the results to include the queried course'
  )
})
