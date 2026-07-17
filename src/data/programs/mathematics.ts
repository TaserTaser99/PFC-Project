import type { Program } from '../../models.js'

// UNSW 3970 - Bachelor of Science, majoring in Mathematics (MATHM1), 144 UOC.
// A second major/minor is out of scope.
//
// Simplification: "Employability Experiences" (12 UOC) and "Science Electives"
// (18 UOC) are each a long cross-faculty explicit list in the handbook (work
// placements, research internships, "any Faculty of Science course", etc.) -
// both are modelled as unrestricted any-course categories here.
export const mathematics: Program = {
  code: 'mathematics',
  title: 'Mathematics (BSc)',
  totalUOC: 144,
  categories: [
    {
      name: 'Science Core Course',
      uocRequired: 6,
      ruleType: 'explicit-pool',
      coursePool: ['SCIF1000']
    },
    {
      name: 'Science Professional Development',
      uocRequired: 0,
      ruleType: 'checklist',
      checklistItems: ['SCIF0000', 'SCIF3010']
    },
    { name: 'Employability Experiences', uocRequired: 12, ruleType: 'any-course' },
    {
      name: 'Mathematics Major - Level 1 Core',
      uocRequired: 12,
      ruleType: 'explicit-pool',
      coursePool: ['MATH1131', 'MATH1141', 'MATH1231', 'MATH1241']
    },
    {
      name: 'Mathematics Major - Level 2 Core',
      uocRequired: 30,
      ruleType: 'explicit-pool',
      coursePool: [
        'MATH2501',
        'MATH2601',
        'MATH2801',
        'MATH2901',
        'MATH2011',
        'MATH2111',
        'MATH2521',
        'MATH2621',
        'MATH2121',
        'MATH2221'
      ]
    },
    {
      name: 'Mathematics Major - Level 3 Prescribed Elective',
      uocRequired: 6,
      ruleType: 'pattern-match',
      pattern: { prefixes: ['MATH'], levels: [3, 6] }
    },
    {
      name: 'Mathematics Major - Level 3 Non-Statistics Electives',
      uocRequired: 12,
      ruleType: 'explicit-pool',
      coursePool: [
        'MATH3000',
        'MATH3001',
        'MATH3002',
        'MATH3041',
        'MATH3051',
        'MATH3101',
        'MATH3121',
        'MATH3161',
        'MATH3171',
        'MATH3191',
        'MATH3201',
        'MATH3261',
        'MATH3311',
        'MATH3361',
        'MATH3371',
        'MATH3411',
        'MATH3431',
        'MATH3511',
        'MATH3531',
        'MATH3560',
        'MATH3570',
        'MATH3611',
        'MATH3701',
        'MATH3711',
        'MATH6781'
      ]
    },
    { name: 'Science Electives', uocRequired: 18, ruleType: 'any-course' },
    { name: 'Free Electives', uocRequired: 36, ruleType: 'any-course' },
    {
      name: 'General Education',
      uocRequired: 12,
      ruleType: 'any-course-excluding',
      exclusions: { facultyPrefixes: ['BIOP', 'COMP', 'FOOD', 'SOMS'] }
    }
  ],
  constraints: { maxLevel1UOC: 72 }
}
