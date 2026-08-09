# L.I.F.E. Ministry photo-led homepage experiment

Date: August 9, 2026  
Branch: `codex/photo-led-ui-experiment`  
Base: `codex/ministry-operations-rebuild`

## Goal

Create a safe, reversible public-site design experiment that makes L.I.F.E. Ministry feel modern, warm, and visually distinctive while keeping the primary task extremely obvious for older visitors: understand the next gathering and join it.

The experiment borrows the editorial confidence and prominent live state of 2819 Church and the single-image clarity of the Ambi Rachelle homepage. It must not copy either site's composition, typography, copy, or visual identity.

## Product truth

The homepage has one primary job: help a visitor join the right gathering. Wednesday Word and Sunday Worship continue to rotate automatically from the canonical gathering API. The page must never make a visitor choose between stale or competing service links.

Secondary jobs are to welcome a first-time visitor, explain the ministry in plain language, and expose prayer, messages, events, and giving without turning the homepage into a directory.

## Audience and accessibility

- Many visitors are older and may have lower vision, reduced dexterity, or limited confidence with websites.
- Primary actions use plain verbs, at least 48px touch targets, strong contrast, and visible focus states.
- Important information is never conveyed by color alone.
- Body text stays at 17–18px on large surfaces with comfortable line height.
- Motion is brief, restrained, and disabled by `prefers-reduced-motion`.
- Mobile is designed as the primary narrow layout, including 320px width with no horizontal overflow.

## Reference decisions

### Borrow

- One commanding first impression rather than a stack of generic cards.
- Very clear live/upcoming state placed above the fold.
- Large, editorial type used sparingly.
- Photography that carries emotion and makes the ministry feel human.
- A small, deliberate palette repeated consistently.

### Avoid

- 2819's dense collage, tiny menu, and deliberately difficult display moments; they are expressive but too demanding for this audience.
- Ambi's tiny utility typography and subtle “Enter” affordance; the church needs explicit actions.
- Literal AI portraits of Jesus or God. The experiment will use respectful symbolic imagery—light, an open Bible, and a worship atmosphere—to avoid an uncanny or doctrinally specific depiction.
- Multiple equal-weight calls to action in the hero.
- Decorative motion, glass-card overload, gradients on every section, or generic app-dashboard cards.

## Visual system

### Color tokens

- Midnight: `#071521` — primary dark field and high-contrast text
- Living Water: `#1677A8` — links and supporting actions
- Emmanuel Gold: `#E4B75D` — signature accent and live/upcoming ribbon
- Parchment: `#F3EFE6` — warm page background
- Warm White: `#FFFDF8` — cards and light text
- Quiet Slate: `#526675` — secondary copy

The memorable aesthetic risk is Emmanuel Gold used as a full-width gathering ribbon cutting across a deep, cinematic image. This gives the ministry its own recognizable device without imitating 2819's red collage system.

### Type roles

- Display: Playfair Display, used only for the large ministry promise and key section statements.
- Interface/body: Outfit, used for navigation, dates, buttons, and all long-form copy.
- Utility labels: Outfit in restrained uppercase with generous tracking; never below 12px.

No new font dependency is required.

### Photography

Generate a wide, photorealistic hero image with an open Bible and warm sunrise light in a quiet worship setting. Leave dark negative space on the left for copy and keep recognizable faces out of the composition. No text, logo, watermark, angels, or literal divine figure in the image.

## Layout alternatives

### A — chosen: dynamic gathering inside the photo hero

```text
+------------------------------------------------------+
| L.I.F.E. Ministry        Watch  New  Care  Events    |
|                                                      |
|  GOD IS WITH YOU,                                  |
|  RIGHT WHERE YOU ARE.               [hero photo]     |
|                                                      |
|  [I'm new]                                            |
+======================================================+
| WEDNESDAY WORD | Aug 12 · 7:00 PM | [JOIN / REMIND]  |
+======================================================+
| A simple welcome + three clear next steps             |
| About L.I.F.E. / Pastor Mike / community proof         |
+------------------------------------------------------+
```

Why: one image establishes emotion, one sentence establishes the promise, and the gathering ribbon establishes the next action. The dynamic gathering remains the operational source of truth.

### B — rejected: static photo hero followed by service card

```text
+------------------------------------------------------+
| Full photo + ministry statement + two buttons          |
+------------------------------------------------------+
| Next gathering card | countdown | actions              |
+------------------------------------------------------+
```

Why rejected: it repeats the same two jobs in separate sections and makes the join action easier to miss below the fold.

## Homepage structure

1. Fixed, high-contrast header with five plain-language destinations and one emphasized `Watch / Join` action.
2. Full-bleed dynamic gathering hero:
   - ministry promise and short welcome
   - featured Wednesday/Sunday title, date, scripture, and status
   - one primary action (`Join gathering`, `Watch replay`, or `Get a reminder`)
   - secondary copy-link action only while the room is open
   - countdown displayed as supporting information, not the dominant object
3. “You are welcome here” introduction with direct first-visit help.
4. Three large next-step links: Watch messages, Request prayer, See events. Giving remains in the main navigation and footer until Zeffy is approved.
5. Concise L.I.F.E. meaning and mission statement.
6. Pastor Mike introduction using an honest photo placeholder treatment until a real approved photo is supplied; do not fabricate a portrait.
7. Community prayer/testimony preview using real public data only.
8. One reminder signup and a simplified footer.

The existing detailed beliefs, daily Scripture, newsletter, community, events, and contact capabilities remain available, but repeated and low-priority homepage sections may be consolidated so the page feels intentional rather than endless.

## Dynamic gathering states

- `upcoming`: show `Next: Wednesday Word` or `Next: Sunday Worship`, date, countdown, and `Get a reminder`.
- `joining`: show `The room is open` and a large `Join on Google Meet` action.
- `live`: show an unmistakable `Live now` state and the same join action.
- `replay`: show `Latest message` and `Watch replay`.
- `ended`: explain that the gathering ended and that a replay will appear when available.
- no published gathering/error: retain the ministry image and welcome statement; show a calm schedule fallback rather than an empty dark box.

The canonical API selection, Eastern-time formatting, 30-minute join window, Wednesday/Sunday ordering, and admin workflow are unchanged.

## Implementation slices

1. Generate and add the project-bound hero asset.
2. Add experiment-specific visual tokens and reduced-motion rules.
3. Refactor `GatheringHero`/`GatheringExperience` so home mode owns the first viewport while watch mode keeps a clear message header.
4. Simplify and restyle the public header with accessible mobile navigation.
5. Recompose the homepage into the focused sections above, preserving real forms/data and removing fabricated links/content.
6. Restyle the footer for consistency and fix stale anchors.
7. Update component and E2E tests for state labels, heading hierarchy, join actions, mobile menu, touch targets, and overflow.
8. Verify desktop and 320/390/768px layouts, reduced motion, keyboard focus, live/upcoming/replay states, lint, types, unit tests, E2E, and production build.

## Non-goals

- No admin UI or gathering scheduling changes.
- No generator or sermon-banner changes.
- No API, database, authentication, reminder, or pastoral-care behavior changes.
- No Zeffy or Stripe activation.
- No replacement of Pastor Mike's real identity with generated imagery.
- No automatic meeting recording/upload work.

## Definition of done

- The first viewport contains the ministry promise and the correct canonical gathering action.
- Wednesday/Sunday/live/replay states are visually distinct and remain driven by existing data.
- A first-time visitor can identify how to join within five seconds.
- Mobile has no horizontal overflow at 320, 360, 390, 430, and 768px.
- Primary targets are at least 48px; mobile menu target is at least 44px.
- WCAG AA contrast is maintained for functional text and controls.
- Reduced-motion behavior is verified.
- No admin, generator, API, or donation behavior changes.
- Full local verification passes and the result is delivered as a separate PR based on the operations rebuild branch.
