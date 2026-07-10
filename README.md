# CertifyLMS

**The quiz, gradebook, and certification layer for Whop.**  
Turn any course-selling whop into a real accredited learning program.

---

## Overview

Whop lets creators host and drip-release video lessons, but it has no native quiz builder, gradebook, or completion certificates. CertifyLMS fills that gap as a drop-in Whop App that any creator can install in minutes.

### Problem

- No way to test comprehension — only "has this lesson been opened"
- No gradebook for individual student scores
- No completion certificates for students
- No per-student, per-quiz progress tracking
- Creators resort to Google Forms + spreadsheets

### Solution

CertifyLMS provides a full learning management layer on top of Whop's existing courses infrastructure.

---

## Features

### Quiz Builder
- Multiple question types: multiple choice, true/false, short text, multi-select
- Attach quizzes to any lesson or module
- Configurable pass thresholds, attempt limits, and time limits
- Randomized question order per attempt
- Reusable question bank

### Gradebook
- Per-student view: every attempt, score, pass/fail, timestamp
- Per-quiz stats: average score, pass rate, most-missed questions
- Sortable class-wide roster with course completion %
- CSV export of all data
- Manual-grading UI for short-text answers

### Certificates
- Auto-issued PDF on qualifying completion
- Student name, course name, creator name, completion date, unique verification code
- Public verification page (no login required)
- Customizable template (logo, colors, signature)
- Remain valid even after membership lapses

### Progress Tracking & Drip Gating
- Per-student, per-lesson completion status
- Sequential unlock: require quiz pass to unlock next module
- Student-facing progress bar
- Cohort-based drip scheduling

### Creator Dashboard
- Enrolled count, average completion %, average quiz score
- Certificates issued this month, stuck students
- "At risk" list — no engagement in 14+ days

---

## Brand & Identity

### Concept: The Seal

The brand is built around one signature image: a fine-reeded ring with a bold, slightly rotated checkmark at its center — as if physically stamped down. That small imperfection is intentional: it reads as *earned* rather than generated. The seal appears as the app icon, on every issued certificate, and as a locked/unlocked state indicator in course progress.

### Color Palette

| Name | Hex | Role |
|------|-----|------|
| **Ink** | `#14152B` | Primary dark background |
| **Ink 60** | `#4A4B63` | Secondary text / captions |
| **Ink 30** | `#C7C8D6` | Hairlines, dividers, disabled states |
| **Chalk** | `#F3F4F8` | Primary light background |
| **Seal Gold** | `#C79A3B` | Signature accent — certification, achievement |
| **Gold Dim** | `#8A6B28` | Depth/shadow variant of Seal Gold |
| **Verified Green** | `#2F9E68` | Pass / complete state |
| **Brick** | `#B5533F` | Fail / at-risk state |

Gold is ceremonial — reserved for the seal, certificates, and achievement badges only. Never used on generic buttons or navigation.

### Typography

| Role | Typeface | Used For |
|------|----------|----------|
| **Display** | Fraunces (variable 400–700) | Certificate headlines, course titles, wordmark |
| **Body / UI** | Inter (variable 400–700) | All in-app UI text, dashboard, gradebook |
| **Utility / Data** | IBM Plex Mono | Verification codes, scores, dates, timestamps |

All three are SIL-licensed and available via `next/font` — no licensing cost.

### Voice & Tone

- Plain verbs, no filler: "Issue certificate" not "Generate your credential now"
- State outcomes, not mechanics: "You passed — next module unlocked" not "Threshold evaluation successful"
- Errors explain, don't apologize: "This verification code doesn't match any certificate" not "Oops!"
- Certificates speak formally; the app speaks plainly

### Wordmark

Seal mark + **"Certify."** in Fraunces SemiBold + **"LEARNING MANAGEMENT"** in Inter SemiBold underneath. Minimum width 120px; below that, use the seal mark alone.

---

## Brand Assets

The repo includes branded assets under `certifylms-brand-assets.zip`:

- `icons/` — App icons (dark/light), favicon (multi-resolution)
- `logo/` — Wordmark lockups (dark/light bg), seal mark SVG, favicon SVG
- `images/` — App Store banner, certificate template (PNG + editable SVG)

The editable certificate SVG is the visual base for the live PDF generation once built.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Authentication:** Whop SDK (`@whop/sdk`)
- **Database:** Postgres (recommended: Supabase)
- **Hosting:** Vercel
- **Storage:** Vercel Blob or S3-compatible
- **PDF Generation:** `@react-pdf/renderer`
- **UI:** Frosted UI (Whop's component library)

---

## Architecture

Whop apps render inside an iframe within Whop's web, iOS, and Android apps. Two view types:

| View | Path | Audience |
|------|------|----------|
| **Experience** | `/experiences/[experienceId]` | Students — quiz-taking, progress, certificates |
| **Dashboard** | `/dashboard/[companyId]` | Creators — course/quiz builder, gradebook |

CertifyLMS brings its own database for all domain data (courses, quizzes, questions, attempts, certificates, progress). Whop handles auth, access control, and membership data.

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd certifylms

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.development.local
# Add your WHOP_API_KEY and NEXT_PUBLIC_WHOP_APP_ID

# Run the dev server (with whop-proxy)
pnpm dev
```

> **Prerequisites:** A Whop Developer Account and a test whop to install the app into.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WHOP_API_KEY` | Your app's API key from the Whop Developer Dashboard |
| `NEXT_PUBLIC_WHOP_APP_ID` | Your app's ID from the Whop Developer Dashboard |
| `DATABASE_URL` | Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | (if using Vercel Blob) |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/[companyId]/   # Creator-facing routes
│   ├── experiences/[experienceId]/  # Student-facing routes
│   ├── verify/[code]/           # Public certificate verification
│   └── api/                     # Route handlers (scoring, export, webhooks)
├── lib/
│   ├── whop.ts                  # SDK initialization
│   └── db.ts                    # Database client
└── components/                  # Shared UI components
```

---

## Data Model

- **Installation** — whop-level app tier (Free/Pro)
- **Course** — belongs to a whop/company
- **Module** — belongs to a course, ordered, with unlock rules
- **Quiz** — belongs to a module, with pass threshold / attempt limits
- **Question** — belongs to a quiz or shared bank, typed with options/answers
- **Attempt** — a student's quiz submission with score and answers
- **Certificate** — issued PDF with verification code
- **StudentProgress** — per-module completion state per student

---

## Monetization

Billed through Whop's subscription infrastructure (charged to the creator):

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 course, 3 quizzes, watermark on certificates |
| Pro | $29–49/mo | Unlimited courses/quizzes, custom branding, CSV export, cohort support |
| Pro+ | $99/mo (future) | White-label verification, TA seats, API access |

---

## Webhooks

Whop sends events for membership changes and payments. CertifyLMS handles:

- `membership.created` / `went_valid` — create student progress rows
- `membership.cancelled` / `went_invalid` — revoke quiz access (keep certificates)
- `payment.succeeded` — upgrade installation tier
- `payment.failed` / cancelled — downgrade to Free tier

---

## Build Order

1. **Foundation** — Scaffold, auth, schema, placeholder views inside Whop
2. **Quiz Builder** — Dashboard CRUD for courses/modules/quizzes/questions
3. **Student Quiz-Taking** — Experience view, quiz UI, server-side scoring
4. **Gradebook** — Dashboard tables + CSV export
5. **Certificates** — PDF generation, storage, public verification
6. **Drip Gating** — Unlock-rule enforcement
7. **Webhooks & Billing** — Membership sync, Pro tier checkout
8. **Polish & Deploy** — Frosted UI pass, mobile QA, production deploy

---

## Security

- Quiz scoring is **server-side only** — correct answers never reach the client
- Every request re-verifies the user token and access
- Webhook signatures are verified before processing
- Quiz submission endpoints are rate-limited
- Free-tier limits enforced at the API layer
- Student data minimized and deletable on request

---

## License

Proprietary — see `LICENSE` for details.
