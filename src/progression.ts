import { programCoursesByCode } from './data/programCourses.js'
import type {
  CategoryProgress,
  CourseExclusions,
  CoursePattern,
  Program,
  ProgressionResult,
  RequirementCategory,
  SubsetRule
} from './models.js'

const DEFAULT_COURSE_UOC = 6

function courseUOC(code: string): number {
  return programCoursesByCode.get(code)?.uoc ?? DEFAULT_COURSE_UOC
}

function parseCourseCode(code: string): { prefix: string; level: number } | null {
  const match = /^([A-Z]+)(\d)\d*$/.exec(code)
  if (!match) return null
  return { prefix: match[1], level: Number(match[2]) }
}

function matchesPattern(code: string, pattern: CoursePattern): boolean {
  const parsed = parseCourseCode(code)
  if (!parsed) return false
  return pattern.prefixes.includes(parsed.prefix) && pattern.levels.includes(parsed.level)
}

function isExcluded(code: string, exclusions?: CourseExclusions): boolean {
  if (!exclusions) return false
  if (exclusions.courseCodes?.includes(code)) return true
  const parsed = parseCourseCode(code)
  return Boolean(parsed && exclusions.facultyPrefixes?.includes(parsed.prefix))
}

function matchesSubsetRule(code: string, rule: SubsetRule): boolean {
  if (rule.matching?.includes(code)) return true
  if (rule.pattern && matchesPattern(code, rule.pattern)) return true
  return false
}

/** Applies each substitution (e.g. ACTL2131 -> MATH2901 + MATH2931) to a course-code
 * pool: if every "with" course is present, the primary one is swapped back to the
 * replaced course code so category matching finds it, and any remaining "with"
 * courses are pulled out and converted into bonus UOC on the overflow category. */
function applySubstitutions(
  program: Program,
  codes: string[]
): { codes: string[]; bonusUOC: Map<string, number> } {
  let effective = [...codes]
  const bonusUOC = new Map<string, number>()

  for (const sub of program.substitutions ?? []) {
    if (!sub.with.every((code) => effective.includes(code))) continue

    effective = effective.filter((code) => !sub.with.includes(code))
    effective.push(sub.replaces)

    const [, ...overflowCodes] = sub.with
    if (sub.overflowTo && overflowCodes.length > 0) {
      const overflow = overflowCodes.reduce((sum, code) => sum + courseUOC(code), 0)
      bonusUOC.set(sub.overflowTo, (bonusUOC.get(sub.overflowTo) ?? 0) + overflow)
    }
  }

  return { codes: effective, bonusUOC }
}

/** Matches and "consumes" courses against one category's rule, so a course already
 * counted toward one category isn't also double-counted by a later one. */
function matchCategory(
  category: RequirementCategory,
  pool: string[]
): { matchedCodes: string[]; remainingPool: string[] } {
  let candidates: string[]

  switch (category.ruleType) {
    case 'explicit-pool':
      candidates = pool.filter((code) => category.coursePool?.includes(code))
      break
    case 'pattern-match':
      candidates = pool.filter((code) => category.pattern && matchesPattern(code, category.pattern))
      break
    case 'any-course-excluding':
      candidates = pool.filter((code) => !isExcluded(code, category.exclusions))
      break
    case 'any-course':
      candidates = [...pool]
      break
    case 'checklist':
      return { matchedCodes: [], remainingPool: pool }
  }

  // Consume greedily in list order until the requirement is met; any-course style
  // categories should only take what they need so later categories (e.g. General
  // Education after Free Electives) still have courses left to match against.
  const matchedCodes: string[] = []
  let uocSoFar = 0
  for (const code of candidates) {
    if (uocSoFar >= category.uocRequired) break
    matchedCodes.push(code)
    uocSoFar += courseUOC(code)
  }

  const matchedSet = new Set(matchedCodes)
  return { matchedCodes, remainingPool: pool.filter((code) => !matchedSet.has(code)) }
}

function evaluateCategory(
  category: RequirementCategory,
  completedPool: string[],
  plannedPool: string[],
  completedBonus: number,
  plannedBonus: number,
  completedSet: Set<string>
): { progress: CategoryProgress; remainingCompleted: string[]; remainingPlanned: string[] } {
  if (category.ruleType === 'checklist') {
    const checklistDone = (category.checklistItems ?? []).every((code) => completedSet.has(code))
    return {
      progress: {
        name: category.name,
        uocRequired: 0,
        uocCompleted: 0,
        uocPlanned: 0,
        satisfied: checklistDone,
        isChecklist: true,
        checklistDone
      },
      remainingCompleted: completedPool,
      remainingPlanned: plannedPool
    }
  }

  const { matchedCodes: matchedCompleted, remainingPool: remainingCompleted } = matchCategory(
    category,
    completedPool
  )
  const rawCompletedUOC =
    matchedCompleted.reduce((sum, code) => sum + courseUOC(code), 0) + completedBonus
  const uocCompleted = Math.min(rawCompletedUOC, category.uocRequired)

  const remainingNeed = category.uocRequired - uocCompleted
  const { matchedCodes: matchedPlanned, remainingPool: remainingPlanned } = matchCategory(
    { ...category, uocRequired: remainingNeed },
    plannedPool
  )
  const rawPlannedUOC = matchedPlanned.reduce((sum, code) => sum + courseUOC(code), 0) + plannedBonus
  const uocPlanned = Math.min(rawPlannedUOC, Math.max(remainingNeed, 0))

  let subsetRequirementMet: boolean | undefined
  if (category.minSubsetUOC) {
    const subsetUOC = matchedCompleted
      .filter((code) => matchesSubsetRule(code, category.minSubsetUOC!))
      .reduce((sum, code) => sum + courseUOC(code), 0)
    subsetRequirementMet = subsetUOC >= category.minSubsetUOC.uoc
  }

  return {
    progress: {
      name: category.name,
      uocRequired: category.uocRequired,
      uocCompleted,
      uocPlanned,
      satisfied: uocCompleted >= category.uocRequired && subsetRequirementMet !== false,
      isChecklist: false,
      subsetRequirementMet
    },
    remainingCompleted,
    remainingPlanned
  }
}

export function computeProgression(
  program: Program,
  completedCourseCodes: string[],
  plannedCourseCodes: string[],
  userId = ''
): ProgressionResult {
  const completedSet = new Set(completedCourseCodes)
  const completedSub = applySubstitutions(program, completedCourseCodes)
  const plannedSub = applySubstitutions(program, plannedCourseCodes)

  let remainingCompleted = completedSub.codes
  let remainingPlanned = plannedSub.codes

  const categories: CategoryProgress[] = []
  for (const category of program.categories) {
    const result = evaluateCategory(
      category,
      remainingCompleted,
      remainingPlanned,
      completedSub.bonusUOC.get(category.name) ?? 0,
      plannedSub.bonusUOC.get(category.name) ?? 0,
      completedSet
    )
    categories.push(result.progress)
    remainingCompleted = result.remainingCompleted
    remainingPlanned = result.remainingPlanned
  }

  const uocCompleted = categories.reduce((sum, category) => sum + category.uocCompleted, 0)
  const uocPlanned = categories.reduce((sum, category) => sum + category.uocPlanned, 0)

  const constraintWarnings: string[] = []
  const maxLevel1UOC = program.constraints?.maxLevel1UOC
  if (maxLevel1UOC !== undefined) {
    const level1UOC = completedCourseCodes.reduce((sum, code) => {
      const parsed = parseCourseCode(code)
      return parsed?.level === 1 ? sum + courseUOC(code) : sum
    }, 0)
    if (level1UOC > maxLevel1UOC) {
      constraintWarnings.push(
        `Completed Level 1 UOC (${level1UOC}) exceeds this program's ${maxLevel1UOC} UOC cap.`
      )
    }
  }

  return {
    userId,
    programCode: program.code,
    programTitle: program.title,
    totalUOC: program.totalUOC,
    uocCompleted,
    uocPlanned,
    uocRemaining: Math.max(program.totalUOC - uocCompleted, 0),
    categories,
    constraintWarnings
  }
}
