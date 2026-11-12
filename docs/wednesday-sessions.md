# Wednesday sessions only

Build from the deployed main commit c1f0e72e, on codex/wednesday-sessions. Keep the existing public branding, colors, fonts, images and layout. Do not merge or reuse the redesign branches.

Wednesday is 7:30–9:30 PM America/New_York; Sunday is 11:30 AM–1 PM Eastern. A valid Sunday-specific legacy schedule remains supported. The current live record has its single schedule set to Wednesday, which must not move Sunday's service. Automatically select the active or next weekly session, switch at each end time, and link to the existing Google Meet URL unless Wednesday has its own configured URL. Use date-specific Wednesday details rather than reusing Sunday's sermon.

Add a matching This Wednesday tab to the existing admin. Preserve the Sunday editor and all other tools. Store Wednesday's date, title, Scripture, description and optional Meet override alongside existing content. Failed storage writes must not appear successful. No production writes, email, AI image generation or design work.

Verify Eastern DST, exact Sunday/Wednesday start/end transitions, a visitor in another timezone, date-specific copy and Meet-link selection; run lint/typecheck/build and desktop/mobile browser flows. Use independent review. Browser plugin is unavailable, so use regular Playwright. Provider tests use isolated fixtures, never live admin writes.

## Verification

- `node --test tests/service-schedule.test.mjs`: 8 regression tests passed, using the existing TypeScript dependency and Node's test runner.
- `npx tsc --noEmit` and `npm run build`: passed on the unchanged Next.js 16.1.1 dependency set.
- Scoped ESLint: no errors in changed files; existing admin/home warnings remain. Whole-repository lint still reports existing purity/effect errors in the untouched Community and AmbientMusic components.
- Real browser on the optimized local build: desktop 1440px and mobile 320px, exact Sunday-to-Wednesday and Wednesday-to-Sunday transitions in the same document, Watch and Events labels/times, shared and separately saved Meet links, Wednesday admin login/edit/save/read-back, preserved Sunday data, draft retention across tabs and failed writes, and authenticated read/storage failures.
- Independent review checked scheduling/DST/timezones, date-specific copy, URL validation, Events ordering, admin behavior and the final diff; no active P1/P2 findings in that scope.
- Header, footer, global CSS, fonts, layout and public image assets are byte-for-byte unchanged. Wednesday's longer Watch heading scales down on narrow screens to fit the existing layout.

Existing oversized Scripture text can overflow the original Home/Watch pages at 320px. That unrelated design issue is preserved and excluded from claims about the changed session controls. No reminder-delivery, image-generation, branding or broader ministry-operations work is included. No production data was changed and no meeting was joined; the browser/API flow used a disposable local KV fixture and development-only credentials. Execution receipts are in `/private/tmp/life-wednesday-2026-11-12/`.
