# CertifyLMS — Branding Guide

This document defines CertifyLMS's visual identity: the concept behind it, the exact colors and type, how the logo works, and how to use the asset pack that ships alongside this doc. Treat it as the single source of truth for anything visual — reference it the same way you reference the project documentation for product behavior.

---

## 1. The Idea: "The Seal"

CertifyLMS's entire value proposition is **proof** — a student didn't just click through a video, they *earned* something verifiable. So the brand is built around one signature image: **a seal** — the mark you'd stamp on a diploma, a coin, an official document — reinterpreted as a clean, modern mark rather than ornate clip-art.

The seal mark is a fine reeded (coin-edge) ring with a bold, slightly rotated checkmark at its center — as if it had been physically stamped down, not perfectly straight. That small imperfection is intentional: it's what makes it read as *earned* rather than generated.

This one mark does triple duty across the product:
1. **The app icon** — gold seal on deep ink.
2. **The actual certificate stamp** — literally appears on every certificate CertifyLMS issues, rotated slightly, like a real ink stamp.
3. **An in-product "locked/unlocked" state indicator** — shown in outline/greyed-out form for an incomplete module, and "stamped in" gold the moment a student passes — turning course progress itself into a small visual echo of the certificate they're working toward.

Because gold is reserved for this one meaning across the whole product (see Color Usage Rules below), whenever a user sees gold, they should immediately associate it with "certified / achieved" — never with a generic button or decoration.

---

## 2. Color Palette

| Name | Hex | Role |
|---|---|---|
| **Ink** | `#14152B` | Primary dark background (deep indigo-black, not pure black — a "ledger at night" tone) |
| **Ink 60** | `#4A4B63` | Secondary text / captions on light surfaces |
| **Ink 30** | `#C7C8D6` | Hairlines, dividers, disabled states on light surfaces |
| **Chalk** | `#F3F4F8` | Primary light background (cool off-white — deliberately *not* warm cream, to avoid the generic "AI-generated warm palette" look) |
| **Seal Gold** | `#C79A3B` | Signature accent — certification, achievement, the seal mark itself |
| **Gold Dim** | `#8A6B28` | Depth/shadow variant of Seal Gold, eyebrow text on light backgrounds |
| **Verified Green** | `#2F9E68` | Functional "pass / complete" state (gradebook, progress indicators) |
| **Brick** | `#B5533F` | Functional "fail / at-risk" state (gradebook, alerts) |

### Usage rules
- **Gold is ceremonial, not decorational.** It appears on the seal mark, certificate accents, and "certified" badges — never on a generic primary button, nav item, or anything unrelated to achievement. If gold starts showing up everywhere, it stops meaning anything.
- **Green and Brick are purely functional.** They communicate pass/fail and healthy/at-risk states in the gradebook and dashboard — they carry no ceremonial weight, unlike gold.
- **Ink and Chalk are structural**, and should map directly to the product's existing dark/light mode (Whop's Frosted UI already toggles both automatically) — don't invent a third "brand-only" background.

---

## 3. Typography

| Role | Typeface | Used for |
|---|---|---|
| **Display** | **Fraunces** (variable, weights 400–700) | Certificate headline, student name, course titles, the "Certify" half of the wordmark |
| **Body / UI** | **Inter** (variable, weights 400–700, incl. italic) | All in-product UI text, dashboard, gradebook, certificate supporting copy |
| **Utility / data** | **IBM Plex Mono** (Regular/Medium/Bold) | Verification codes, scores, dates, timestamps, anything that needs unambiguous character shapes |

**Why this pairing:** Fraunces has enough contrast and character at large sizes to feel like a genuine credential document rather than a generic web app — but it's used sparingly (headlines only). Inter is the same neutral, highly-legible register the actual Whop UI already uses, so CertifyLMS's screens feel native rather than bolted-on. IBM Plex Mono exists specifically because verification codes need to be typo-proof — a monospaced, unambiguous typeface prevents someone misreading a `0` as an `O` or a `1` as an `l` when manually entering a code on the public verification page.

All three are free, open-source (SIL Open Font License) and available via Google Fonts / `next/font` — no licensing cost when you wire them into the actual Next.js build.

---

## 4. Logo Construction

- **Seal mark** — usable on its own as the app icon, favicon, and in-product stamp. Never stretch it non-uniformly; always scale proportionally.
- **Wordmark lockup** — seal mark + "Certify." in Fraunces SemiBold + "LEARNING MANAGEMENT" in Inter SemiBold, letter-spaced, in a muted secondary tone underneath. The size/weight contrast between the two lines is deliberate: "Certify" is the serious, ceremonial part; "Learning Management" is the plain-spoken functional description underneath it — the typography itself encodes the brand's core idea (credential + infrastructure).
- **Clear space:** keep at least half the seal mark's diameter as empty margin around the full lockup on all sides.
- **Minimum size:** the full wordmark lockup shouldn't be used below ~120px wide — below that, use the seal mark alone (that's what the favicon is for).
- **Do not:** recolor the seal mark to anything outside the palette above, add a drop shadow or bevel to it, remove the rotation from the stamped certificate version, or place gold-on-gold / ink-on-ink (contrast must always be maintained).

---

## 5. Voice & Tone

- **Plain verbs, no filler.** A button says "Issue certificate," not "Generate your credential now."
- **State outcomes, not mechanics.** A student sees "You passed — next module unlocked," never "Quiz attempt recorded, threshold evaluation successful."
- **Errors explain, they don't apologize.** "This verification code doesn't match any certificate" — not "Oops, something went wrong!"
- **Certificates speak formally; the app speaks plainly.** The one place the brand allows a more formal, ceremonial register is the certificate document itself ("This certifies that…") — everywhere else (dashboard, buttons, emails), keep it conversational and direct.

---

## 6. Asset Pack Contents

The accompanying `certifylms-brand-assets.zip` contains:

```
icons/
  app-icon-dark-1024.png       — primary app icon (Whop App Store listing)
  app-icon-dark-512.png
  app-icon-dark-256.png
  app-icon-dark-128.png
  app-icon-light-1024.png      — alt icon for contexts requiring a light tile
  app-icon-light-512.png
  favicon-512.png / -64 / -32 / -16.png
  favicon.ico                  — multi-resolution favicon for web use

logo/
  wordmark-for-dark-backgrounds.png   — full lockup, transparent bg, chalk text
  wordmark-for-light-backgrounds.png  — full lockup, transparent bg, ink text
  seal-mark-icon-dark.svg / -light.svg — editable source
  wordmark-dark-bg.svg / wordmark-light-bg.svg — editable source
  favicon-mark.svg             — editable source

images/
  app-store-banner.png / @2x.png      — 1600×900 Whop App Store cover image
  certificate-template.png / @2x.png — sample rendered certificate
  certificate-template-editable.svg  — editable source (swap the placeholder
                                        name/course/date/code for real data
                                        binding once M5 — Certificates — is built)
```

All PNGs are exported at standard + @2x resolution for retina displays. All SVGs are hand-authored and fully editable — open them in any vector editor, or hand them to the coding agent to adapt into live React components (the certificate SVG in particular can become the actual PDF-generation template referenced in the technical build guide, section 5.4).

---

## 7. Where Each Asset Gets Used

| Asset | Where it goes |
|---|---|
| `app-icon-dark-*.png` | Whop App Store listing icon |
| `favicon.ico` / `favicon-*.png` | Browser tab icon if CertifyLMS ever has a marketing site outside the Whop iframe |
| `wordmark-for-*-backgrounds.png` | Dashboard header, marketing site, onboarding emails |
| `app-store-banner.png` | Whop App Store listing cover/hero image |
| `certificate-template*` | The actual product feature — this is the visual base for the real certificate PDF generation described in the technical build guide |

---

## 8. Extending the Brand (guidance for future assets)

If you or an agent need to design something not covered here (a new dashboard illustration, an empty-state graphic, a marketing landing page), stay inside these rules rather than improvising a new direction:
- Backgrounds are always Ink or Chalk — never introduce a third background color.
- The only two "meaningful" accents are Gold (ceremony/achievement) and Green/Brick (functional pass/fail) — resist adding a fourth accent color for a one-off need; reuse or omit instead.
- Any new illustration should stay in the same restrained, geometric register as the seal mark — no gradients-as-decoration, no stock-illustration people, no generic flat-icon-pack style.
