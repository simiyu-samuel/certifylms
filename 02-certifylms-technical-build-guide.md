# CertifyLMS — Technical Build Guide (Whop SDK / Next.js)

This document explains **how** to build CertifyLMS on Whop's actual platform primitives. It assumes the feature scope defined in `01-certifylms-project-documentation.md`. Anything not covered here (feature behavior, business rules, roadmap) lives in that document — this doc is implementation-only.

---

## 1. Architecture Overview

Whop apps are standard Next.js apps that render **inside an iframe** within the Whop web app, iOS app, and Android app. Whop provides:

- **Two "view" types** you configure in the App Dashboard's Hosting settings:
  - **Experience View** (`/experiences/[experienceId]`) — the consumer-facing surface shown to a *student* who has access to a whop's product. This is where CertifyLMS's quiz-taking, progress, and certificate screens live.
  - **Dashboard View** (`/dashboard/[companyId]`) — the seller/admin-facing surface shown to the *creator*. This is where the course/quiz builder and gradebook live.
- **The Whop SDK** (`@whop/sdk` for TS/JS; Python/Ruby SDKs also exist) — handles auth token verification, access checks, checkout/payments, and webhooks.
- **A dev proxy (`whop-proxy`)** that tunnels your local dev server into the Whop iframe so you can test inside the real platform while developing.
- Whop stores membership/purchase/user data. **CertifyLMS must bring its own database** for everything domain-specific: courses, quizzes, questions, attempts, certificates, progress. Whop does not store your app's custom data.

Recommended stack:
- Next.js (App Router) — official template starting point.
- Postgres (Supabase is a good managed option — pairs well with Vercel deploys) for CertifyLMS's own data.
- Vercel for hosting (first-party supported deployment target, along with Railway/Cloudflare Pages).
- Vercel Blob or S3-compatible storage for generated certificate PDFs.
- `@react-pdf/renderer` (or similar) for server-side certificate PDF generation.
- Frosted UI (Whop's component library) for UI that automatically matches Whop's native look and light/dark mode.

---

## 2. Initial Project Setup

1. **Create the app in the Whop Developer Dashboard.** This gives you an `App ID` and `API Key`. Note: the company you create the app under cannot be changed later, so create it under the account you intend to publish from.
2. **Scaffold from the official template:**
   ```bash
   pnpm create next-app@latest -e https://github.com/whopio/whop-nextjs-app-template certifylms
   cd certifylms
   ```
3. **Set environment variables** in `.env.development.local` (copied from the values shown in the App Dashboard):
   ```
   WHOP_API_KEY=
   NEXT_PUBLIC_WHOP_APP_ID=
   ```
4. **Initialize the SDK** in a shared module, e.g. `lib/whop.ts`:
   ```ts
   import Whop from "@whop/sdk";

   export const whopSdk = new Whop({
     apiKey: process.env.WHOP_API_KEY, // default, can be omitted
     appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
   });
   ```
5. **Configure Hosting paths** in the App Dashboard:
   - App View (Experience): `/experiences/[experienceId]`
   - Dashboard View: `/dashboard/[companyId]`
6. **Run the dev server via the proxy** (the template wires this up by default):
   ```bash
   pnpm dev
   ```
   This starts `whop-proxy`, which tunnels a whop's iframe request into your local server so you can preview inside a real test whop.
7. Install the app into a test whop (created under the same org) via the whop's "Tools" section, and point it at `localhost` in the app's settings icon during dev.

---

## 3. Authentication & Access Control

Every request into either view type must verify who's asking and whether they're allowed to see it.

```ts
import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop";

// 1. Identify the user making the request
const { userId } = await whopSdk.verifyUserToken(await headers());

// 2. Check whether they have access to the relevant experience
const access = await whopSdk.users.checkAccess(experienceId, { id: userId });
if (!access) {
  // deny / redirect to purchase
}
```

**Pattern for CertifyLMS specifically:**

| Route type | Who can access | Check |
|---|---|---|
| `/dashboard/[companyId]/*` | Creator/admin of that company only | Verify user token, then confirm the user is an admin of `companyId` (not just any member) |
| `/experiences/[experienceId]/*` | Any student with active access to that experience | Verify user token, then `checkAccess(experienceId, { id: userId })` |
| `/verify/[code]` (certificate verification) | Public, no auth | No Whop auth needed — this is a public trust page, deliberately outside the iframe/auth flow |

Never trust a client-submitted `userId`/`companyId` without re-verifying server-side on every request — the iframe context can be manipulated client-side, so all authorization decisions must happen in server code (Route Handlers / Server Components), never in the browser.

---

## 4. Data Model (CertifyLMS's own database)

```
installations
  id, whop_company_id (unique), tier ('free'|'pro'|'pro_plus'), created_at

courses
  id, whop_company_id, title, description, created_at

modules
  id, course_id, whop_lesson_id (reference to native Whop Courses lesson),
  order_index, unlock_rule ('previous_quiz_passed'|'date'|'always'), unlock_date (nullable)

quizzes
  id, module_id, title, pass_threshold_pct, max_attempts (nullable = unlimited),
  time_limit_seconds (nullable), randomize_order (bool)

questions
  id, quiz_id (nullable if in shared bank), course_id (for bank scoping),
  type ('multiple_choice'|'true_false'|'multi_select'|'short_text'),
  prompt, options (jsonb), correct_answer (jsonb), tags (text[])

attempts
  id, quiz_id, whop_user_id, score_pct, passed (bool),
  started_at, submitted_at, answers (jsonb)

certificates
  id, course_id, whop_user_id, verification_code (unique, indexed),
  issued_at, pdf_url, student_display_name

student_progress
  id, course_id, whop_user_id, module_id, status ('locked'|'unlocked'|'completed'),
  completed_at (nullable)
```

Notes:
- `whop_user_id` and `whop_company_id` are the join keys back into Whop's own user/company system — CertifyLMS never duplicates Whop's user profile data beyond what's needed for display (name on certificate).
- Store every `attempt`, not just the best one — the Gradebook's CSV export and audit trail depend on full history.

---

## 5. Core Feature Implementation Notes

### 5.1 Dashboard (creator) routes
- `/dashboard/[companyId]` — overview metrics (enrolled count, completion %, at-risk list).
- `/dashboard/[companyId]/courses/new` and `/courses/[courseId]/edit`
- `/dashboard/[companyId]/courses/[courseId]/quizzes/[quizId]/builder` — question CRUD, drag-reorder, settings form.
- `/dashboard/[companyId]/gradebook` — filterable table + CSV export endpoint (`/api/gradebook/export`).

### 5.2 Experience (student) routes
- `/experiences/[experienceId]` — progress home, next unlocked item.
- `/experiences/[experienceId]/quizzes/[quizId]/take` — quiz-taking UI; submits to a Route Handler, never scores client-side.
- `/experiences/[experienceId]/certificate/[certificateId]` — student's own certificate view/download.

### 5.3 Quiz scoring (server-side only)
- `POST /api/quizzes/[quizId]/submit` receives raw answers, loads `correct_answer` from the DB (never sent to the client beforehand), computes score, writes an `attempts` row, evaluates `pass_threshold_pct`, and — if passed and this satisfies the module's unlock rule — updates `student_progress` and checks whether the course is now fully complete (triggering certificate issuance).

### 5.4 Certificate generation
- On qualifying completion, generate a PDF server-side (`@react-pdf/renderer` or similar), upload to blob storage, generate a random unique `verification_code`, insert the `certificates` row.
- `/verify/[code]` is a public Next.js page (outside the Whop iframe auth flow) that looks up the code and renders a simple "Valid — issued to [name] on [date] for [course]" confirmation, or "No certificate found for this code."

### 5.5 Drip / unlock logic
- Combine two gates: Whop's own native drip-by-date (already governs when a lesson becomes visible at all) **and** CertifyLMS's `unlock_rule` (e.g., previous module's quiz must be passed). CertifyLMS should read whether the underlying Whop lesson is currently accessible before additionally enforcing its own quiz-gate — don't duplicate or fight Whop's native scheduling.

---

## 6. Webhooks

Configure a webhook endpoint (e.g. `/api/webhooks/whop`) in the App Dashboard's Webhooks section. Whop sends real-time events for things like new memberships, cancellations, and payments.

Handle at minimum:

| Event | CertifyLMS action |
|---|---|
| Membership created / went valid | Create a `student_progress` baseline row for that user across the course(s) tied to that experience |
| Membership cancelled / went invalid | Revoke ability to start new quiz attempts or view locked modules; **do not delete already-issued certificates** (see product doc, Flow D) |
| Payment succeeded (for the app's own Pro-tier subscription) | Update the relevant `installations.tier` row |
| Payment failed / subscription cancelled (app's own billing) | Downgrade `installations.tier` to `free` and re-enforce Free-tier limits (e.g. lock extra courses beyond the Free cap, don't delete data) |

Always verify the webhook's signature before trusting its payload — never process an unverified webhook body.

---

## 7. Monetizing the App Itself

Use Whop's checkout APIs to charge the **creator** (not the student) for Pro tier:

```ts
const checkout = await whopSdk.checkoutConfigurations.create({
  company_id: companyId,
  // plan/pricing configuration for the CertifyLMS Pro subscription
});
```

Gate Pro-only routes/features by checking `installations.tier` for the current `companyId` before rendering builder options like custom certificate branding, CSV export, or cohort scheduling. Enforce limits server-side (e.g., reject creating a 2nd course on Free tier at the API layer, not just hide the button in the UI).

---

## 8. UI Implementation

Use **Frosted UI** for all components so CertifyLMS visually matches the native Whop design system (including automatic light/dark mode) rather than looking like a bolted-on third-party tool. Reserve custom styling for the parts Frosted UI doesn't cover (e.g. the certificate PDF template itself, which is a separate rendering surface from the in-app UI).

---

## 9. Local Testing & Iteration Workflow

1. Run `pnpm dev` (starts `whop-proxy` automatically per the template).
2. Keep a seed script (`scripts/seed.ts`) that creates a sample course, module, quiz, and a couple of test questions — re-run after DB resets so you're not manually rebuilding test data every session.
3. Test both view types by installing the app into a scratch/test whop under your dev org and switching between the Dashboard and Experience views.
4. Use the settings icon in the top-right of the Whop iframe during dev to point the app at `localhost` for live-reload testing.

---

## 10. Deployment

1. Push to a GitHub repo, connect it to Vercel (or Railway/Cloudflare Pages).
2. Set the same environment variables (`WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`, plus your Postgres connection string and blob storage credentials) in the hosting provider's dashboard.
3. Update the app's **Base Domain** and **webhook callback URL** in the Whop App Dashboard to point at the production deployment.
4. Re-verify both Hosting paths (`/experiences/[experienceId]`, `/dashboard/[companyId]`) are still correctly set after deploying — a mismatched path is the most common reason an otherwise-working app fails to load inside Whop.

---

## 11. Security & Compliance Checklist

- [ ] Quiz correct answers never sent to the client before submission.
- [ ] All scoring happens in server-side Route Handlers, never in client components.
- [ ] Every dashboard/experience route re-verifies the user token and re-checks access on every request — no client-trusted IDs.
- [ ] Webhook signatures are verified before processing.
- [ ] Rate-limit quiz submission endpoints to prevent brute-forcing short-answer/multiple-choice questions.
- [ ] Student personal data (name used on certificates) is minimized and deletable on request.
- [ ] Free-tier limits are enforced at the API layer, not just hidden in the UI.

---

## 12. Suggested Build Order (Milestones)

1. **M1 — Foundation:** Scaffold from template, SDK auth wired up, Postgres schema migrated, both view types render a placeholder page correctly inside a test whop.
2. **M2 — Quiz Builder:** Dashboard CRUD for courses/modules/quizzes/questions.
3. **M3 — Student Quiz-Taking:** Experience view renders unlocked modules, quiz-taking UI, server-side scoring endpoint.
4. **M4 — Gradebook:** Dashboard tables + CSV export.
5. **M5 — Certificates:** PDF generation, storage, public verification page.
6. **M6 — Drip Gating:** Unlock-rule enforcement tied to quiz pass/fail.
7. **M7 — Webhooks & Billing:** Membership sync, Pro-tier checkout + tier enforcement.
8. **M8 — Polish & Deploy:** Frosted UI pass, mobile-width QA, production deploy, real webhook URLs configured.
