import { readCourseProgress, readUsers, withDbMutation, writeCourseProgress, writeUsers } from '../db.js'
import { getProgram, programs } from '../data/programs/index.js'
import { computeProgression } from '../progression.js'
import type { CourseStatus, Program, ProgressionResult } from '../models.js'

export function listPrograms(): Program[] {
  return programs
}

export function getProgramOrThrow(programCode: string): Program {
  const program = getProgram(programCode)
  if (!program) throw new Error('program_not_found')
  return program
}

export async function getUserProgression(userId: string): Promise<ProgressionResult> {
  const users = await readUsers()
  const user = users.find((candidate) => candidate.id === userId)
  if (!user) throw new Error('user_not_found')
  if (!user.programCode) throw new Error('no_program_selected')

  const program = getProgramOrThrow(user.programCode)
  const records = await readCourseProgress()
  const completed = records
    .filter((record) => record.userId === userId && record.status === 'completed')
    .map((record) => record.courseCode)
  const planned = records
    .filter((record) => record.userId === userId && record.status === 'planned')
    .map((record) => record.courseCode)

  return computeProgression(program, completed, planned, userId)
}

export async function setUserProgram(userId: string, programCode: string) {
  getProgramOrThrow(programCode)

  return withDbMutation(async () => {
    const users = await readUsers()
    const user = users.find((candidate) => candidate.id === userId)
    if (!user) throw new Error('user_not_found')

    user.programCode = programCode
    await writeUsers(users)
    return user
  })
}

export async function setCourseStatus(userId: string, courseCode: string, status: CourseStatus) {
  return withDbMutation(async () => {
    const users = await readUsers()
    if (!users.some((user) => user.id === userId)) throw new Error('user_not_found')

    const records = await readCourseProgress()
    const filtered = records.filter(
      (record) => !(record.userId === userId && record.courseCode === courseCode)
    )
    filtered.push({ userId, courseCode, status })
    await writeCourseProgress(filtered)
    return filtered.filter((record) => record.userId === userId)
  })
}

export async function removeCourseStatus(userId: string, courseCode: string) {
  return withDbMutation(async () => {
    const records = await readCourseProgress()
    const filtered = records.filter(
      (record) => !(record.userId === userId && record.courseCode === courseCode)
    )
    await writeCourseProgress(filtered)
    return filtered.filter((record) => record.userId === userId)
  })
}
