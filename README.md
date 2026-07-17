# PFC Planner

A Peter Farrell Cup prototype for social course planning. Students can search existing users, send and manage friend requests, see accepted friends, compare course plans, and view demonstration course recommendations and degree progression.

## Requirements

- Node.js 20 or newer. Node.js 22 LTS is recommended for the team.
- npm, which is included with Node.js.

## Local setup

```powershell
npm ci
npm run reset:demo
$env:DEV_AUTH = "true"
npm run dev
```

Open `http://localhost:3002`.

The user dropdowns act as a development-only identity switch so the full friend-request flow can be demonstrated between the seeded users.

## Commands

```text
npm run seed      Create local demonstration data if it is missing
npm run reset:demo Reset local data to the standard pitch scenario
npm run migrate   Create any missing JSON database files
npm run dev       Start the TypeScript development server
npm run build     Compile TypeScript into dist/
npm test          Run the automated test suite
npm start         Run the compiled server
```

## Data and authentication limitations

The current implementation is a controlled development prototype:

- Data is stored in local JSON files under `db/`.
- Friend routes use an `X-User-Id` header while `DEV_AUTH=true`.
- Development authentication is disabled when `NODE_ENV=production`.
- Course information and plans are demonstration data, not an official UNSW dataset.
- The user directory exposes prototype profile fields to the local interface.

Do not use this version for unrestricted public onboarding or sensitive student information. A real pilot requires hosted persistent storage, proper authentication, authorisation, privacy controls, consent, rate limiting, monitoring, and deployment configuration.

## Tests

The tests use a separate `test-db/` directory and cover user search, the friendship lifecycle, authorisation rules, persistence across service calls, and recommendation scoring.
