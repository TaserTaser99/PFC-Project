import type { Program } from '../../models.js'

// UNSW 3543 - Bachelor of Economics, 144 UOC.
export const economics: Program = {
  code: 'economics',
  title: 'Economics',
  totalUOC: 144,
  categories: [
    {
      name: 'Introductory Business Core',
      uocRequired: 6,
      ruleType: 'explicit-pool',
      coursePool: ['COMM1120', 'COMM1140', 'COMM1190', 'COMM1900']
    },
    {
      name: 'Economics Core',
      uocRequired: 48,
      ruleType: 'explicit-pool',
      coursePool: [
        'ECON1101',
        'ECON1102',
        'ECON1401',
        'ECON1203',
        'ECON1202',
        'ECON2101',
        'ECON2102',
        'ECON2206'
      ]
    },
    {
      name: 'Economics Electives',
      uocRequired: 30,
      ruleType: 'pattern-match',
      pattern: { prefixes: ['ECON'], levels: [2, 3] },
      minSubsetUOC: { pattern: { prefixes: ['ECON'], levels: [3] }, uoc: 18 }
    },
    // Simplification: the handbook says "any course offered by UNSW Business School" -
    // we don't model faculty ownership per-course, so this is treated as unrestricted.
    { name: 'Business School Electives', uocRequired: 12, ruleType: 'any-course' },
    { name: 'Free Electives', uocRequired: 36, ruleType: 'any-course' },
    {
      name: 'General Education',
      uocRequired: 12,
      ruleType: 'any-course-excluding',
      exclusions: {
        facultyPrefixes: ['COMM', 'ECON', 'ACCT', 'FINS', 'MARK', 'MGMT', 'INFS', 'TABL'],
        courseCodes: ['GENL2021', 'GENL2032']
      }
    }
  ],
  constraints: {
    minFacultyUOC: { faculty: 'UNSW Business School', uoc: 96 },
    maxLevel1UOC: 72
  }
}
