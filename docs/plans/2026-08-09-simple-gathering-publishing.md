# Simple Gathering Publishing Build Guide

## Outcome

Pastor Mike can prepare either a Wednesday or Sunday gathering without managing
technical scheduling states. He supplies the date, start time, end time, message
title, Scripture, description, and Meet link; he may generate the existing sermon
header; then he either puts the gathering on the website or deletes it.

The website always features the earliest published gathering that has not ended.
The Meet link becomes public automatically 30 minutes before the start. When that
gathering ends, the public experience advances to the next published gathering on
its next scheduled 30-second refresh.

## Product decisions and non-goals

- Hard-set all ministry scheduling to `America/New_York`, labeled **Eastern Time**.
  This intentionally follows EST/EDT daylight-saving changes; a fixed EST offset
  would be wrong for Georgia during summer.
- Keep `joinWindowMinutes` in persisted data for backward compatibility, but the
  admin always writes `30` and never asks Pastor Mike to configure it.
- Keep the existing gathering status union for stored historical data, but remove
  draft/live/complete/cancel decisions from the primary editor.
- **Put on website** writes `published`; date ordering and time determine what the
  public site features and when the Meet link appears.
- **Delete this gathering** is a confirmed permanent delete for the selected dated
  occurrence. It does not delete the reusable Sunday or Wednesday series.
- Preserve the `/api/sermon-banner` prompt, model, request, and response contracts
  exactly. Only move the trigger into the message form and make it explicit.
- Do not alter the legacy flyer generator, Daily Scripture generator, or script.
- Do not add recording automation, Zeffy activation, broad visual polish, or a new
  content-management system in this change.

## Guardrails

- Stored Google Meet URLs must remain absent from the public API until 30 minutes
  before the gathering.
- Sunday and Wednesday must continue to use distinct `themeKey` values.
- Existing optimistic revision checks must protect updates and deletes.
- Generated banner data remains client-side and downloadable; no large base64 image
  is added to the gathering KV record.
- Controls remain usable at 320px without horizontal scrolling.
- Existing unrelated work and the untracked `.playwright-cli/` directory are not
  modified.

## Delivery ledger

### PR-01 — Ministry time and occurrence lifecycle

- [x] Add a shared `MINISTRY_TIMEZONE` (`America/New_York`),
  `MINISTRY_TIMEZONE_LABEL` (`Eastern Time`), and fixed 30-minute join-window
  constants.
- [x] Add an explicit start/end local-time helper that emits canonical UTC
  timestamps and rejects an end that is not later than the start.
- [x] Add a revision-protected `delete-occurrence` gathering command and repository
  operation; only the occurrence is removed.
- [x] Keep legacy schemas and existing stored statuses readable.

Definition of Done:

- Time helpers cover Eastern daylight and standard time.
- Delete validation rejects malformed IDs/revisions and repository conflicts.
- Public serialization still never leaks a Meet link early.

Verify:

```bash
npm run test -- src/lib/gatherings/gatherings.test.ts
npm run typecheck
```

### PR-02 — One-screen gathering editor

- [x] Replace configurable timezone, weekday, duration, enabled, series-name, and
  join-window inputs with plain-language automatic behavior.
- [x] Put Date, Start time, End time, Message title, Scripture, and Description in
  the primary `Gathering details` card.
- [x] Retain Google Meet and optional replay links in a small `Links` card.
- [x] Show a clear preview with both start and end in Eastern Time.
- [x] Replace the five status buttons with one primary **Put on website** action and
  one confirmed **Delete this gathering** action.
- [x] Automatically enable the selected Sunday/Wednesday series when publishing.
- [x] Place **Generate header** directly after Sunday message content; require a
  title, call the unchanged protected endpoint only on click, preview the result,
  and retain download. Do not offer the Sunday-labelled generator on Wednesday or
  change its protected prompt contract.
- [x] Add calm copy explaining that the website opens the Meet link 30 minutes
  before start and chooses the next date automatically.

Definition of Done:

- A first-time user can publish Wednesday or Sunday using only content, date/time,
  and link fields.
- Banner generation does not run as a side effect of publishing.
- Conflict, authentication, invalid-time, generation, and delete failures are
  recoverable and understandable.
- Mobile layout has no horizontal overflow at 320px.

Verify:

```bash
npm run test -- src/components/admin/admin-gathering.test.tsx
npm run test:e2e -- --project=chromium --grep admin-gathering
npm run test:e2e -- --project=mobile-chrome --grep admin-gathering
```

### PR-03 — Automatic public sequencing and admin clarity

- [x] Lock the public rule with tests: Wednesday features before Sunday when its
  timestamp is earlier; Sunday replaces it after Wednesday ends.
- [x] Lock the 30-minute Meet-link opening boundary with tests.
- [x] Update the admin dashboard readiness/copy so it describes `On website` versus
  `Needs details`, without exposing internal status vocabulary.
- [x] Hard-set the Events Center to Eastern Time and remove its timezone selector,
  while retaining explicit start and end controls.

Definition of Done:

- Public surfaces choose across both series by timestamp, not by weekday or edit
  order, and refresh at the existing 30-second cadence.
- Event creation never uses the browser timezone and always stores Eastern instants.
- Public Sunday/Wednesday theme behavior remains intact.

Verify:

```bash
npm run test -- src/lib/gatherings/gatherings.test.ts src/components/gatherings/gatherings.test.tsx src/components/admin/admin-gathering.test.tsx src/lib/events/events.test.ts
npm run test:e2e -- --project=chromium --grep "gathering|events"
npm run test:e2e -- --project=mobile-chrome --grep "gathering|events"
```

### PR-04 — Convergence and release proof

- [ ] Run independent product/code review against this guide.
- [ ] Fix every P1/P2 finding and re-review the refreshed diff until clean.
- [ ] Exercise Sunday and Wednesday editor flows in a real browser on desktop and
  320px mobile, including Generate header request wiring, publish, and delete.
- [ ] Exercise the homepage with Wednesday-before-Sunday data and after-Wednesday
  rollover data.
- [ ] Run all repository gates and production build.

Definition of Done:

- Independent review reports no active P1/P2 findings.
- No console-breaking errors or horizontal overflow on changed routes.
- The branch is merge-ready and the ledger contains raw verification evidence.

Verify:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
git diff --check
```

## Verification evidence

Evidence is appended here as each ledger item is completed. An item without raw
passing output remains `[NEEDS-VERIFICATION]`.

### PR-01 evidence — 2026-08-09

- `npm run test -- src/lib/gatherings/gatherings.test.ts` — PASS, 24/24 tests.
- `npm run typecheck` — PASS, exit 0.
- `git diff --check` — PASS (delivery-agent check).

### PR-02 evidence — 2026-08-09

- `npm run test -- src/components/admin/admin-gathering.test.tsx` — PASS,
  12/12 tests.
- `npm run test:e2e -- --project=chromium --grep admin-gathering` — PASS,
  5/5 tests.
- `npm run test:e2e -- --project=mobile-chrome --grep admin-gathering` — PASS,
  5/5 tests at the mobile viewport.
- `npm run typecheck` — PASS, exit 0.
- `git diff --check` — PASS (delivery-agent check).

### PR-03 evidence — 2026-08-09

- Focused unit matrix from the guide — PASS, 49/49 tests across gathering domain,
  public gathering components, gathering admin, and event domain.
- `npm run test:e2e -- --project=chromium --grep "gathering|events"` — PASS,
  15/15 tests.
- `npm run test:e2e -- --project=mobile-chrome --grep "gathering|events"` — PASS,
  15/15 tests.
- `npm run typecheck` — PASS, exit 0.
