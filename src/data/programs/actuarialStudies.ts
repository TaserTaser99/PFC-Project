import type { Program } from '../../models.js'

// UNSW 3586 - Bachelor of Actuarial Studies, 144 UOC.
export const actuarialStudies: Program = {
  code: 'actuarial-studies',
  title: 'Actuarial Studies',
  totalUOC: 144,
  categories: [
    {
      name: 'Level 1 Core Courses',
      uocRequired: 48,
      ruleType: 'explicit-pool',
      coursePool: [
        'ACTL1101',
        'COMM1170',
        'COMM1180',
        'COMM1240',
        'ECON1101',
        'ECON1102',
        'MATH1151',
        'MATH1251'
      ]
    },
    {
      name: 'Level 2 Core Courses',
      uocRequired: 24,
      ruleType: 'explicit-pool',
      coursePool: ['ACTL2102', 'ACTL2111', 'ACTL2131', 'COMM2501']
    },
    {
      name: 'Level 3 Core Courses',
      uocRequired: 6,
      ruleType: 'explicit-pool',
      coursePool: ['ACTL3142']
    },
    {
      name: 'Level 3 Electives',
      uocRequired: 18,
      ruleType: 'explicit-pool',
      coursePool: [
        'ACTL3141',
        'ACTL3143',
        'ACTL3151',
        'ACTL3162',
        'ACTL3182',
        'ACTL3191',
        'ACTL3192',
        'ACTL3301'
      ]
    },
    { name: 'Free Electives', uocRequired: 36, ruleType: 'any-course' },
    { name: 'General Education', uocRequired: 12, ruleType: 'any-course' }
  ],
  substitutions: [
    {
      categoryName: 'Level 2 Core Courses',
      replaces: 'ACTL2131',
      with: ['MATH2901', 'MATH2931'],
      overflowTo: 'Free Electives'
    }
  ],
  constraints: {
    minFacultyUOC: { faculty: 'UNSW Business School', uoc: 96 },
    maxLevel1UOC: 72
  }
}
