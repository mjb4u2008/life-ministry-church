# L.I.F.E. Ministry Operations Rebuild — Build Guide

**Date:** 2026-08-09  
**Status:** Approved for execution  
**Owner:** L.I.F.E. Ministry / Pastor Mike  
**Implementation branch:** `codex/ministry-operations-rebuild`

## Outcome

Rebuild the site around a simple weekly ministry loop:

1. Prepare Wednesday and Sunday independently.
2. Show the correct next gathering on every public surface.
3. Move people from first visit to thoughtful pastoral follow-up.
4. Manage real events without fabricated or hardcoded content.
5. Accept nonprofit donations through a Zeffy-hosted flow rather than custom payment code.
6. Keep the existing sermon artwork, flyer, and Daily Scripture generators behaviorally unchanged.
7. Make the primary public and admin workflows excellent on mobile Chrome.

This is a functional rebuild. A separate UI/UX polish pass follows after the workflows are proven.

## Product principles

- **One source of truth:** Wednesday, Sunday, reminders, countdowns, Meet links, and replays read from the same gathering records.
- **Pastor-simple:** the admin answers “what do I need to do next?” before exposing management tools.
- **Truth over filler:** no fabricated prayers, testimonies, sermons, events, contact details, or social links.
- **Care is private by default:** prayer contacts and pastoral notes never enter a public response.
- **Mobile is primary:** joining, giving, welcoming, and urgent admin edits must work on a phone.
- **External systems own sensitive jobs:** Zeffy owns donation processing; the church site never handles payment details.
- **Generators are frozen:** preserve exact prompt/model/request/response behavior for sermon banners, flyers, and Daily Scripture.

## Explicit scope

### In this build

- Reusable Sunday and Wednesday gathering series.
- Dated gathering occurrences with draft, published, live, completed, and cancelled states.
- Timezone-correct timestamps and selection of the next/live/replay gathering.
- Dynamic homepage and Watch experience.
- Lean admin home plus reusable gathering editor.
- Pastoral care inbox, private/public prayer moderation, care status, notes, assignment, and follow-up date.
- First-time visitor welcome form and follow-up queue.
- Real events CRUD, publication controls, and calendar download.
- Zeffy donation configuration and safe embedded/external donation experience.
- Honest empty states and removal of fabricated content.
- Fail-closed admin secret, validated write payloads, redacted delivery errors, and removal of ambient autoplay.
- Test harness, generator contract locks, desktop/mobile E2E coverage, and baseline lint cleanup.

### Deferred and documented

- Automatic Google Meet recording, Drive detection, YouTube upload, transcription, and replay publishing.
- Member accounts, directory, groups, volunteer scheduling, native mobile app, and private social feed.
- Full visual redesign and final brand polish.
- Replacing Vercel KV with a relational database. New workflow records use isolated repository boundaries so storage can be replaced later.
- SMS inbound STOP webhook and provider-signature work until the production Twilio number/webhook is confirmed. The build must still add consent/suppression fields and ensure every outbound selector honors suppression.
- Destructive removal of legacy `site-content` fields and Stripe code before the production Zeffy campaign is configured and verified.

## Protected generator boundary

The following route behavior must remain unchanged:

- `src/app/api/sermon-banner/route.ts`
- `src/app/api/flyer-image/route.ts`
- `src/app/api/flyer/route.ts`
- The generation/caching portion of `src/app/api/daily-scripture/route.ts`

Guardrails:

- Do not change model IDs, prompts, system instructions, image configuration, request keys, response keys, download naming, or refinement history behavior.
- Preserve the Sunday save → sermon banner generation call.
- The sermon-banner prompt says “Sunday Service”; do not reuse it automatically for Wednesday. Wednesday retains manual access to the unchanged flyer generator.
- Add contract tests that mock providers and assert the outbound request and response shape.

## Canonical domain model

### Gathering series

```ts
type GatheringKind = "sunday" | "wednesday" | "special";
type GatheringTheme = "sunday" | "wednesday" | "special";

interface GatheringSeries {
  id: string;
  slug: string;
  kind: GatheringKind;
  name: string;
  enabled: boolean;
  themeKey: GatheringTheme;
  schedule: {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    localTime: string;
    timezone: string;
    durationMinutes: number;
  };
  defaultMeetUrl: string;
  joinWindowMinutes: number;
  updatedAt: string;
}
```

### Gathering occurrence

```ts
type GatheringStatus =
  | "draft"
  | "published"
  | "live"
  | "completed"
  | "cancelled";

interface GatheringOccurrence {
  id: string;
  seriesId: string;
  localDate: string;
  startsAt: string;
  endsAt: string;
  status: GatheringStatus;
  title: string;
  scripture: string;
  description: string;
  meetUrlOverride?: string;
  replayUrl?: string;
  publishedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Gathering public-state rules

1. An explicitly live occurrence wins.
2. Otherwise, an occurrence inside its join/live window wins.
3. Otherwise, the earliest published future occurrence wins.
4. Otherwise, the latest completed occurrence with a replay is returned as replay content.
5. Draft, cancelled, and stale occurrences never appear as upcoming.
6. Clients count down from `startsAt`; clients never calculate recurring weekdays.
7. Public serializers expose only allowlisted content fields.

### Care record

```ts
type CareKind = "prayer" | "visitor";
type CareVisibility = "private" | "public";
type ModerationStatus = "pending" | "approved" | "rejected";
type CareStatus = "new" | "contacted" | "ongoing" | "answered" | "closed";

interface CareRecord {
  id: string;
  kind: CareKind;
  name: string;
  isAnonymous: boolean;
  message: string;
  visibility: CareVisibility;
  moderationStatus: ModerationStatus;
  careStatus: CareStatus;
  urgency: "normal" | "urgent";
  contactPermission: boolean;
  email?: string;
  phone?: string;
  preferredContact?: "email" | "phone";
  assignee?: string;
  followUpAt?: string;
  privateNotes?: string;
  source: "prayer-form" | "welcome-form" | "admin";
  createdAt: string;
  updatedAt: string;
}
```

Public care responses must never contain email, phone, contact permission, assignee, follow-up date, private notes, urgency, or internal status fields. Only approved public prayers may appear on the community wall.

### Event record

```ts
interface MinistryEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  status: "draft" | "published" | "cancelled";
  locationType: "online" | "in-person" | "hybrid";
  locationLabel?: string;
  meetUrl?: string;
  registrationUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Storage and compatibility

- Keep existing `site-content` unchanged for rollback.
- Store gatherings under a versioned `gatherings:v1` key with `schemaVersion`, `revision`, `series`, and `occurrences`.
- On first authenticated gathering save, back up legacy `site-content`, then initialize the new store.
- Legacy Sunday values normalize in memory when the gathering store does not exist.
- Wednesday begins disabled and unpublished until configured by an admin; no time is invented.
- Store care and events behind repository modules, not directly inside React or API routes.
- All repository writes throw on failure; APIs must never return success after a failed write.
- Use `crypto.randomUUID()` for new IDs.
- Mutations accept an expected revision and return `409` on stale updates where the store is versioned.

## API surface

### Gatherings

- `GET /api/gatherings` — public featured/upcoming/recent allowlisted payload.
- `GET /api/gatherings?admin=1` — authenticated full series/occurrence store.
- `PUT /api/gatherings` — authenticated validated command union:
  - `initialize`
  - `updateSeries`
  - `upsertOccurrence`
  - `setOccurrenceStatus`
  - `setReplay`

### Care

- `GET /api/care?admin=1` — authenticated care inbox.
- `POST /api/care` — public visitor/prayer submission; defaults private/pending.
- `PATCH /api/care` — authenticated allowlisted care update.
- Existing `/api/prayers` remains compatible but public GET becomes approved-public-only and POST maps into the safe defaults.

### Events

- `GET /api/events` — published future events only.
- `GET /api/events?admin=1` — authenticated full event list.
- `POST /api/events` — authenticated validated creation.
- `PATCH /api/events` — authenticated validated updates.
- `DELETE /api/events?id=...` — authenticated deletion.
- `GET /api/events/[id]/calendar` — escaped `.ics` download.

### Zeffy

- Store only a validated Zeffy HTTPS campaign/form URL in settings.
- The app never receives payment credentials, donation amounts, or payment callbacks in this release.
- If embedding is blocked, show a clear external “Donate securely with Zeffy” action.
- Do not claim a donation succeeded based on a local query parameter.

## Admin information architecture

- `/admin` — This Week dashboard, readiness, urgent care count, next event, pinned generators.
- `/admin/gatherings/[seriesId]` — reusable Sunday/Wednesday prepare-and-publish workflow.
- `/admin/care` — pastoral inbox and first-time visitor queue.
- `/admin/events` — events manager.
- `/admin/media` — recordings, messaging, flyer generator, Daily Scripture.
- `/admin/settings` — schedules, default Meet links, contact/social settings, Zeffy URL.

The implementation may retain the legacy admin at `/admin/legacy` during migration. The new dashboard must link to preserved generator flows until those panels are safely isolated.

## Public behavior

### Homepage

- Feature the correct next/live/replay gathering across Wednesday and Sunday.
- Apply gathering-specific copy/theme through `themeKey`, not duplicated pages.
- Primary action is Join, Get Reminder, or Watch Replay based on state.
- Show the other enabled upcoming gathering as a secondary card.
- Add a concise first-time welcome form.
- Remove fabricated prayers and testimonies; use honest empty states.

### Watch

- Use the same featured gathering as the homepage.
- Show only real recordings.
- Keep a clear Meet action during the join window and a replay action after completion.

### Events

- Render only real published future events plus upcoming published gathering occurrences.
- Support `.ics` calendar download.
- Remove hardcoded times, Meet links, and image placeholders.

### Community

- Public prayer submission explicitly offers private/pastor-only or request-public options.
- All submissions start pending; only approved-public entries render.
- First-time visitor records never appear publicly.

### Give

- Replace local amount/frequency/Stripe checkout UI with Zeffy panel when configured.
- Preserve a non-payment configuration state for admins rather than a fake/demo checkout.
- Keep legacy Stripe files until verified Zeffy launch, but remove public access to the custom checkout.

## Mobile acceptance criteria

- Verify widths 320, 360, 390, 430, 768, and desktop.
- No horizontal page scrolling.
- Minimum 44px primary touch targets.
- Next gathering and primary action are discoverable without menu hunting.
- Countdown cannot overflow at 320px.
- Forms remain visible above the mobile keyboard and use at least 16px input text.
- Join actions support opening Meet and copying the link; no automatic audio.
- Admin can update title, scripture, description, Meet link, status, and publish from mobile.
- Respect `prefers-reduced-motion`.

## Security, privacy, and trust guardrails

- Production admin auth fails closed when `ADMIN_PASSWORD` is missing.
- Reject future-dated or expired malformed admin tokens.
- API write bodies use explicit schemas/allowlists.
- Meet URLs and external URLs require HTTPS and approved host/scheme rules.
- Public care serializers are allowlists, not object spreads.
- Email/SMS errors redact contact values.
- Subscriber records gain consent timestamp/source/version and suppression state.
- Every manual and scheduled delivery filters suppressed contacts.
- Add a privacy page covering prayer visibility, contact follow-up, recording, and donations.
- Remove ambient autoplay.
- Add narrow security headers; Zeffy frame permissions are explicit rather than arbitrary.

## Verification harness

Add:

- Vitest and Testing Library.
- Playwright with desktop Chromium and mobile Chrome projects.
- `typecheck`, `test`, `test:coverage`, and `test:e2e` scripts.

Raw gates must run sequentially where `.next` is involved:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome
npm run build
npm audit --omit=dev
```

Do not run `typecheck` concurrently with `build`. Do not run `npm audit fix --force`.

## Delivery ledger

Each item is one reviewable commit. An item may be marked complete only after its exact evidence commands pass. Otherwise mark `[NEEDS-VERIFICATION]`.

### PR-01 — Guide, branch, and baseline

- [x] Save this guide.
- [x] Create `codex/ministry-operations-rebuild` from current `main`.
- [x] Record baseline lint/typecheck/build output.
- [x] Add no product behavior.

**Definition of Done**

```bash
git status --short --branch
npm run lint        # expected baseline failure documented
npx tsc --noEmit    # pass
npm run build       # pass
```

### PR-02 — Test harness and frozen-generator contracts

- [x] Add Vitest, Testing Library, Playwright, and scripts.
- [x] Add contract tests for sermon banner, flyer image, flyer, and Daily Scripture provider requests.
- [x] Fix the four baseline lint errors and relevant warnings without changing generator behavior.
- [x] Add desktop and mobile Playwright configuration.

Evidence (2026-08-09): `npm run lint`, `npm run typecheck`, `npm run test` (4/4),
`npm run build`, `npm run test:e2e -- --list`, and `git diff --check` all passed.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### PR-03 — Gathering domain and compatibility repository

- [x] Add shared types, runtime validation, time conversion, selectors, public serializer, repository, and legacy normalizer.
- [x] Add Sunday legacy compatibility and disabled Wednesday default.
- [x] Add version/revision conflict behavior and surfaced KV errors.
- [x] Add public/admin gathering API.
- [x] Unit-test Monday→Wednesday, Thursday→Sunday, live priority, replay fallback, stale/draft filtering, DST, and independent edits.

Evidence (2026-08-09): `npm run lint`, `npm run typecheck`, `npm run test`
(16/16), `npm run build`, and `git diff --check` all passed. The legacy
`site-content` and protected generator route files were unchanged.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test -- gatherings
npm run build
```

### PR-04 — Dynamic public gathering experience

- [x] Replace homepage hardcoded countdown and Sunday copy.
- [x] Add gathering hero, countdown, action, and secondary gathering components.
- [x] Move Watch to the same selector/payload.
- [x] Remove fabricated sermons, prayers, and testimonies.
- [x] Ensure honest loading, empty, error, upcoming, live, and replay states.
- [x] Remove automatic ambient playback.

Evidence (2026-08-09): `npm run lint`, `npm run typecheck`, `npm run test`
(22/22), desktop gathering E2E (3/3), mobile gathering E2E (3/3),
`npm run build`, and `git diff --check` all passed. A stale local Next dev
process initially blocked the isolated Playwright server; after terminating only
that repo process, both clean reruns passed on port 3107.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e -- --project=chromium --grep gathering
npm run test:e2e -- --project=mobile-chrome --grep gathering
npm run build
```

### PR-05 — Lean admin and reusable gathering workflow

- [x] Add new admin shell and This Week dashboard.
- [x] Add independent Sunday and Wednesday readiness cards.
- [x] Add reusable gathering editor with preview, publish, status, replay, and error/conflict states.
- [x] Preserve existing generator/scripture access and contracts.
- [x] Preserve Sunday-save auto-banner behavior.
- [x] Keep legacy admin available during migration if any management panel is not yet extracted.

Evidence (2026-08-09): `npm run lint`, `npm run typecheck`, `npm run test`
(34/34), desktop admin E2E (3/3), mobile admin E2E (3/3), `npm run build`,
`git diff --check`, and the protected-route diff check all passed. The editor
uses atomic repository revisions, configured-timezone previews, explicit
cancellation, and 401/403 sign-in recovery. A fresh independent review found
no remaining P1/P2 issues after regression fixes.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e -- --project=chromium --grep admin-gathering
npm run test:e2e -- --project=mobile-chrome --grep admin-gathering
npm run build
```

### PR-06 — Pastoral care and first-time welcome

- [x] Add care repository, validation, API, and public serializer.
- [x] Make prayers private/pending by default.
- [x] Add explicit public-sharing choice.
- [x] Add first-time welcome form.
- [x] Add care inbox with moderation, status, urgency, assignment, follow-up, and private notes.
- [x] Add privacy copy and prove private fields never reach public responses.

Evidence (2026-08-09): `npm run lint`, `npm run typecheck`, `npm run test`
(49/49), desktop care E2E (4/4), mobile care E2E (4/4), `npm run build`,
`git diff --check`, and the protected-route diff check all passed. The care
repository uses atomic revisions, fail-loud writes, UUIDs, privacy-first legacy
migration with backup, strict public/admin schemas, allowlisted serialization,
durable endpoint quotas, and fail-closed production auth. A fresh independent
review found no remaining P1/P2 issues after assignment and legacy-tab fixes.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test -- care
npm run test:e2e -- --project=chromium --grep care
npm run test:e2e -- --project=mobile-chrome --grep care
npm run build
```

### PR-07 — Real events center

- [ ] Add event repository, schemas, admin/public APIs, and calendar export.
- [ ] Add admin event CRUD.
- [ ] Replace fabricated public event listings.
- [ ] Render published future events and relevant gathering occurrences.
- [ ] Validate/escape dates, text, and external links.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test -- events
npm run test:e2e -- --project=chromium --grep events
npm run test:e2e -- --project=mobile-chrome --grep events
npm run build
```

### PR-08 — Zeffy giving

- [ ] Add validated Zeffy URL setting.
- [ ] Add safe donation panel with embedded and external fallback behavior.
- [ ] Remove the public custom Stripe checkout flow and demo language.
- [ ] Ensure no payment details enter local APIs/storage/logs.
- [ ] Add privacy and receipt expectation copy without making unverified tax claims.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test -- zeffy
npm run test:e2e -- --project=chromium --grep giving
npm run test:e2e -- --project=mobile-chrome --grep giving
npm run build
```

### PR-09 — Messaging trust and platform hardening

- [ ] Add consent/source/version and suppression fields to subscriber records.
- [ ] Add email unsubscribe flow.
- [ ] Ensure scheduled/manual sends exclude suppressed contacts.
- [ ] Redact PII from errors and logs.
- [ ] Fail closed on missing production admin secret and tighten token validation.
- [ ] Add validated content update allowlist and security headers.
- [ ] Document Twilio STOP webhook as blocked until provider configuration is supplied.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test -- messaging auth
npm run build
```

### PR-10 — Mobile and end-to-end convergence

- [ ] Test public and admin flows at required widths.
- [ ] Fix overflow, focus, keyboard, reduced-motion, and touch-target failures.
- [ ] Run two independent high-risk reviews for auth, care privacy, public endpoints, and giving.
- [ ] Fix all P1/P2 findings, then re-review the changed diff.
- [ ] Run full raw verification and capture screenshots/evidence.

**Definition of Done**

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome
npm run build
npm audit --omit=dev
```

## Release checklist

- [ ] Production Zeffy URL supplied and verified on mobile and desktop.
- [ ] Wednesday official name, time, timezone, and Meet URL configured.
- [ ] Sunday schedule and Meet URL match production.
- [ ] Admin password exists in production; no fallback is accepted.
- [ ] Prayer privacy and welcome consent copy approved by ministry owner.
- [ ] Real events and recordings replace all placeholders.
- [ ] Email unsubscribe is verified against production delivery configuration.
- [ ] Twilio STOP webhook remains explicitly deferred or is configured and verified.
- [ ] No production deployment occurs without owner approval.

## Recording automation follow-up

Future phase:

1. Confirm a Google Workspace edition that supports automatic recording.
2. Enable recording only for the sermon portion and publish a recording notice.
3. Watch the organizer's Drive recording folder through Google APIs.
4. Match recordings to Calendar/gathering occurrence IDs.
5. Upload privately to YouTube, then require pastor approval.
6. Publish replay URL/transcript/summary to the occurrence.

This phase must not record or publish private prayer, counselling, or participant discussion by default.
