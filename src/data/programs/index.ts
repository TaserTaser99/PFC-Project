import type { Program } from '../../models.js'
import { actuarialStudies } from './actuarialStudies.js'
import { civilEngineering } from './civilEngineering.js'
import { commerceAccounting, commerceFinance, commerceMarketing } from './commerce.js'
import { computerScience } from './computerScience.js'
import { economics } from './economics.js'
import { mathematics } from './mathematics.js'
import { mechanicalEngineering } from './mechanicalEngineering.js'
import { softwareEngineering } from './softwareEngineering.js'

export const programs: Program[] = [
  civilEngineering,
  mechanicalEngineering,
  softwareEngineering,
  commerceAccounting,
  commerceFinance,
  commerceMarketing,
  actuarialStudies,
  computerScience,
  economics,
  mathematics
]

export const programsByCode: ReadonlyMap<string, Program> = new Map(
  programs.map((program) => [program.code, program])
)

export function getProgram(code: string): Program | undefined {
  return programsByCode.get(code)
}
