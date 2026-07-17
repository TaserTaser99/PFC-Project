import type { Program } from '../../models.js'

// UNSW 3707 (Engineering (Honours)) with the Mechanical Engineering stream (MECHAH),
// 192 UOC total.
//
// Simplification: "Recommended Discipline Electives" (min 18 UOC) and the
// broader "Discipline Electives" (12 UOC) are combined into one 30 UOC
// elective category.
export const mechanicalEngineering: Program = {
  code: 'mechanical-engineering',
  title: 'Mechanical Engineering (BE Hons)',
  totalUOC: 192,
  categories: [
    {
      name: 'Level 1 Core Courses',
      uocRequired: 48,
      ruleType: 'explicit-pool',
      coursePool: [
        'ELEC1111',
        'DESN1000',
        'ENGG1300',
        'MMAN1130',
        'MATH1131',
        'MATH1141',
        'MATH1231',
        'MATH1241',
        'PHYS1121',
        'PHYS1131',
        'COMP1511',
        'COMP1911',
        'ENGG1811'
      ]
    },
    {
      name: 'Level 2 Core Courses',
      uocRequired: 42,
      ruleType: 'explicit-pool',
      coursePool: [
        'DESN2000',
        'ENGG2400',
        'ENGG2500',
        'MATH2089',
        'MMAN2300',
        'MMAN2700',
        'MATH2018',
        'MATH2019'
      ]
    },
    {
      name: 'Level 3 Core Courses',
      uocRequired: 30,
      ruleType: 'explicit-pool',
      coursePool: ['MECH3110', 'MECH3610', 'DESN3000', 'MMAN3200', 'MMAN3400']
    },
    {
      name: 'Level 4 Core Courses',
      uocRequired: 6,
      ruleType: 'explicit-pool',
      coursePool: ['MECH4100']
    },
    {
      name: 'Discipline Electives',
      uocRequired: 30,
      ruleType: 'explicit-pool',
      coursePool: [
        'MECH4305',
        'MECH4320',
        'MECH4620',
        'MECH4880',
        'MECH4900',
        'MECH9325',
        'MECH9420',
        'MECH9650',
        'MECH9720',
        'MECH9761',
        'MMAN4200',
        'MMAN4400',
        'MMAN4410',
        'MMAN9350',
        'ENGG3741',
        'MATS1110',
        'AERO9500',
        'AERO9610',
        'AERO9660',
        'COMP3331',
        'ELEC4633',
        'ENGG2600',
        'ENGG3001',
        'ENGG3060',
        'ENGG3600',
        'ENGG4600',
        'ENGG4841',
        'MANF4100',
        'MANF4430',
        'MANF4611',
        'MANF6860',
        'MANF9400',
        'MANF9420',
        'MANF9472',
        'MECH4770',
        'MMAN4250',
        'MTRN4231',
        'MTRN9400',
        'SOLA5052',
        'SOLA5053',
        'SOLA5056',
        'SOLA5057'
      ]
    },
    {
      name: 'Thesis',
      uocRequired: 12,
      ruleType: 'explicit-pool',
      coursePool: ['MMAN4951', 'MMAN4952', 'MMAN4953']
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
