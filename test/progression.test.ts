import assert from 'node:assert'

import { computerScience } from '../src/data/programs/computerScience.js'
import { mathematics } from '../src/data/programs/mathematics.js'
import type { Program } from '../src/models.js'
import { computeProgression } from '../src/progression.js'

describe('Course equivalence progression', () => {
  it('counts only one equivalent course toward a core requirement', () => {
    const program: Program = {
      code: 'equivalence-test',
      title: 'Equivalence Test',
      totalUOC: 12,
      categories: [
        {
          name: 'Core',
          uocRequired: 6,
          ruleType: 'explicit-pool',
          coursePool: ['MATH1131', 'MATH1141'],
          chooseOneGroups: [['MATH1131', 'MATH1141']]
        },
        { name: 'Free Electives', uocRequired: 6, ruleType: 'any-course' }
      ]
    }

    const result = computeProgression(program, ['MATH1131', 'MATH1141'], [])

    assert.strictEqual(result.categories[0].uocCompleted, 6)
    assert.strictEqual(result.categories[1].uocCompleted, 6)
  })

  it('does not count a planned equivalent after the group is completed', () => {
    const program: Program = {
      code: 'planned-equivalence-test',
      title: 'Planned Equivalence Test',
      totalUOC: 6,
      categories: [
        {
          name: 'Core',
          uocRequired: 6,
          ruleType: 'explicit-pool',
          coursePool: ['MATH1131', 'MATH1141'],
          chooseOneGroups: [['MATH1131', 'MATH1141']]
        }
      ]
    }

    const result = computeProgression(program, ['MATH1131'], ['MATH1141'])

    assert.strictEqual(result.categories[0].uocCompleted, 6)
    assert.strictEqual(result.categories[0].uocPlanned, 0)
  })

  it('treats MATH1131 and MATH1141 as one Computer Science core slot', () => {
    const otherCoreCourses = [
      'COMP1511',
      'COMP1521',
      'COMP1531',
      'COMP2511',
      'COMP2521',
      'COMP3900',
      'COMP4920',
      'MATH1081',
      'MATH1231',
      'COMP3121'
    ]

    const oneEquivalent = computeProgression(
      computerScience,
      [...otherCoreCourses, 'MATH1131'],
      []
    )
    const bothEquivalents = computeProgression(
      computerScience,
      [...otherCoreCourses, 'MATH1131', 'MATH1141'],
      []
    )

    assert.strictEqual(oneEquivalent.categories[0].uocCompleted, 66)
    assert.strictEqual(bothEquivalents.categories[0].uocCompleted, 66)
  })

  it('requires one Mathematics 1A and one Mathematics 1B course', () => {
    const sameSlot = computeProgression(
      mathematics,
      ['FREE1001', 'FREE1002', 'MATH1131', 'MATH1141'],
      []
    )
    const separateSlots = computeProgression(
      mathematics,
      ['FREE1001', 'FREE1002', 'MATH1131', 'MATH1231'],
      []
    )
    const levelOneIndex = mathematics.categories.findIndex(
      (category) => category.name === 'Mathematics Major - Level 1 Core'
    )

    assert.strictEqual(sameSlot.categories[levelOneIndex].uocCompleted, 6)
    assert.strictEqual(sameSlot.categories[levelOneIndex].satisfied, false)
    assert.strictEqual(separateSlots.categories[levelOneIndex].uocCompleted, 12)
    assert.strictEqual(separateSlots.categories[levelOneIndex].satisfied, true)
  })
})
