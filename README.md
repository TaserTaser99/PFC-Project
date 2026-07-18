# PFC Planner

A Peter Farrell Cup prototype for social course planning. Students can search existing users, send and manage friend requests, see accepted friends, compare course plans, and view demonstration course recommendations and degree progression.

## Requirements

- Node.js 20 or newer. Node.js 22 LTS is recommended for the team.
- npm, which is included with Node.js.

## Local setup

```powershell
npm ci
npm run reset:demo
npm run dev
```

Open `http://localhost:3002`.

Sign up at `http://localhost:3002/signup.html` or log in at `http://localhost:3002/login.html`.

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

## Deploying to Vercel

The repository is preconfigured for Vercel:

- `api/index.ts` is the single serverless function. It runs `migrate()` and `seedIfEmpty()` once per cold start, then hands the request to the Express app.
- `vercel.json` rewrites `/api/*` to that function and serves the `public/` directory as static files from the CDN.
- On Vercel the JSON store is written to the OS temporary directory, because the deployment filesystem is read-only.

### Steps

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In the [Vercel dashboard](https://vercel.com/new), import the repository. The defaults work as-is: framework preset "Other", build command `npm run build`, output directory `public`. No environment variables are required.
3. Deploy. The site is served at `https://<project-name>.vercel.app`, with the API under `/api/*`.

Alternatively, from the repository root: `npx vercel` (preview) or `npx vercel --prod`.

### Adding a custom domain

1. In the Vercel project, open **Settings → Domains** and add your domain (for example `pfcplanner.com` or `app.pfcplanner.com`).
2. Follow the DNS instructions Vercel shows for your registrar:
   - Apex domain (`pfcplanner.com`): add an `A` record pointing to `76.76.21.21`.
   - Subdomain (`app.pfcplanner.com`): add a `CNAME` record pointing to `cname.vercel-dns.com`.
   - Or move the domain's nameservers to Vercel to let it manage DNS entirely.
3. Vercel verifies the records and provisions HTTPS certificates automatically (allow a few minutes for DNS propagation). Additional domains, such as `www`, can be added the same way and redirected to the primary domain.

### Important: storage is ephemeral on Vercel

Serverless functions cannot write to the deployment filesystem, so the JSON store lives in `/tmp`, which is wiped whenever a function instance recycles (roughly minutes to hours of inactivity). Each cold start begins from the seeded demonstration data, and accounts created through signup disappear when the instance recycles. This is acceptable for a pitch or demo, but real onboarding requires replacing `src/db.file.ts` with a hosted database (for example Vercel Postgres/Neon, Turso, or Supabase) behind the same `src/db.ts` facade.

## Data and authentication limitations

The current implementation is a controlled development prototype:

- Data is stored in local JSON files under `db/`.
- Login credentials are stored as salted password hashes in `db/credentials.json`.
- Friend routes use an `X-User-Id` header from the currently logged-in prototype user.
- Course information and plans are demonstration data, not an official UNSW dataset.
- The user directory exposes prototype profile fields to the local interface.

Do not use this version for unrestricted public onboarding or sensitive student information. A real pilot requires hosted persistent storage, proper authentication, authorisation, privacy controls, consent, rate limiting, monitoring, and deployment configuration.

## Tests

The tests use a separate `test-db/` directory and cover user search, the friendship lifecycle, authorisation rules, persistence across service calls, and recommendation scoring.
