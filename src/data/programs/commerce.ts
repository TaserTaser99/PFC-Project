import type { Program, RequirementCategory } from '../../models.js'

// UNSW 3502 - Bachelor of Commerce, 144 UOC. WIL/FYS requirements and optional
// second majors/minors are out of scope (see conversation notes) - each major
// variant below is modelled as its own complete Program, the same way the
// three Engineering specialisations are, rather than a shared parent + plugin.

const commerceShell: RequirementCategory[] = [
  {
    name: 'Integrated First Year Courses',
    uocRequired: 48,
    ruleType: 'explicit-pool',
    coursePool: [
      'COMM1100',
      'COMM1110',
      'COMM1120',
      'COMM1140',
      'COMM1150',
      'COMM1170',
      'COMM1180',
      'COMM1190'
    ]
  },
  {
    name: 'myBCom',
    uocRequired: 0,
    ruleType: 'checklist',
    checklistItems: ['COMM0999', 'COMM1999', 'COMM3999']
  },
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
]

const commerceConstraints = {
  minFacultyUOC: { faculty: 'UNSW Business School', uoc: 96 },
  maxLevel1UOC: 72
}

export const commerceAccounting: Program = {
  code: 'commerce-accounting',
  title: 'Commerce (Accounting)',
  totalUOC: 144,
  categories: [
    {
      name: 'Accounting Major - Core Courses',
      uocRequired: 30,
      ruleType: 'explicit-pool',
      coursePool: ['ACCT2511', 'ACCT2522', 'ACCT2542', 'ACCT3563', 'COMM1140']
    },
    {
      name: 'Accounting Major - Prescribed Electives',
      uocRequired: 18,
      ruleType: 'explicit-pool',
      coursePool: [
        'ACCT2562',
        'ACCT3672',
        'ACCT3583',
        'ACCT3601',
        'ACCT3610',
        'ACCT3625',
        'ACCT3708',
        'ACCT3861',
        'ACCT3995',
        'ACTL2111',
        'FINS3626',
        'TABL2741'
      ],
      minSubsetUOC: { pattern: { prefixes: ['ACCT'], levels: [3] }, uoc: 12 }
    },
    ...commerceShell
  ],
  constraints: commerceConstraints
}

export const commerceFinance: Program = {
  code: 'commerce-finance',
  title: 'Commerce (Finance)',
  totalUOC: 144,
  categories: [
    {
      name: 'Finance Major - Core Courses',
      uocRequired: 30,
      ruleType: 'explicit-pool',
      coursePool: ['COMM1180', 'FINS2618', 'FINS2615', 'FINS2624', 'FINS3616']
    },
    {
      name: 'Finance Major - Prescribed Electives',
      uocRequired: 18,
      ruleType: 'explicit-pool',
      coursePool: [
        'ACCT3563',
        'FINS2622',
        'FINS2643',
        'FINS3610',
        'FINS3611',
        'FINS3612',
        'FINS3614',
        'FINS3623',
        'FINS3625',
        'FINS3626',
        'FINS3630',
        'FINS3631',
        'FINS3633',
        'FINS3635',
        'FINS3636',
        'FINS3637',
        'FINS3640',
        'FINS3641',
        'FINS3644',
        'FINS3650',
        'FINS3655',
        'FINS3666',
        'FINS3645',
        'FINS3646',
        'FINS3647',
        'FINS3648',
        'FINS3657'
      ],
      minSubsetUOC: { pattern: { prefixes: ['FINS'], levels: [3] }, uoc: 12 }
    },
    ...commerceShell
  ],
  constraints: commerceConstraints
}

export const commerceMarketing: Program = {
  code: 'commerce-marketing',
  title: 'Commerce (Marketing)',
  totalUOC: 144,
  categories: [
    {
      name: 'Marketing Major - Core Courses',
      uocRequired: 36,
      ruleType: 'explicit-pool',
      coursePool: ['COMM1100', 'MARK2012', 'MARK2051', 'MARK2052', 'MARK3082', 'MARK3092']
    },
    {
      name: 'Marketing Major - Prescribed Electives',
      uocRequired: 12,
      ruleType: 'explicit-pool',
      coursePool: [
        'MARK2053',
        'MARK2055',
        'MARK2060',
        'MARK2071',
        'MARK2085',
        'MARK3054',
        'MARK3081',
        'MARK3085',
        'MARK3091',
        'MARK3096'
      ],
      minSubsetUOC: { pattern: { prefixes: ['MARK'], levels: [3] }, uoc: 6 }
    },
    ...commerceShell
  ],
  constraints: commerceConstraints
}
