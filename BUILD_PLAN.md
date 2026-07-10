# CertifyLMS — Build Plan

**Stack:** Next.js (App Router) + Postgres (Supabase) + Frosted UI + `@whop/sdk`  
**Deploy target:** Vercel  
**Brand assets:** See `04-certifylms-branding-guide.md` and `certifylms-brand-assets.zip`

---

## M1 — Foundation

- [ ] Scaffold project from Whop Next.js template (`pnpm create next-app -e https://github.com/whopio/whop-nextjs-app-template`)
- [ ] Configure env vars (`WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`)
- [ ] Initialize SDK in `lib/whop.ts`
- [ ] Create database client in `lib/db.ts`
- [ ] Run Postgres schema migration (all tables from tech doc section 4)
- [ ] Create `/dashboard/[companyId]` placeholder page (creator route)
- [ ] Create `/experiences/[experienceId]` placeholder page (student route)
- [ ] Create `/verify/[code]` public verification page
- [ ] Wire up SDK auth + access checks on both view types
- [ ] Place branded assets into `/public/` (icons, favicon, wordmark)
- [ ] Confirm both views render correctly inside a test whop
- [ ] **Commit:** `M1 — Foundation: scaffold, auth, schema, placeholder views`

---

## M2 — Quiz Builder

- [ ] Dashboard route: course list + create/edit course
- [ ] Dashboard route: module CRUD within a course (order_index, unlock rules)
- [ ] Dashboard route: quiz CRUD within a module (title, pass threshold, attempt limit, time limit, randomization)
- [ ] Dashboard route: question builder form (multiple choice, true/false, multi-select, short text)
- [ ] Question reorder (drag or numeric index)
- [ ] Server-side validation for all CRUD operations
- [ ] Free-tier enforcement (max 1 course, max 3 quizzes on Free) at API layer
- [ ] **Commit:** `M2 — Quiz Builder: course/module/quiz/question CRUD`

---

## M3 — Student Quiz-Taking

- [ ] Experience route: progress home page showing unlocked/next module
- [ ] Experience route: quiz-taking UI (`/experiences/[experienceId]/quizzes/[quizId]/take`)
- [ ] Route handler: `POST /api/quizzes/[quizId]/submit` — server-side scoring (loads correct answers from DB, never from client)
- [ ] Pass/fail result screen with score
- [ ] Attempt limit enforcement (block submission when max_attempts reached)
- [ ] Randomize question order on each attempt (if enabled)
- [ ] **Commit:** `M3 — Student Quiz-Taking: quiz UI + server-side scoring`

---

## M4 — Gradebook

- [ ] Dashboard route: per-quiz gradebook (aggregate stats: avg score, pass rate, most-missed questions)
- [ ] Dashboard route: per-student gradebook (all attempts, scores, timestamps)
- [ ] Dashboard route: class-wide roster with course completion %
- [ ] Flag short-text answers awaiting manual review
- [ ] Manual grading UI (approve/reject/score for short-text answers)
- [ ] API endpoint: `GET /api/gradebook/export` — CSV export with every attempt
- [ ] **Commit:** `M4 — Gradebook: views, filters, CSV export, manual grading`

---

## M5 — Certificates

- [ ] PDF generation service using `@react-pdf/renderer` (base template from `certificate-template-editable.svg`)
- [ ] Blob storage upload on generation (Vercel Blob or S3)
- [ ] Unique `verification_code` generation (random, indexed, collision-checked)
- [ ] Auto-issue certificate on qualifying course completion (all quizzes passed above threshold)
- [ ] Public verification page: `/verify/[code]` — validates or rejects codes
- [ ] Student certificate view/download: `/experiences/[experienceId]/certificate/[certificateId]`
- [ ] Seal Gold branding on certificate (seal mark, wordmark, colors per brand guide)
- [ ] **Commit:** `M5 — Certificates: PDF gen, storage, verification page`

---

## M6 — Drip Gating

- [ ] Unlock rule enforcement logic (combine Whop's native drip-by-date + CertifyLMS quiz-gate)
- [ ] Student-facing progress bar: "X of Y modules complete"
- [ ] Sequential unlock: next module stays locked until previous quiz passed
- [ ] Cohort support (optional): drip schedule relative to enrollment date or batch start
- [ ] **Commit:** `M6 — Drip Gating: unlock rules + progress tracking`

---

## M7 — Webhooks & Billing

- [ ] Webhook endpoint: `POST /api/webhooks/whop` with signature verification
- [ ] Handle `membership.created` / `went_valid` → create baseline `student_progress` rows
- [ ] Handle `membership.cancelled` / `went_invalid` → revoke quiz access, keep certificates
- [ ] Pro-tier checkout flow via `whopSdk.checkoutConfigurations.create()`
- [ ] Handle `payment.succeeded` → upgrade `installations.tier`
- [ ] Handle `payment.failed` / subscription cancelled → downgrade `installations.tier` to `free`
- [ ] Enforce Pro-tier gating server-side (custom branding, CSV export, cohort scheduling)
- [ ] **Commit:** `M7 — Webhooks & Billing: membership sync + Pro checkout`

---

## M8 — Polish & Deploy

- [ ] Frosted UI pass on all screens (match Whop's native light/dark mode)
- [ ] Mobile-width QA (test inside narrow iframe — Whop's iOS/Android views)
- [ ] Create seed script `scripts/seed.ts` (sample course, module, quiz, questions)
- [ ] Push to GitHub, connect to Vercel
- [ ] Set production env vars in Vercel dashboard
- [ ] Update Whop App Dashboard: Base Domain + webhook callback URL → production
- [ ] Verify both Hosting paths work after deploy
- [ ] Verify `/verify/[code]` page is publicly accessible (not behind Whop auth)
- [ ] **Commit:** `M8 — Polish & Deploy: UI pass, QA, production deploy`
