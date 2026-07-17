import type { Course, User } from '../models.js'

// Demonstration-only data. Replace this with official course data before launch.
export const courses: Course[] = [
  {
    id: 'c1',
    code: 'MATH1081',
    title: 'Discrete Mathematics',
    workload: 8,
    popularity: 120,
    term: '2'
  },
  {
    id: 'c2',
    code: 'COMP1511',
    title: 'Programming Fundamentals',
    workload: 9,
    popularity: 210,
    term: '1'
  },
  {
    id: 'c3',
    code: 'COMP1531',
    title: 'Software Engineering Fundamentals',
    workload: 8,
    popularity: 185,
    term: '2'
  },
  {
    id: 'c4',
    code: 'COMP2521',
    title: 'Data Structures and Algorithms',
    workload: 9,
    popularity: 170,
    term: '3'
  },
  {
    id: 'c5',
    code: 'MATH1231',
    title: 'Mathematics 1B',
    workload: 7,
    popularity: 150,
    term: '1'
  },
  {
    id: 'c6',
    code: 'COMP3311',
    title: 'Database Systems',
    workload: 7,
    popularity: 155,
    term: '3'
  }
]

export const users: User[] = [
  {
    id: 'u1',
    name: 'Alex Chen',
    friendIds: ['u2'],
    preferredWorkload: 18,
    completedCourseIds: ['c1', 'c2']
  },
  {
    id: 'u2',
    name: 'Maya Singh',
    friendIds: ['u1'],
    preferredWorkload: 16,
    completedCourseIds: ['c2', 'c5']
  },
  {
    id: 'u3',
    name: 'Jordan Lee',
    friendIds: [],
    preferredWorkload: 15,
    completedCourseIds: ['c1', 'c3']
  },
  {
    id: 'u4',
    name: 'Sam Patel',
    friendIds: [],
    preferredWorkload: 20,
    completedCourseIds: ['c4']
  }
]
