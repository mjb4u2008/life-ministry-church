# L.I.F.E. renewal verification

Reviewed against the requested Wednesday/Sunday scheduling, simpler pastor admin, dark public experience, Ask the Word, real TikTok posts, and the earlier operations review findings. The original checkout and existing PRs were preserved. No production datastore updates, messages, payments, merges, or manual deployment were used as tests.

## Execution

- `npm run lint`: passed.
- `npm run typecheck`: passed; the final `npm run build` also completed its TypeScript check.
- `npm test`: **195 tests passed in 32 files**.
- `npm run build`: passed with Next.js 16.3.0 and no production credentials.
- `PLAYWRIGHT_PORT=3114 PLAYWRIGHT_REUSE_SERVER=true npm run test:e2e -- --workers=2`: **76/76 passed** against the optimized local build. Desktop and mobile cases cover scheduling, admin publishing/recordings, media selection/conflicts, care, events, giving, reminders, Ask the Word, and responsive layouts. Exact time transitions include Eastern daylight saving changes and retain the same browser document.
- Real-browser inspection: desktop 1440px and mobile 390px home/hero; Ask the Word; 320px admin and error/recovery states. The responsive matrix exercises 320/360/390/430/768px. The horizontal video rail is clipped and scrollable, without increasing document width.
- **42 actual HTTP handler checks** passed using the real KV SDK against disposable local Redis: authentication, publish/read-back, stale revisions, concurrent care submissions, public privacy boundaries, unpublished testimony rejection, unsubscribe persistence, event CRUD, and prefetch rate limiting.
- The final optimized app’s video-save checks returned **200/409** for two simultaneous same-revision saves. Stale snapshots, missing versions, and invalid versions were rejected; unrelated legacy updates preserved media. Original synthetic preview selections were restored afterward.
- Independent actual-Redis checks covered legacy revisionless content upgrading 0→1, adjacent CAS races, bounded merge retries, and storage read failure preventing writes.

## Independent review

Gathering and security implementations were reviewed by agents that did not author those changes. Separate reviews covered the public UI, admin media editor, strict content reads, and final content revision guard. Confirmed findings were fixed and checked again. No active P1/P2 findings remain within the examined scope.

Repairs include explicit CAS success/conflict discrimination across five stores, API prefetch rate-limit enforcement, legacy text normalization, event conflict reload, timed event joins, preserved recording migration, unpublished-testimony privacy, and Stripe availability until Zeffy is configured.

## Provider and production limits

- **[NEEDS-VERIFICATION]** Confirm the actual Wednesday meeting link and host access before release. The default uses the existing shared Meet link; each series remains editable. Sunday’s 11:30 AM–1 PM Eastern schedule is the working assumption; Wednesday’s 7:30–9:30 PM was confirmed by the user.
- **[NEEDS-VERIFICATION]** Live AI answers/sharing, delivery providers, and payment settlement were not exercised with real credentials or recipients. Browser success/failure flows used intercepted fixtures. Existing provider configuration must be checked separately before release.
- Actual TikTok embeds were opened. All three subsequently showed active playback with progressing timestamps and muted controls in the real browser. The provider also emitted its own CSP messages and an earlier rate-limited player response. Pause, visibility/reduced-motion behavior, and retry/error states were verified with controlled player fixtures; autoplay still depends on TikTok and browser policy. Three observed ministry posts seed an uninitialized list once; this is an editable selection, not live account synchronization.
- Preview sermon content, contacts, and datastore records are synthetic. Local preview credentials are intentionally unrelated to production.

Detailed local command logs, HTTP receipts, and independent Redis proofs are in `/private/tmp/life-ministry-review/evidence/`. These are local execution artifacts, not deployed application files. Generated image prompts are recorded alongside the build guide.
