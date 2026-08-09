# Modernist Blue Homepage Pass

## Intent

Reshape the public L.I.F.E. Ministry homepage using the supplied `LIFE Ministry.dc.html` as visual evidence. The page should feel editorial, deliberate, and spacious while remaining exceptionally easy for older visitors to understand.

The page's single job is to help a visitor understand what L.I.F.E. Ministry is and confidently join the correct Wednesday or Sunday gathering.

## Visual system

- **Paper:** `#f3f2f2`
- **Ink:** `#201e1d`
- **L.I.F.E. blue:** `#146fa3`
- **Deep blue:** `#0b2940`
- **Soft panel:** `#e9eef2`
- **Rule:** ink at 32–40% opacity
- **Typography:** Archivo at 400, 600, and 800 for display, body, and utility text
- **Spacing:** 4/8/12/16/24/32px base rhythm with section padding between 48 and 88px
- **Shape:** square panels and buttons, 2px architectural rules, minimal shadow
- **Photography:** grayscale, high-contrast worship imagery with blue broadcast strips

## Layout thesis

```text
┌───────────────────────────────────────────────────────┐
│ LIFE MINISTRY       simple navigation       JOIN     │
├───────────────────────────────────────────────────────┤
│ LIVE/NEXT LABEL       │ grayscale worship image      │
│ COME AS YOU ARE.      │                               │
│ WORSHIP FROM ANYWHERE │                 BLUE RAIL     │
│ [contextual action]   │                               │
├───────────────────────────────────────────────────────┤
│ canonical gathering / title    │ countdown or status │
├───────────────────────────────────────────────────────┤
│ welcome + real form            │ simple next steps   │
├───────────────────────────────────────────────────────┤
│ L · I · F · E blue identity rail                     │
├───────────────────────────────────────────────────────┤
│ Scripture / pastor / care / reminder / events         │
└───────────────────────────────────────────────────────┘
```

The memorable element is the **blue broadcast rail**: a phase-aware line attached to the worship photograph that says Next, Room open, Live now, or Latest using the real canonical gathering.

## Guardrails and non-goals

- Keep the gathering API as the only source for Wednesday/Sunday timing and links.
- Preserve the existing above-fold contextual action at 320, 390, and 430px.
- Preserve large controls, plain labels, visible keyboard focus, reduced-motion support, and honest error/empty states.
- Do not import the reference HTML's fabricated schedule, sermon count, countries, staff, events, or archive entries.
- Do not change admin workflows, the sermon banner generator, flyer generator, scripts, pastoral-care privacy, events storage, or Zeffy configuration.
- Do not introduce literal imagery of Jesus, God, or a fabricated portrait of Pastor Mike.

## Delivery ledger

### 1. Modernist foundation and navigation

- [ ] Add Archivo as a scoped public visual-system font.
- [ ] Add reusable modernist tokens/helpers without changing admin component behavior.
- [ ] Recompose public header and footer with warm paper, ink, blue, square controls, and 2px rules.

Definition of Done:

- Header retains desktop and mobile navigation, ambient audio control, and Join/Watch behavior.
- Mobile drawer closes after navigation.
- `npm run typecheck`
- `npm run lint`
- `npx playwright test tests/e2e/responsive.spec.ts`

### 2. Canonical gathering composition

- [ ] Rebuild the home gathering hero as a responsive split editorial layout.
- [ ] Introduce the blue phase-aware broadcast rail.
- [ ] Restyle gathering actions and countdown without changing their behavior.
- [ ] Restyle loading, error, and empty states consistently.

Definition of Done:

- Upcoming, joining, live, and replay labels remain explicit.
- The primary action is at least 52px tall, at least 16px type, and above the fold at 320/390/430px.
- The error state still announces failure and provides Retry plus Get help joining.
- `npm test -- --run src/components/gatherings/gatherings.test.tsx`
- `npx playwright test tests/e2e/gathering.spec.ts`

### 3. Homepage editorial rhythm

- [ ] Convert rounded-card sections to ruled editorial sections.
- [ ] Keep the real first-time visitor, L.I.F.E. mission, Scripture, Pastor Mike, prayer/testimony, reminder, and events pathways.
- [ ] Use a single blue identity band as the primary color moment.
- [ ] Tighten copy and spacing while retaining plain-language direction.

Definition of Done:

- No fabricated public claims or people are introduced.
- Forms retain labels, consent, private-care language, and existing API contracts.
- Homepage contains one H1.
- No horizontal overflow at supported widths.
- `npm run test:e2e -- --grep "homepage|messaging|responsive"`

### 4. Convergence and release proof

- [ ] Capture desktop and 320px screenshots and visually critique both.
- [ ] Run independent P1/P2 review, fix every finding, and re-review until clean.
- [ ] Run the full raw release gates.
- [ ] Update and push the existing visual-experiment PR.

Definition of Done:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- Independent review returns no active P1/P2.
