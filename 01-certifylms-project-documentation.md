# CertifyLMS — Project Documentation

**Product type:** Whop App (installable by any Whop creator into their whop)
**One-line pitch:** The quiz, gradebook, and certification layer that Whop doesn't natively have — turning any course-selling whop into a real accredited learning program.

---

## 1. Problem Statement

Whop lets creators host video lessons and drip-release them over time, but independent reviews and Whop's own comparisons against Teachable/Skool confirm a real, unaddressed gap:

- No native quiz builder — creators can't test comprehension, only track "has this lesson been opened."
- No gradebook — no way to see individual student scores across a course.
- No completion certificates — no proof-of-completion artifact for students to claim or share.
- No per-student, per-quiz progress tracking — only coarse lesson-access data.
- No video retention analytics — creators can't see where students drop off inside a lesson.

Any creator running a paid course, certification program, cohort, or trading/skills education whop is currently forced to either fake this with Google Forms + a spreadsheet, or simply not offer it — which weakens perceived value, completion rates, and the ability to charge premium prices.

CertifyLMS closes that gap as a drop-in app any Whop creator can install in minutes.

---

## 2. Target Users

### Primary customer (buyer): The Whop Creator / Instructor
Runs a paid whop with courses (trading education, coaching, skills training, certification programs). Wants to increase perceived program value, justify higher price points, reduce refund requests by proving real learning outcomes, and reduce support load caused by "did I finish this?" confusion.

### End user (consumer): The Student / Member
A paying member of the creator's whop. Wants to know exactly where they stand in the course, get tested on real understanding (not just click-through), and walk away with something tangible (a certificate) to show for their time and money.

### Tertiary (future): Teaching Assistants / Moderators
Creators with larger cohorts may want to delegate grading/review of open-ended questions to TAs.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Prove real learning value inside a whop | % of enrolled students completing at least one quiz |
| Increase perceived program value / justify pricing | Creator-reported ability to raise price after adoption (qualitative + survey) |
| Reduce creator churn-related support load | Reduction in "am I done?" / "did I pass?" support tickets |
| Drive app revenue | # of whops on Pro tier, MRR |
| Retention hook for the whop itself | Correlation between certificate issuance and reduced member cancellation in following 30 days |

---

## 4. Core Features (MVP)

### 4.1 Quiz Builder (Creator-facing)
- Multiple question types: multiple choice, true/false, short text (manually graded), multi-select.
- Attach a quiz to any lesson or module.
- Configurable pass threshold (e.g. 80% to pass).
- Configurable attempt limits (unlimited, or capped at N attempts).
- Optional time limit per quiz.
- Optional randomized question order per attempt (reduces answer-sharing).
- Reusable question bank — questions can be tagged and reused across multiple quizzes/courses.

### 4.2 Gradebook (Creator-facing)
- Per-student view: every quiz attempt, score, pass/fail, timestamp, time spent.
- Per-quiz view: aggregate stats (average score, pass rate, most-missed question).
- Class-wide view: sortable/filterable roster with overall course completion %.
- CSV export of all gradebook data.
- Flag manually-graded (short-text) answers awaiting review, with a simple approve/reject/score UI.

### 4.3 Certificates (Both-facing)
- Auto-issued PDF certificate when a student completes all required quizzes/modules above the pass threshold.
- Certificate includes: student name, course name, creator/whop name, completion date, unique verification code.
- Public verification page (no login required) where anyone can enter/scan a verification code to confirm a certificate is genuine.
- Creator can customize certificate template (logo, colors, signature name/title) within brand constraints.
- Certificates remain valid/viewable even if the student later cancels their membership (they earned it — this is a trust and retention feature, not a paywall).

### 4.4 Progress Tracking & Drip Gating
- Per-student, per-lesson completion status.
- Sequential unlock logic: a lesson/module can require the previous module's quiz to be passed before unlocking (stacks on top of Whop's native drip-by-date feature rather than replacing it).
- Student-facing progress bar / "X of Y modules complete."
- Cohort support (optional): group students by enrollment date/batch so drip schedules can be relative to cohort start rather than global.

### 4.5 Creator Dashboard Overview
- At-a-glance: total enrolled students, average completion %, average quiz score, certificates issued this month, students currently stuck (failed a quiz 2+ times without passing).
- "At risk" list: students who haven't engaged with a lesson/quiz in 14+ days — a lightweight engagement signal a creator can act on (DM them, offer help).

### 4.6 Student-Facing Experience
- Clean "my progress" home screen inside the whop's Experience view.
- Take quiz → immediate scored feedback (configurable: show correct answers immediately, or only pass/fail).
- Download/share certificate (with a "share to LinkedIn"-style link for the verification page).

---

## 5. Feature Acceptance Criteria (MVP sample)

**Quiz Builder**
- Creator can create a quiz with at least 5 questions across 2+ question types in under 5 minutes.
- Creator can set pass threshold and attempt limit without needing support/documentation.
- Quiz cannot be bypassed by inspecting client-side code — scoring must be server-verified.

**Certificates**
- Certificate PDF generates within 5 seconds of the qualifying quiz being passed.
- Verification page correctly validates a real code and correctly rejects a fabricated one.

**Gradebook**
- CSV export includes every attempt, not just the latest, so creators can audit re-attempts.

---

## 6. Key User Flows

**Flow A — Creator builds a course module with a quiz**
1. Creator opens CertifyLMS from their whop's Dashboard view.
2. Creates/selects a course → adds a module → attaches an existing lesson (already hosted in Whop's native Courses app) → creates a quiz for that module.
3. Sets pass threshold, attempt limit, and whether the next module is gated on passing.
4. Publishes. Enrolled students immediately see the quiz appear on their progress screen.

**Flow B — Student takes a quiz**
1. Student opens the whop on mobile or desktop → CertifyLMS Experience view.
2. Sees current progress and next unlocked item.
3. Takes the quiz; answers are submitted and scored server-side.
4. Sees pass/fail immediately; if passed, next module unlocks; if this was the final required quiz, certificate is generated automatically.

**Flow C — Certificate issuance & verification**
1. On qualifying completion, a PDF is generated and stored, and the student is notified in-app.
2. Student downloads or shares the verification link.
3. Anyone (employer, community member) visits the public verification page and confirms authenticity by code.

**Flow D — Membership lapses**
1. Whop sends a membership-cancelled event.
2. Student loses access to take new quizzes / view locked content, per standard Whop access rules.
3. Already-earned certificates remain valid and viewable — this is intentional (protects the creator's credibility and the student's earned outcome; punishing lapsed-but-completed students by revoking proof of completion would undermine the entire value proposition).

---

## 7. Conceptual Data Entities

- **Course** — belongs to a whop/company.
- **Module** — belongs to a Course, ordered, may have an unlock rule.
- **Lesson** — reference to Whop-native lesson content (CertifyLMS doesn't re-host video; it augments existing Courses content).
- **Quiz** — belongs to a Module, has settings (pass threshold, attempt limit, time limit, randomization).
- **Question** — belongs to a Quiz or a shared Question Bank, has type, options, correct answer(s).
- **Attempt** — belongs to a Student + Quiz, has score, pass/fail, timestamp, answers given.
- **Certificate** — belongs to a Student + Course, has verification code, issue date, PDF reference.
- **StudentProgress** — belongs to a Student + Course, tracks per-module completion state.
- **Installation** — belongs to a Whop company, tracks subscription tier (Free/Pro) for the app itself.

---

## 8. Monetization Model (App's own revenue — charged to the Creator, not the student)

| Tier | Price (suggested) | Limits |
|---|---|---|
| Free | $0 | 1 course, up to 3 quizzes, no certificate customization, CertifyLMS watermark on certificates |
| Pro | $29–49/month per whop | Unlimited courses/quizzes, custom certificate branding, CSV export, cohort support, "at risk" student alerts |
| Pro+ (future) | $99/month | White-label verification page on creator's own domain, manual-grading TA seats, API access for external LMS sync |

Billing is handled through Whop's own checkout/subscription infrastructure so the creator pays the app the same way they'd pay for any other Whop app — no separate Stripe account needed.

---

## 9. Non-Functional Requirements

- **Mobile-first:** Whop is heavily used via its iOS/Android apps; every screen must work well in a narrow iframe.
- **Performance:** Quiz submission and scoring should feel instant (<1s server round trip for typical quiz sizes).
- **Security:** All scoring logic runs server-side; no correct answers are ever sent to the client before submission.
- **Data ownership/privacy:** Student names/emails used on certificates must be handled per standard data-protection practice (no sharing outside the whop context, deletable on request).
- **Reliability of access control:** Must correctly reflect Whop membership status at all times via webhooks, not just at initial install.

---

## 10. Roadmap

**MVP (Phase 1)**
Quiz builder, gradebook, certificates, progress tracking, drip gating, creator dashboard overview, Free/Pro billing.

**Phase 2**
CSV export refinements, question bank reuse across courses, cohort-based drip scheduling, manual grading workflow for short-answer questions, "at risk student" proactive alerts (email/push to creator).

**Phase 3**
Custom/white-label verification pages on the creator's own domain, lightweight anti-cheat (question randomization already in MVP; add basic tab-switch detection), API for exporting completion data to external systems (e.g. a bank's compliance LMS, a bootcamp's CRM), multi-language quiz support.

---

## 11. Known Risks & Open Questions

- **Video retention analytics** (which second of a video students drop off at) requires either building a custom video player wrapper or emitting events from Whop's native player — the latter may not be exposed by Whop's SDK. Treat true watch-time analytics as a stretch goal, not an MVP promise; MVP tracks lesson "marked complete" and quiz performance as the primary engagement proxy instead.
- **Anti-cheat:** Any determined student can still share answers outside the platform. MVP mitigations (randomized order, attempt limits, time limits) reduce casual cheating but won't stop dedicated bad actors — set creator expectations accordingly.
- **Certificate design constraints:** Whop's own design system (Frosted UI) governs in-app look, but the certificate PDF itself is a separate rendering surface with more creative freedom — decide early how much branding customization to expose in Free vs Pro to avoid over-engineering the builder.
- **Manual grading at scale:** Short-answer questions require a human to grade; for large cohorts this could bottleneck certificate issuance — Phase 2 TA seats exist specifically to address this.
