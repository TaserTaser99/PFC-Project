import type { Course, User } from '../models.js'

//this is j

export const courses: Course[] = [
  {
    id: 'c1',
    code: 'MATH1081',
    title: 'Discrete Math',
    workload: 8,
    popularity: 120,
    term: '2'
  },
  {
    id: 'c2',
    code: 'NGA129',
    title: 'Eat Hendras Ass',
    workload: 7,
    popularity: 180,
    term: '1'
  }
]

export const users: User[] = [
  {
    id: 'u1',
    name: 'Kevin the goat',
    friendIds: ['u2', 'u3'],
    preferredWorkload: 18,
    completedCourseIds: ['c1']
  },
  {
    id: 'u2',
    name: 'Sum Ting Wong',
    friendIds: ['u1', 'u4'],
    preferredWorkload: 16,
    completedCourseIds: []
  },
  {
    id: 'u3',
    name: 'Bum',
    friendIds: ['u1'],
    preferredWorkload: 3,
    completedCourseIds: ['c2']
  },
  {
    id: 'u4',
    name: 'Hnedra',
    friendIds: ['u2'],
    preferredWorkload: 15,
    completedCourseIds: ['c3']
  }
]
