import type { Program } from '../../models.js'

// UNSW 3707 (Engineering (Honours)) with the Civil Engineering stream (CVENAH),
// 192 UOC total. Modelled as its own complete Program rather than a shared
// Engineering shell + pluggable major (see conversation notes).
//
// Simplification: the handbook's "Discipline Electives" (min 12 UOC) and
// "Practice Electives" (6-18 UOC) are combined into a single 24 UOC elective
// category here, since both draw from adjacent course lists and the fine
// split isn't needed for progression tracking.
export const civilEngineering: Program = {
  code: 'civil-engineering',
  title: 'Civil Engineering (BE Hons)',
  totalUOC: 192,
  categories: [
    {
      name: 'Level 1 Core Courses',
      uocRequired: 42,
      ruleType: 'explicit-pool',
      coursePool: [
        'DESN1000',
        'ENGG1300',
        'ENGG1811',
        'MATS1101',
        'MATH1131',
        'MATH1141',
        'MATH1231',
        'MATH1241',
        'PHYS1121',
        'PHYS1131'
      ],
      chooseOneGroups: [
        ['MATH1131', 'MATH1141'],
        ['MATH1231', 'MATH1241'],
        ['PHYS1121', 'PHYS1131']
      ]
    },
    {
      name: 'Level 2 Core Courses',
      uocRequired: 42,
      ruleType: 'explicit-pool',
      coursePool: [
        'CVEN2002',
        'CVEN2101',
        'CVEN2303',
        'DESN2000',
        'ENGG2400',
        'ENGG2500',
        'MATH2018',
        'MATH2019'
      ]
    },
    {
      name: 'Level 3 Core Courses',
      uocRequired: 48,
      ruleType: 'explicit-pool',
      coursePool: [
        'CVEN3101',
        'CVEN3202',
        'CVEN3203',
        'CVEN3303',
        'CVEN3304',
        'CVEN3401',
        'CVEN3501',
        'CVEN3502'
      ]
    },
    {
      name: 'Discipline & Practice Electives',
      uocRequired: 24,
      ruleType: 'explicit-pool',
      coursePool: [
        'CVEN4102',
        'CVEN4103',
        'CVEN4104',
        'CVEN4106',
        'CVEN3701',
        'CVEN4701',
        'CVEN4705',
        'CVEN4706',
        'CVEN9881',
        'GSOE9740',
        'CVEN4201',
        'CVEN4202',
        'CVEN4204',
        'ENGG3001',
        'ENGG4102',
        'ENGG4103',
        'CVEN4300',
        'CVEN4301',
        'CVEN4308',
        'CVEN4309',
        'CVEN9806',
        'CVEN9809',
        'CVEN9818',
        'CVEN9820',
        'CVEN9822',
        'CVEN9824',
        'CVEN9826',
        'CVEN9840',
        'CVEN4800',
        'GMAT1110',
        'GMAT3220',
        'GMAT9600',
        'GMAT9606',
        'CVEN4402',
        'CVEN4404',
        'CVEN4405',
        'CVEN9405',
        'CVEN9415',
        'ENGG1400',
        'CVEN4503',
        'CVEN4504',
        'CVEN4507',
        'CVEN4703',
        'CVEN9612',
        'CVEN9620',
        'CVEN9640',
        'CODE2170',
        'ENGG3741',
        'ENGG4060',
        'ENGG2600',
        'ENGG3600',
        'ENGG4600'
      ]
    },
    {
      name: 'Thesis',
      uocRequired: 12,
      ruleType: 'explicit-pool',
      coursePool: [
        'CVEN4050',
        'CVEN4051',
        'CVEN4951',
        'CVEN4952',
        'CVEN4953',
        'CVEN4961',
        'CVEN4962',
        'CVEN4963'
      ]
    },
    { name: 'Free Electives', uocRequired: 12, ruleType: 'any-course' },
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
