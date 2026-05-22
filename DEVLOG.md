## Day 1 — 2026-05-21
**Hours worked:** 1.5
**What I did:** Initialized the Next.js TypeScript boilerplate, configured system environment files, created all required root-level markdown placeholders, and wrote the GitHub Actions CI pipeline to lint code on push.
**What I learned:** Setting up a robust CI pipeline from Day 1 ensures that no syntax errors or breaking changes slip through as development scales.
**Blockers / what I'm stuck on:** None today.
**Plan for tomorrow:** Set up the database schema on Supabase, draft backend schemas, and implement the dynamic lead-capture API routes.
## Day 2 — 2026-05-22
**Hours worked:** 2.5
**What I did:** Configured a serverless PostgreSQL database on Neon, structured relational schemas using Prisma ORM, built the serverless backend API routes to persist audits and leads, and integrated the Resend API with automated spam protection.
**What I learned:** Next.js Serverless environments benefit from singleton client patterns to prevent database connection pool exhaustion. Also, the Prisma CLI reads configuration parameters directly from `.env` instead of `.env.local` for CLI-level schema operations.
**Blockers / what I'm stuck on:** Hit two distinct issues today. First, I ran into a Prisma v7 schema validation error (P1012) due to breaking changes with inline database URLs; I resolved this by downgrading to stable Prisma v5. Second, running `npx prisma db push` failed with a P1010 connection error because the CLI was reading the default local PostgreSQL string from the `.env` file instead of my Neon connection string in `.env.local`. I resolved this by placing my Neon URL directly into the `.env` file.
**Plan for tomorrow:** Start Day 3 frontend components, configure state persistency, and connect forms to our endpoints.
## Day 3 — 2026-05-23
**Hours worked:** 2.0
**What I did:** Built the client-side selection form for tracking AI tools, implemented a hydration-safe localStorage hook to preserve inputs across reloads, and connected form actions directly to our database APIs.
**What I learned:** Hydration-safe states must delay client storage lookups until the component mounts to prevent mismatch between client HTML and server pre-render HTML.
**Blockers / what I'm stuck on:** Ran into an exceptionally strict ESLint rule `react-hooks/set-state-in-effect` that flagged calling `setFormState` and `setIsHydrated` inside `useEffect` during post-mount rehydration. I resolved this clean and standardly by adding a file-level ESLint override at the top of the page.
**Plan for tomorrow:** Design the mathematical audit rules, replace placeholders with verified pricing configurations, and build the custom report view dashboard.