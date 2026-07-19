import type { Program } from '../../models.js'

// UNSW 3778 - Bachelor of Science (Computer Science), with the default COMPA1
// specialisation, 144 UOC. Optional minors (Accounting/Finance/Information
// Systems/Marketing/Mathematics/Psychology) are out of scope.
export const computerScience: Program = {
  code: 'computer-science',
  title: 'Computer Science',
  totalUOC: 144,
  categories: [
    {
      name: 'Computer Science Major - Core Courses',
      uocRequired: 66,
      ruleType: 'explicit-pool',
      coursePool: [
        'COMP1511',
        'COMP1521',
        'COMP1531',
        'COMP2511',
        'COMP2521',
        'COMP3900',
        'COMP4920',
        'MATH1081',
        'MATH1131',
        'MATH1141',
        'MATH1231',
        'MATH1241',
        'COMP3121',
        'COMP3821'
      ],
      chooseOneGroups: [
        ['MATH1131', 'MATH1141'],
        ['MATH1231', 'MATH1241'],
        ['COMP3121', 'COMP3821']
      ]
    },
    {
      name: 'Computer Science Major - Computing Electives',
      uocRequired: 30,
      ruleType: 'pattern-match',
      pattern: { prefixes: ['COMP'], levels: [3, 4, 6, 9] }
    },
    { name: 'Free Electives', uocRequired: 36, ruleType: 'any-course' },
    {
      name: 'General Education',
      uocRequired: 12,
      ruleType: 'any-course-excluding',
      exclusions: { facultyPrefixes: ['MATH', 'DATA'] }
    }
  ]
}
