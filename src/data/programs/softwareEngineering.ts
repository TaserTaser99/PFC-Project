import type { Program } from '../../models.js'

// UNSW 3707 (Engineering (Honours)) with the Software Engineering stream (SENGAH),
// 192 UOC total.
//
// Simplification: "Discipline Electives" (36 UOC, mostly "any level 3/4/6/9
// COMP/INFS/MATH/ELEC/TELE course") is modelled as a pattern-match over COMP
// only, since that's the overwhelming majority of the real pool; a handful of
// named ENGG VIP-project electives are dropped.
export const softwareEngineering: Program = {
  code: 'software-engineering',
  title: 'Software Engineering (BE Hons)',
  totalUOC: 192,
  categories: [
    {
      name: 'Level 1 Core Courses',
      uocRequired: 42,
      ruleType: 'explicit-pool',
      coursePool: [
        'COMP1511',
        'COMP1521',
        'COMP1531',
        'DESN1000',
        'MATH1081',
        'MATH1131',
        'MATH1141',
        'MATH1231',
        'MATH1241'
      ]
    },
    {
      name: 'Level 2 Core Courses',
      uocRequired: 42,
      ruleType: 'explicit-pool',
      coursePool: [
        'COMP2041',
        'COMP2511',
        'COMP2521',
        'DESN2000',
        'MATH2400',
        'MATH2859',
        'SENG2011',
        'SENG2021'
      ]
    },
    {
      name: 'Level 3 Core Courses',
      uocRequired: 24,
      ruleType: 'explicit-pool',
      coursePool: ['COMP3142', 'COMP3311', 'COMP3331', 'SENG3011']
    },
    {
      name: 'Level 4 Core Courses',
      uocRequired: 18,
      ruleType: 'explicit-pool',
      coursePool: ['COMP4920', 'COMP4951', 'COMP4952', 'COMP4953']
    },
    {
      name: 'Discipline Electives',
      uocRequired: 36,
      ruleType: 'pattern-match',
      pattern: { prefixes: ['COMP'], levels: [3, 4, 6, 9] },
      minSubsetUOC: { pattern: { prefixes: ['COMP'], levels: [4, 6, 9] }, uoc: 30 }
    },
    { name: 'Software Major Free Elective', uocRequired: 6, ruleType: 'any-course' },
    { name: 'Engineering Free Electives', uocRequired: 12, ruleType: 'any-course' },
    {
      name: 'General Education',
      uocRequired: 12,
      ruleType: 'any-course-excluding',
      exclusions: {
        facultyPrefixes: ['ENGG', 'CVEN', 'DESN', 'MMAN', 'MECH', 'CHEM', 'MATH', 'PHYS'],
        courseCodes: ['ENGG0360', 'GENE1500', 'PHYS1160']
      }
    },
    {
      name: 'Industrial Training',
      uocRequired: 0,
      ruleType: 'checklist',
      checklistItems: ['ENGG4999']
    }
  ]
}
