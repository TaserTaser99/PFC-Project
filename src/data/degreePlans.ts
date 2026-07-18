import { courses } from './sampleData.js'

export const degreeRequirements = {
  'computer-science': {
    programCode: '3778',
    requiredCourses: [
      'COMP1511',
      'COMP1521',
      'COMP1531',
      'COMP2521',
      'MATH1081',
      'COMP2511',
      'COMP3900',
      'COMP4920'
    ],
    chooseOne: [
      ['MATH1131', 'MATH1141'],
      ['MATH1231', 'MATH1241'],
      ['COMP3121', 'COMP3821']
    ],
    additionalRequirements: [
      'Computing electives',
      'General education courses',
      'Free electives or an optional minor'
    ]
  },
  commerce: {
    programCode: '3502',
    requiredCourses: [
      'COMM0999',
      'COMM1100',
      'COMM1110',
      'COMM1120',
      'COMM1140',
      'COMM1150',
      'COMM1170',
      'COMM1180',
      'COMM1190',
      'COMM1999',
      'COMM3999'
    ],
    chooseOne: [],
    additionalRequirements: [
      'Commerce major courses',
      'Work Integrated Learning course',
      'Final Year Synthesis course',
      'Commerce electives',
      'General education courses'
    ]
  },
  economics: {
    programCode: '3543',
    requiredCourses: [
      'ECON1101',
      'ECON1102',
      'ECON1202',
      'ECON1203',
      'ECON1401',
      'ECON2101',
      'ECON2102',
      'ECON2206'
    ],
    chooseOne: [],
    additionalRequirements: [
      'One approved introductory business course',
      'Economics program courses',
      'Economics electives',
      'Disciplinary component courses',
      'General education courses'
    ]
  },
  'actuarial-studies': {
    programCode: '3586',
    requiredCourses: [
      'COMM1240',
      'ECON1101',
      'MATH1151',
      'ACTL1101',
      'ECON1102',
      'MATH1251',
      'COMM1170',
      'COMM1180',
      'ACTL2111',
      'ACTL2131',
      'ACTL2102',
      'ACTL3142',
      'COMM2501'
    ],
    chooseOne: [],
    additionalRequirements: [
      'Level 3 actuarial electives',
      'Actuarial Studies program electives',
      'General education courses'
    ]
  }
} as const

const degreeLabels: Record<keyof typeof degreeRequirements, string> = {
  'computer-science': 'Computer Science',
  commerce: 'Commerce',
  economics: 'Economics',
  'actuarial-studies': 'Actuarial Studies'
}

function uniqueCourseCodes(
  requiredCourses: readonly string[],
  chooseOne: readonly (readonly string[])[]
): string[] {
  return [...new Set([...requiredCourses, ...chooseOne.flat()])]
}

const courseIdByCode = new Map(courses.map((course) => [course.code, course.id]))

export type DegreePlan = {
  id: keyof typeof degreeRequirements
  label: string
  programCode: string
  requiredCourses: string[]
  chooseOne: string[][]
  additionalRequirements: string[]
  courseIds: string[]
}

export const degreePlans: DegreePlan[] = Object.entries(degreeRequirements).map(
  ([id, requirement]) => {
    const courseIds = uniqueCourseCodes(requirement.requiredCourses, requirement.chooseOne)
      .map((courseCode) => courseIdByCode.get(courseCode))
      .filter((courseId): courseId is string => Boolean(courseId))

    return {
      id: id as keyof typeof degreeRequirements,
      label: degreeLabels[id as keyof typeof degreeRequirements],
      programCode: requirement.programCode,
      requiredCourses: [...requirement.requiredCourses],
      chooseOne: requirement.chooseOne.map((group) => [...group]),
      additionalRequirements: [...requirement.additionalRequirements],
      courseIds
    }
  }
)
