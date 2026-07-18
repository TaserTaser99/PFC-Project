import type { Course, User } from '../models.js'

type CourseSeed = Omit<Course, 'id'>

const courseSeeds: CourseSeed[] = [
  // ============================================================
  // COMPUTER SCIENCE
  // ============================================================

  {
    code: 'COMP1511',
    title: 'Programming Fundamentals',
    workload: 9,
    popularity: 210,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP1521',
    title: 'Computer Systems Fundamentals',
    workload: 8,
    popularity: 198,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP1531',
    title: 'Software Engineering Fundamentals',
    workload: 8,
    popularity: 185,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP2511',
    title: 'Software Design and Architecture',
    workload: 8,
    popularity: 188,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP2521',
    title: 'Data Structures and Algorithms',
    workload: 9,
    popularity: 170,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP3121',
    title: 'Algorithm Design and Analysis',
    workload: 9,
    popularity: 172,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP3821',
    title: 'Extended Algorithm Design and Analysis',
    workload: 9,
    popularity: 122,
    terms: ['3']
  },
  {
    code: 'COMP3900',
    title: 'Computer Science Project',
    workload: 8,
    popularity: 152,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMP4920',
    title: 'Professional Issues and Ethics in Information Technology',
    workload: 5,
    popularity: 120,
    terms: ['1', '3']
  },

  // ============================================================
  // MATHEMATICS
  // ============================================================

  {
    code: 'MATH1081',
    title: 'Discrete Mathematics',
    workload: 8,
    popularity: 120,
    terms: ['1', '2', '3']
  },
  {
    code: 'MATH1131',
    title: 'Mathematics 1A',
    workload: 7,
    popularity: 165,
    terms: ['1', '2', '3']
  },
  {
    code: 'MATH1141',
    title: 'Higher Mathematics 1A',
    workload: 8,
    popularity: 142,
    terms: ['1', '3']
  },
  {
    code: 'MATH1151',
    title: 'Mathematics for Actuarial Studies and Finance 1A',
    workload: 8,
    popularity: 120,
    terms: ['1']
  },
  {
    code: 'MATH1231',
    title: 'Mathematics 1B',
    workload: 7,
    popularity: 150,
    terms: ['1', '2', '3']
  },
  {
    code: 'MATH1241',
    title: 'Higher Mathematics 1B',
    workload: 8,
    popularity: 136,
    terms: ['1', '2']
  },
  {
    code: 'MATH1251',
    title: 'Mathematics for Actuarial Studies and Finance 1B',
    workload: 8,
    popularity: 112,
    terms: ['2']
  },

  // ============================================================
  // ECONOMICS
  // ============================================================

  {
    code: 'ECON1101',
    title: 'Microeconomics 1',
    workload: 6,
    popularity: 118,
    terms: ['1', '2', '3']
  },
  {
    code: 'ECON1102',
    title: 'Macroeconomics 1',
    workload: 6,
    popularity: 114,
    terms: ['1', '2']
  },
  {
    code: 'ECON1202',
    title: 'Quantitative Analysis for Business and Economics',
    workload: 7,
    popularity: 104,
    terms: ['1', '3']
  },
  {
    code: 'ECON1203',
    title: 'Business and Economic Statistics',
    workload: 7,
    popularity: 101,
    terms: ['1', '2']
  },
  {
    code: 'ECON1401',
    title: 'Economic Perspectives',
    workload: 7,
    popularity: 96,
    terms: ['1', '3']
  },
  {
    code: 'ECON2101',
    title: 'Microeconomics 2',
    workload: 7,
    popularity: 102,
    terms: ['1', '2']
  },
  {
    code: 'ECON2102',
    title: 'Macroeconomics 2',
    workload: 7,
    popularity: 103,
    terms: ['1', '3']
  },
  {
    code: 'ECON2206',
    title: 'Introductory Econometrics',
    workload: 7,
    popularity: 99,
    terms: ['1', '3']
  },

  // ============================================================
  // COMMERCE
  // ============================================================

  {
    code: 'COMM0999',
    title: 'myBCom Blueprint',
    workload: 5,
    popularity: 92,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1100',
    title: 'Business Decision Making',
    workload: 5,
    popularity: 95,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1110',
    title: 'Evidence-Based Problem Solving',
    workload: 6,
    popularity: 90,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1120',
    title: 'Collaboration and Innovation in Business',
    workload: 6,
    popularity: 88,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1140',
    title: 'Financial Management',
    workload: 6,
    popularity: 84,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1150',
    title: 'Global Business Environments',
    workload: 5,
    popularity: 86,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1170',
    title: 'Organisational Resources',
    workload: 6,
    popularity: 94,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1180',
    title: 'Value Creation',
    workload: 6,
    popularity: 93,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1190',
    title: 'Data, Insights and Decisions',
    workload: 5,
    popularity: 81,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM1240',
    title: 'Financial Management for Actuarial Studies',
    workload: 6,
    popularity: 78,
    terms: ['1']
  },
  {
    code: 'COMM1999',
    title: 'myBCom First Year Portfolio',
    workload: 5,
    popularity: 70,
    terms: ['1', '2', '3']
  },
  {
    code: 'COMM2501',
    title: 'Data Visualisation and Communication',
    workload: 6,
    popularity: 68,
    terms: ['2', '3']
  },
  {
    code: 'COMM3999',
    title: 'myBCom Graduation Portfolio',
    workload: 6,
    popularity: 66,
    terms: ['1', '2', '3']
  },

  // ============================================================
  // ACTUARIAL STUDIES
  // ============================================================

  {
    code: 'ACTL1101',
    title: 'Introduction to Actuarial Studies',
    workload: 7,
    popularity: 88,
    terms: ['2']
  },
  {
    code: 'ACTL2102',
    title: 'Foundations of Actuarial Models',
    workload: 8,
    popularity: 80,
    terms: ['2', '3']
  },
  {
    code: 'ACTL2111',
    title: 'Financial Mathematics for Actuaries',
    workload: 8,
    popularity: 82,
    terms: ['1', '2']
  },
  {
    code: 'ACTL2131',
    title: 'Probability and Mathematical Statistics',
    workload: 8,
    popularity: 79,
    terms: ['1', '3']
  },
  {
    code: 'ACTL3142',
    title: 'Statistical Machine Learning for Risk and Actuarial Applications',
    workload: 9,
    popularity: 72,
    terms: ['1', '2']
  }
]

function withIds(seeds: CourseSeed[]): Course[] {
  return seeds.map((seed, index) => ({
    id: `c${index + 1}`,
    ...seed
  }))
}

export const courses: Course[] = withIds(courseSeeds)

const courseIdByCode = new Map(
  courses.map((course) => [course.code, course.id])
)

function idsFor(codes: string[]): string[] {
  return codes
    .map((code) => courseIdByCode.get(code))
    .filter((courseId): courseId is string => Boolean(courseId))
}

export const users: User[] = [
  {
    id: 'u1',
    name: 'Alex Chen',
    friendIds: ['u2'],
    preferredWorkload: 18,
    completedCourseIds: idsFor(['COMP1511', 'MATH1081']),
    degree: 'computer-science',
    plannedCourses: {
      '1': idsFor(['COMP1521', 'MATH1131', 'MATH1231']),
      '2': idsFor(['COMP1531', 'COMP2511']),
      '3': idsFor(['COMP2521', 'COMP3900'])
    }
  },
  {
    id: 'u2',
    name: 'Maya Singh',
    friendIds: ['u1'],
    preferredWorkload: 16,
    completedCourseIds: idsFor(['COMM1100', 'COMM1170']),
    degree: 'commerce',
    plannedCourses: {
      '1': idsFor(['COMM1110', 'COMM1180', 'COMM1190']),
      '2': idsFor(['COMM1120', 'COMM1140', 'COMM1999']),
      '3': idsFor(['COMM3999'])
    }
  },
  {
    id: 'u3',
    name: 'Jordan Lee',
    friendIds: [],
    preferredWorkload: 15,
    completedCourseIds: idsFor(['ECON1101', 'ECON1102']),
    degree: 'economics',
    plannedCourses: {
      '1': idsFor(['ECON1202', 'ECON1203']),
      '2': idsFor(['ECON2101']),
      '3': idsFor(['ECON2102', 'ECON2206'])
    }
  },
  {
    id: 'u4',
    name: 'Sam Patel',
    friendIds: [],
    preferredWorkload: 20,
    completedCourseIds: idsFor(['ACTL1101', 'MATH1151']),
    degree: 'actuarial-studies',
    plannedCourses: {
      '1': idsFor(['COMM1240', 'ACTL2111', 'ACTL2131']),
      '2': idsFor(['MATH1251', 'ACTL2102', 'ACTL3142']),
      '3': idsFor(['COMM2501'])
    }
  },
  {
    id: 'u5',
    name: 'Kevin Li',
    friendIds: [],
    preferredWorkload: 17,
    completedCourseIds: idsFor(['COMP1511', 'COMP1531']),
    degree: 'computer-science',
    plannedCourses: {
      '1': idsFor(['COMP1521', 'MATH1141', 'MATH1241']),
      '2': idsFor(['COMP3121']),
      '3': idsFor(['COMP2521', 'COMP3900', 'COMP4920'])
    }
  }
]
