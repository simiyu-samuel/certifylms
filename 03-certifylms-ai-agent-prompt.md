# AI Agent Build Prompt — CertifyLMS

Paste the block below into your AI coding agent (Claude Code, Cursor, etc.) as the starting task. Keep the two referenced documents in the same project/repo so the agent can open and re-read them at any point.

---

```
You are acting as the lead full-stack engineer building "CertifyLMS," a Whop App.

Before writing any code, read these two documents in full, in this order:
1. 01-certifylms-project-documentation.md — the product spec. This defines WHAT to build:
   the problem, the users, every feature, acceptance criteria, user flows, data entities
   (conceptual), monetization model, and the MVP-vs-roadmap boundary. Treat this as the
   source of truth for product behavior and scope. Do not add features not listed here
   without flagging them to me first.
2. 02-certifylms-technical-build-guide.md — the technical spec. This defines HOW to build it:
   the Whop SDK patterns (auth via verifyUserToken + checkAccess, the two view types —
   Experience View for students and Dashboard View for creators, webhooks, checkout/billing
   for the app's own Pro tier), the concrete database schema, route structure, and the
   milestone build order (M1 through M8). Follow this architecture unless you find a
   specific reason not to — if you deviate, explain why before proceeding.

Ground rules:
- Work milestone by milestone, exactly in the order listed in section 12 of the technical
  build guide (M1 Foundation → M2 Quiz Builder → M3 Student Quiz-Taking → M4 Gradebook →
  M5 Certificates → M6 Drip Gating → M7 Webhooks & Billing → M8 Polish & Deploy). Do not
  jump ahead to a later milestone before the current one is functional and testable.
- After finishing each milestone, stop and give me a short summary of what you built, what
  you tested, and anything you're unsure about — before starting the next milestone.
- All quiz scoring and access-control decisions must happen server-side, never trust
  client-submitted data for anything security- or scoring-relevant. This is a hard
  requirement from the technical doc's Security Checklist (section 11) — treat it as
  non-negotiable, not a nice-to-have.
- Use the Whop Next.js app template and `@whop/sdk` as described in section 2 of the
  technical doc rather than building auth/access-control from scratch.
- Use Frosted UI for in-app components so the app visually matches native Whop styling,
  per section 8 of the technical doc.
- If something in my two documents is ambiguous, underspecified, or seems to conflict
  with how the Whop SDK actually works, stop and ask me rather than guessing or silently
  picking an interpretation — especially for anything touching billing, access control,
  or certificate issuance/revocation logic.
- Keep the codebase modular: dashboard (creator) routes and experience (student) routes
  should be cleanly separated, and the quiz engine / certificate generation / gradebook
  logic should each live in their own service modules so they're independently testable
  and easy for me to hand back to you for iteration later.
- When you're done with a milestone, also tell me what I need to manually configure in
  the Whop Developer Dashboard (env vars, hosting paths, webhook URLs, etc.) since some
  setup steps can't be done from code alone.

Start with M1: scaffold the project from the official Whop Next.js app template, wire up
SDK authentication for both view types, and set up the Postgres schema from section 4 of
the technical build guide. Confirm both the Dashboard view and Experience view render a
basic placeholder page correctly inside a real test whop before moving on.
```

---

### Notes on using this prompt

- If your agent supports reading files directly from the repo (most do), just drop all three markdown files into the project root — the agent will pull the referenced sections as needed rather than you having to paste doc contents into chat.
- If you're iterating over many sessions, re-paste the "ground rules" block (not the whole prompt) at the start of each new session as a reminder, since agents can drift from stated constraints over long conversations.
- If you change scope mid-build (e.g. decide to cut Cohort support from MVP), edit `01-certifylms-project-documentation.md` directly and tell the agent "the product doc has changed, re-read section X" rather than verbally describing the change — keeping the doc as the single source of truth prevents spec drift between you, the agent, and the doc.
