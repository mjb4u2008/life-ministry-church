# Water of Life Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of L.I.F.E. Ministry site with light, inviting white-and-blue water theme. Replace Jitsi with Google Meet, fix data persistence with Vercel KV, add AI flyer generator, daily scripture, testimony wall, and ambient music.

**Architecture:** Next.js 16 App Router with Tailwind CSS 4. All data moves from JSON files to Vercel KV. AI features use Claude Haiku. UI inspired by 2819church.org with light water/sky CSS animations. Google Meet linked (not embedded).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, @vercel/kv, @anthropic-ai/sdk (Haiku), CSS keyframe animations.

**Design direction (from Pastor Mike):** Light, inviting, welcoming. White/sky-blue like looking at water and sky. Colors of light. "Jesus is life" — the site should attract people to that truth.

---

## Task 1: Foundation — Color System & CSS Animations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Replace the color system in globals.css**

Replace the entire `:root` block and `@theme inline` block with the new light water palette:

```css
:root {
  /* Color Palette — Living Water (Light & Inviting) */
  --white: #ffffff;
  --cloud: #f0f6ff;
  --sky: #e8f4fd;
  --water: #3b9dd9;
  --water-dark: #2d7fb5;
  --deep: #1a5276;
  --ocean: #0c2d48;
  --cyan: #00d4ff;
  --text-body: #5a7a94;
  --text-light: #8aabc4;
  --border-light: #d4e6f1;

  /* Fonts */
  --font-display: var(--font-cormorant), Georgia, serif;
  --font-body: var(--font-dm-sans), system-ui, sans-serif;
}
```

Register with Tailwind:

```css
@theme inline {
  --color-cloud: var(--cloud);
  --color-sky: var(--sky);
  --color-water: var(--water);
  --color-water-dark: var(--water-dark);
  --color-deep: var(--deep);
  --color-ocean: var(--ocean);
  --color-cyan: var(--cyan);
  --color-text-body: var(--text-body);
  --color-text-light: var(--text-light);
  --color-border-light: var(--border-light);

  --font-display: var(--font-cormorant), Georgia, serif;
  --font-body: var(--font-dm-sans), system-ui, sans-serif;
}
```

Remove ALL old color references (cream, terracotta, forest, charcoal, warm-gray).

**Step 2: Update base styles**

```css
body {
  background: var(--white);
  color: var(--deep);
  font-family: var(--font-body);
  line-height: 1.6;
}

:focus-visible {
  outline: 2px solid var(--water);
  outline-offset: 2px;
}

::selection {
  background: var(--water);
  color: var(--white);
}

::-webkit-scrollbar-track { background: var(--cloud); }
::-webkit-scrollbar-thumb { background: var(--text-light); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--water); }
```

**Step 3: Add water animation keyframes**

```css
@keyframes wave {
  0% { transform: translateX(0) scaleY(1); }
  50% { transform: translateX(-25%) scaleY(0.6); }
  100% { transform: translateX(-50%) scaleY(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(4); opacity: 0; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes glow-soft {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
```

Add utility classes:

```css
/* Gentle wave divider between sections — light blue waves on white */
.wave-divider {
  position: relative;
  overflow: hidden;
}
.wave-divider::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 60px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z' fill='%23f0f6ff'/%3E%3C/svg%3E") repeat-x;
  animation: wave 8s linear infinite;
}

/* Glass effect for header — light version */
.glass-light {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Text gradient with water blue */
.text-gradient-water {
  background: linear-gradient(135deg, var(--water), var(--cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Soft hover glow for cards */
.card-glow:hover {
  box-shadow: 0 8px 30px rgba(59, 157, 217, 0.15);
}

/* Button ripple on hover */
.btn-ripple {
  position: relative;
  overflow: hidden;
}
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}
.btn-ripple:hover::after {
  opacity: 1;
}

/* Scroll-reveal text (2819 signature element) */
.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Marquee/ticker animation */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.marquee-track {
  display: flex;
  animation: marquee 30s linear infinite;
  width: max-content;
}

/* Bold statement heading — massive, viewport-dominating */
.statement-heading {
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 700;
  letter-spacing: 0.15em;
  line-height: 1.1;
  text-transform: uppercase;
}
```

**Step 4: Update layout.tsx**

Change body className:
```tsx
<body className={`${cormorant.variable} ${dmSans.variable} font-body antialiased bg-white text-deep`}>
```

**Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: replace color system with light water/sky theme and wave animations"
```

---

## Task 2: Core Components — Button, Header, Footer

**Files:**
- Modify: `src/components/Button.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Delete: `src/components/LiveIndicator.tsx`
- Delete: `src/components/JitsiMeet.tsx`
- Modify: `src/components/index.ts`

**Step 1: Rewrite Button component**

2819-inspired parenthetical style with light water theme. Primary: water-blue bg with white text. Outline: water-blue border. Ghost: text-body color. Rounded-full. `( Text )` wrapper style.

**Step 2: Rewrite Header**

Glass-light header on white background. Water cross logo (small) + "L.I.F.E. Ministry" text. Clean nav links: Home, Watch, Prayer Wall, Testimonies, Ask The Word, Give, About. Deep blue text, water-blue hover. Mobile hamburger menu.

**Step 3: Rewrite Footer**

Ocean-blue (dark) background footer. 2819-style columns: `( Quick Links )`, `( Connect )`, `( Socials )`. Water cross logo. Copyright. Contact info placeholder for ministry email.

**Step 4: Delete unused components**

```bash
rm src/components/LiveIndicator.tsx src/components/JitsiMeet.tsx
```

Update `src/components/index.ts`.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: redesign Button, Header, Footer with light water theme; remove Jitsi"
```

---

## Task 3: Home Page Redesign

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/HomeContent.tsx`
- Modify: `src/components/ServiceCountdown.tsx`
- Modify: `src/components/ReminderSignup.tsx`
- Modify: `src/components/TikTokCarousel.tsx`

**Step 1: Rewrite home page**

New sections in order:
1. **Hero:** White-to-sky gradient. Water cross logo with soft glow. HUGE spaced heading: "L . I . F . E ." then "Lord Is Forever Emmanuel" subtitle. "Without life, there's no us." Two CTAs.
2. **Scroll-Reveal Statement (2819 signature):** Vertical line with words "Lord / Is / Forever / Emmanuel" revealing one-at-a-time as user scrolls. Use Intersection Observer API — each word gets `.scroll-reveal` class, JS adds `.visible` when in viewport. Staggered delays.
3. **Marquee Banner:** Full-width overflow-hidden div with `.marquee-track` containing duplicated text "WITHOUT LIFE THERE'S NO US" scrolling continuously. Water-blue text on cloud background. Adds movement and energy between hero and content.
4. **L.I.F.E. Meaning:** Four beautiful cards (L, I, F, E) explaining each letter. Prominent, visual, the heart of the page. Water-blue letter circles.
5. **Daily Scripture:** Display today's inspirational verse (from `/api/daily-scripture`).
4. **Service Countdown:** Next Sunday countdown.
5. **This Week's Message:** YouTube embed + message details.
6. **Latest from Pastor Mike:** TikTok carousel.
7. **Testimonies Preview:** Show latest 2-3 from testimony wall, link to full page.
8. **Need Prayer?** Soft sky-blue section, CTA to prayer wall.
9. **Upcoming Gatherings:** Dynamic dates (compute next 3 Sundays).
10. **Ready to Join?** Final CTA.

Wave dividers between sections.

**Step 2: Restyle ServiceCountdown, ReminderSignup, TikTokCarousel, HomeContent**

All updated to white/sky-blue/water-blue palette. Cloud backgrounds, water-blue accents.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: redesign home page with L.I.F.E. meaning, daily scripture, light water theme"
```

---

## Task 4: Watch Page — Google Meet + YouTube

**Files:**
- Modify: `src/app/watch/page.tsx`

**Step 1: Complete rewrite**

Remove all Jitsi code. New design:
- Hero: "Join Us This Sunday" + countdown + `( Join on Google Meet )` button (opens new tab)
- Latest Message: YouTube embed
- Weekly Flyer display
- Past Services: YouTube grid
- Get Reminded: ReminderSignup

Light theme throughout.

**Step 2: Commit**

```bash
git add src/app/watch/page.tsx
git commit -m "feat: replace Jitsi with Google Meet link and YouTube embeds"
```

---

## Task 5: Data Layer — Vercel KV

**Files:**
- Modify: `package.json`
- Rewrite: `src/lib/data.ts`
- Modify: all API routes as needed

**Step 1: Install**

```bash
npm install @vercel/kv
```

**Step 2: Rewrite data.ts**

Replace all fs operations with Vercel KV. Add new types:
- `Testimony` interface (id, name, text, isAnonymous, createdAt, approved)
- `DailyScripture` interface (verse, reference, date, generatedAt)
- Add `googleMeetLink`, `youtubeLatestUrl` to `SiteContent`

**Step 3: Create .env.local template**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: migrate data layer from JSON files to Vercel KV"
```

---

## Task 6: Prayer Wall Restyle

**Files:**
- Modify: `src/app/connect/page.tsx`

Light theme: white cards, sky-blue backgrounds, water-blue accents. Keep all functionality.

```bash
git commit -m "feat: restyle prayer wall with light water theme"
```

---

## Task 7: Testimony Wall — NEW

**Files:**
- Create: `src/app/testimonies/page.tsx`
- Create: `src/app/api/testimonies/route.ts`

**Step 1: Create API route**

Similar to prayers API: GET (public), POST (public), DELETE (admin auth), PATCH (admin).

**Step 2: Create testimony wall page**

Header: "We Are All Ministers" — "Share what Jesus has done in your life."
- Submit testimony form (modal)
- Testimony cards with name, text, date
- "This blessed me" button (like "I'm Praying")
- Scripture quote section at bottom

Light theme matching prayer wall.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add testimony wall page and API"
```

---

## Task 8: Daily Scripture API

**Files:**
- Create: `src/app/api/daily-scripture/route.ts`

**Step 1: Create route**

GET endpoint. Checks Vercel KV for today's scripture (key: `daily-scripture`). If today's date matches the stored date, return cached. Otherwise, call Haiku to generate a new inspiring verse, store with today's date, return.

System prompt: "Pick one inspiring Bible verse for today. Return JSON: { verse, reference, reflection }. The reflection is 1 sentence connecting this verse to daily life. Be warm and encouraging."

Admin can override by setting a manual daily scripture via the content API.

**Step 2: Commit**

```bash
git add src/app/api/daily-scripture/route.ts
git commit -m "feat: add daily scripture API with Haiku generation and caching"
```

---

## Task 9: Ask The Word — Haiku + Restyle

**Files:**
- Modify: `src/app/api/ask/route.ts`
- Modify: `src/app/ask/page.tsx`

**Step 1: Switch model to Haiku**

**Step 2: Restyle to light theme**

White background, cloud input area, water-blue button, sky-blue scripture card, soft shadows.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: switch Ask The Word to Haiku and apply light theme"
```

---

## Task 10: About Page Redesign

**Files:**
- Modify: `src/app/about/page.tsx`

**Step 1: Rewrite**

- Hero: "What is L.I.F.E.?" bold heading on sky-blue background
- L.I.F.E. deep dive: Rich explanation of Lord Is Forever Emmanuel, the life of Jesus, what the ministry stands for
- L.I.F.E. letter cards (styled beautifully with water-blue accents)
- Pastor Mike section: TikTok embeds + bio + contact info placeholder
- Beliefs: Numbered cards with scripture
- FAQ: Accordion
- CTA section

**Step 2: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: redesign about page with deep L.I.F.E. meaning and Pastor Mike section"
```

---

## Task 11: Give Page Restyle

**Files:**
- Modify: `src/app/give/page.tsx`

Restyle to light theme. Water-blue selected states, cloud backgrounds, white cards.

```bash
git commit -m "feat: restyle give page with light water theme"
```

---

## Task 12: Ambient Music Player

**Files:**
- Create: `src/components/AmbientMusic.tsx`
- Modify: `src/app/layout.tsx` (add AmbientMusic component)
- Add: `public/audio/ambient.mp3` (placeholder — need royalty-free worship ambient track)

**Step 1: Create AmbientMusic component**

Small floating play/pause button in bottom-right corner. Uses HTML5 `<audio>` element. Does NOT autoplay. Muted by default. User clicks to start. Loops. Subtle, non-intrusive design (small circle with music note icon). Saves play/pause preference in localStorage.

**Step 2: Add to layout**

Include `<AmbientMusic />` in the body of layout.tsx.

**Step 3: Add placeholder audio**

Create a simple note in `public/audio/README.md` explaining that `ambient.mp3` needs to be a royalty-free worship ambient track. For now, the component gracefully handles missing audio.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add ambient background music player component"
```

---

## Task 13: Flyer Generator

**Files:**
- Create: `src/app/api/flyer/route.ts`
- Create: `src/components/FlyerTemplates.tsx`
- Modify: `src/app/admin/page.tsx`

**Step 1: Create flyer API**

POST endpoint. Takes title + scripture + optional description. Haiku generates polished flyer text. Returns structured JSON.

**Step 2: Create 3 flyer templates**

1. **"Living Water"** — Sky blue gradient, water cross logo watermark, clean white text
2. **"Clean Light"** — White background, deep blue text, water-blue accent line
3. **"Bold Sky"** — Full gradient sky-to-ocean, large white bold text

Fixed aspect ratio (1080x1080) for easy screenshot/sharing.

**Step 3: Add to admin page**

Input form + template selector + preview. Restyle admin to light theme.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add AI-powered flyer generator with 3 preset templates"
```

---

## Task 14: Admin Page Updates

**Files:**
- Modify: `src/app/admin/page.tsx`

Add fields for: Google Meet link, YouTube URL, contact info, daily scripture override, testimony moderation. Restyle to light theme.

```bash
git commit -m "feat: update admin with new content fields and light theme"
```

---

## Task 15: Cleanup & Build

**Files:**
- Delete: `data/` directory
- Search and fix any remaining old color references
- Run `npm run build`

```bash
git commit -m "chore: cleanup old theme, remove JSON data dir, fix build"
```

---

## Task 16: Deployment

1. Set up Vercel KV in dashboard
2. Verify env vars (KV_REST_API_URL, KV_REST_API_TOKEN, ANTHROPIC_API_KEY, ADMIN_PASSWORD)
3. Deploy with `vercel --prod`
4. Test all features
