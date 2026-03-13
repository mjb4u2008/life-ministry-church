# Water of Life Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of L.I.F.E. Ministry site with dark navy/water theme, replace Jitsi with Google Meet, fix data persistence with Vercel KV, add AI flyer generator.

**Architecture:** Next.js 16 App Router with Tailwind CSS 4. All data moves from JSON files to Vercel KV. AI features use Claude Haiku. UI inspired by 2819church.org with water/ocean CSS animations. Google Meet linked (not embedded).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, @vercel/kv, @anthropic-ai/sdk (Haiku), CSS keyframe animations.

---

## Task 1: Foundation — Color System & CSS Animations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Replace the color system in globals.css**

Replace the entire `:root` block and `@theme inline` block with the new navy/cyan palette:

```css
:root {
  /* Color Palette — Water of Life */
  --navy: #0a1628;
  --navy-light: #0f1d32;
  --navy-surface: #131f33;
  --cyan: #00d4ff;
  --cyan-dark: #00a8cc;
  --blue: #0077ff;
  --blue-muted: #4a6a8a;
  --white: #ffffff;
  --white-60: rgba(255, 255, 255, 0.6);
  --white-10: rgba(255, 255, 255, 0.1);
  --red-soft: #ff4444;

  /* Fonts */
  --font-display: var(--font-cormorant), Georgia, serif;
  --font-body: var(--font-dm-sans), system-ui, sans-serif;
}
```

Update the `@theme inline` block to register the new colors with Tailwind:

```css
@theme inline {
  --color-navy: var(--navy);
  --color-navy-light: var(--navy-light);
  --color-navy-surface: var(--navy-surface);
  --color-cyan: var(--cyan);
  --color-cyan-dark: var(--cyan-dark);
  --color-blue: var(--blue);
  --color-blue-muted: var(--blue-muted);

  --font-display: var(--font-cormorant), Georgia, serif;
  --font-body: var(--font-dm-sans), system-ui, sans-serif;
}
```

Remove all old color references (cream, terracotta, forest, charcoal, warm-gray).

**Step 2: Update base styles**

```css
body {
  background: var(--navy);
  color: var(--white);
  font-family: var(--font-body);
  line-height: 1.6;
}

:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

::selection {
  background: var(--cyan);
  color: var(--navy);
}

::-webkit-scrollbar-track {
  background: var(--navy-light);
}

::-webkit-scrollbar-thumb {
  background: var(--blue-muted);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--cyan-dark);
}
```

**Step 3: Add water animation keyframes**

```css
/* Wave animation for section dividers */
@keyframes wave {
  0% { transform: translateX(0) translateZ(0) scaleY(1); }
  50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
  100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
}

/* Gentle float for hero elements */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* Ripple effect for buttons */
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}

/* Glow pulse for accents */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; filter: blur(40px); }
  50% { opacity: 1; filter: blur(60px); }
}

/* Shimmer for loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

Add utility classes:

```css
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
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z' fill='%230a1628'/%3E%3C/svg%3E") repeat-x;
  animation: wave 8s linear infinite;
}

.glass-dark {
  background: rgba(10, 22, 40, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.text-gradient-cyan {
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-ripple {
  position: relative;
  overflow: hidden;
}

.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-ripple:hover::after {
  opacity: 1;
}
```

**Step 4: Update layout.tsx**

Change the body className from the old cream/charcoal theme to navy:

```tsx
<body className={`${cormorant.variable} ${dmSans.variable} font-body antialiased bg-navy text-white`}>
```

**Step 5: Verify and commit**

Run: `npm run build` to catch any compile errors.

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: replace color system with navy/cyan water theme and add wave animations"
```

---

## Task 2: Core Components — Button & Layout

**Files:**
- Modify: `src/components/Button.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.tsx`
- Delete: `src/components/LiveIndicator.tsx`
- Delete: `src/components/JitsiMeet.tsx`
- Modify: `src/components/index.ts`

**Step 1: Rewrite Button component**

Replace the full `Button.tsx` with 2819-inspired parenthetical style + dark theme variants:

```tsx
import Link from "next/link";
import { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  href?: string;
  external?: boolean;
  className?: string;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan text-navy font-semibold hover:bg-cyan-dark btn-ripple",
  outline:
    "border border-white/20 text-white hover:border-cyan hover:text-cyan",
  ghost:
    "text-white/60 hover:text-cyan",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-5 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  href,
  external,
  className = "",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-50 disabled:cursor-not-allowed tracking-wide uppercase text-sm";

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  // Parenthetical wrapper for the text content
  const content = isLoading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Loading...
    </>
  ) : (
    <>
      <span className="opacity-50 mr-1">(</span>
      {children}
      <span className="opacity-50 ml-1">)</span>
    </>
  );

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={combinedClassName}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {content}
    </button>
  );
}
```

**Step 2: Rewrite Header with dark glass nav**

Replace `Header.tsx` entirely. New design: dark glass header, water cross logo image, 2819-style minimal nav. Remove LiveIndicator import.

Key changes:
- Dark glass background (`glass-dark` class)
- Use the water cross logo image (`/logo-water-cross.png`) scaled small in the navbar
- Cyan accent on hover
- Mobile menu with dark background
- Remove LiveIndicator reference

**Step 3: Rewrite Footer with dark theme**

Replace `Footer.tsx`. New design: deep navy background, 2819-inspired column layout with parenthetical section headers `( Quick Links )`, `( Connect )`, `( Socials )`. Social links use cyan hover. Include the water cross logo.

**Step 4: Delete unused components**

```bash
rm src/components/LiveIndicator.tsx
rm src/components/JitsiMeet.tsx
```

Update `src/components/index.ts` to remove exports for deleted components.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: redesign Button, Header, Footer with dark water theme; remove Jitsi components"
```

---

## Task 3: Home Page Redesign

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/HomeContent.tsx`
- Modify: `src/components/ServiceCountdown.tsx`
- Modify: `src/components/ReminderSignup.tsx`
- Modify: `src/components/TikTokCarousel.tsx`

**Step 1: Rewrite the home page hero**

Replace `src/app/page.tsx` entirely. New design:
- Full-viewport dark navy hero with the water cross logo (`/logo-water-cross.png`) as centered hero image
- Radial cyan glow behind the logo (CSS gradient)
- Bold spaced heading: "L O R D  I S  F O R E V E R  E M M A N U E L" in white
- Subtitle text in white/60
- Two CTAs: `( Join This Sunday )` and `( Learn More )`
- ServiceCountdown below CTAs
- Wave divider at bottom of hero
- Then HomeContent sections
- Prayer CTA section with dark surface background
- Upcoming Gatherings with dynamic dates (compute next 3 Sundays from current date)
- Final CTA section

**Step 2: Restyle ServiceCountdown**

Update `ServiceCountdown.tsx` to use navy-surface backgrounds, cyan accent numbers, white text. Replace all terracotta/cream/charcoal references.

**Step 3: Restyle HomeContent**

Update `HomeContent.tsx` to use dark backgrounds, cyan accents. Weekly message section on navy-surface cards.

**Step 4: Restyle ReminderSignup**

Update `ReminderSignup.tsx` to use dark card background, cyan buttons, navy-light inputs.

**Step 5: Restyle TikTokCarousel**

Update `TikTokCarousel.tsx` to use dark theme. Replace cream backgrounds with navy. Cyan accents.

**Step 6: Verify and commit**

Run: `npm run dev` — visually verify home page renders with new theme.

```bash
git add -A
git commit -m "feat: redesign home page with water cross hero, wave animations, dark theme"
```

---

## Task 4: Watch Page — Google Meet + YouTube

**Files:**
- Modify: `src/app/watch/page.tsx`

**Step 1: Complete rewrite of watch page**

Replace the entire watch page. Remove all Jitsi/lobby/waiting room state logic. New design:

**Hero section:**
- Large heading "Join Us This Sunday"
- Google Meet button: `( Join on Google Meet )` — opens in new tab, link comes from content API (stored as `googleMeetLink` in content)
- Countdown timer when service isn't live

**Latest Message section:**
- YouTube embed for the latest sermon (URL from content API as `youtubeLatestUrl`)
- Title and scripture reference

**Weekly Flyer section:**
- Display the AI-generated flyer for the current week (reads from content API)

**Past Services section:**
- YouTube video embeds in a 2-column grid
- Keep the past services data structure but make URLs configurable

**Get Reminded section:**
- ReminderSignup component in a dark card

All styled in dark navy theme with cyan accents.

**Step 2: Verify and commit**

```bash
git add src/app/watch/page.tsx
git commit -m "feat: replace Jitsi with Google Meet link and YouTube embeds on watch page"
```

---

## Task 5: Data Layer — Vercel KV

**Files:**
- Modify: `package.json` (add @vercel/kv)
- Modify: `src/lib/data.ts` (complete rewrite)
- Modify: `src/app/api/prayers/route.ts` (minor updates)
- Modify: `src/app/api/content/route.ts` (minor updates)
- Modify: `src/app/api/subscribers/route.ts`
- Modify: `src/app/api/insights/route.ts`
- Create: `.env.local` (add KV_REST_API_URL and KV_REST_API_TOKEN placeholders)

**Step 1: Install Vercel KV**

```bash
npm install @vercel/kv
```

**Step 2: Rewrite data.ts to use Vercel KV**

Replace all `fs.readFile`/`fs.writeFile` operations with Vercel KV operations. Key patterns:

- `getContent()` → `kv.get('content')` with fallback defaults
- `updateContent()` → `kv.set('content', updatedContent)`
- `getPrayers()` → `kv.get('prayers')` returns `Prayer[]`
- `addPrayer()` → get array, unshift, `kv.set('prayers', prayers)`
- `incrementPrayerCount()` → get array, find/update, `kv.set('prayers', prayers)`
- Same pattern for subscribers and insights

Keep all the same TypeScript interfaces. Add `googleMeetLink` and `youtubeLatestUrl` fields to `SiteContent`.

**Step 3: Add .env.local template**

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
ANTHROPIC_API_KEY=
ADMIN_PASSWORD=
```

Note: add `.env.local` to `.gitignore` if not already.

**Step 4: Test locally**

For local development without KV, the fallback defaults in `getContent()` ensure the site still loads. Prayer wall and subscriber features will fail gracefully without KV credentials.

**Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/data.ts .env.local
git commit -m "feat: migrate data layer from JSON files to Vercel KV"
```

---

## Task 6: Prayer Wall Restyle

**Files:**
- Modify: `src/app/connect/page.tsx`

**Step 1: Restyle prayer wall**

Update all colors and styling to dark theme:
- Hero section: navy-light background with cyan heading
- Prayer cards: navy-surface background with white/60 text, cyan accents
- "I'm Praying" button: outline style with cyan on active
- Form modal: navy-surface background, navy-light inputs
- Success message: cyan accent
- Empty state: navy-surface card
- Scripture section at bottom: dark card with cyan quote marks

Keep all the existing functionality (submit, pray, optimistic updates).

**Step 2: Commit**

```bash
git add src/app/connect/page.tsx
git commit -m "feat: restyle prayer wall with dark water theme"
```

---

## Task 7: Ask The Word — Haiku + Restyle

**Files:**
- Modify: `src/app/api/ask/route.ts`
- Modify: `src/app/ask/page.tsx`

**Step 1: Switch to Haiku**

In `src/app/api/ask/route.ts`, change the model:

```ts
const response = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  // ... rest stays the same
});
```

**Step 2: Restyle the Ask page**

Update `src/app/ask/page.tsx` to dark theme:
- Navy background (already has `bg-[#FAF8F5]` — change to navy)
- Input textarea: navy-surface background, white text, cyan focus ring
- "Seek Scripture" button: cyan primary
- Loading spinner: cyan accent
- Scripture card: navy-surface with subtle cyan border glow
- "Why This Speaks" section: navy-light background
- "Explore More" cards: navy-surface with cyan hover border
- Share prompt: navy-light

**Step 3: Commit**

```bash
git add src/app/api/ask/route.ts src/app/ask/page.tsx
git commit -m "feat: switch Ask The Word to Haiku and apply dark theme"
```

---

## Task 8: About Page Redesign

**Files:**
- Modify: `src/app/about/page.tsx`

**Step 1: Rewrite about page**

2819-inspired layout with dark theme. Key sections:

**Hero:** Full-width dark section with bold spaced heading "W H A T  I S  L . I . F . E . ?" and subtitle.

**L.I.F.E. meaning:** Keep the L-I-F-E letter cards but restyle — navy-surface cards, cyan letter circles with glow effect.

**Scripture Connection:** Dark card with the Isaiah/Matthew passages. Cyan accent for verse references.

**What This Means for You:** Navy-light background section with 3 feature cards (keep existing content).

**Pastor Mike:** Replace the photo placeholder with TikTok video embeds. Use the same TikTok embed pattern from TikTokCarousel. Brief bio text alongside. Use a TikTok profile link button. Heading: "Meet Pastor Mike" with his clips.

**What We Believe:** 2819-inspired numbered beliefs list. Navy-surface cards with numbered cyan accent. Expandable scripture references on click.

**FAQ:** Dark accordion-style. Navy-surface cards, white text, cyan expand icon.

**CTA:** Final section with `( Join This Sunday )` and `( Submit a Prayer Request )`.

**Step 2: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: redesign about page with 2819-inspired layout, Pastor Mike TikTok section"
```

---

## Task 9: Give Page Restyle

**Files:**
- Modify: `src/app/give/page.tsx`

**Step 1: Restyle give page to dark theme**

Update all backgrounds, card styles, button colors to navy/cyan theme. Keep existing Stripe placeholder functionality.

- Hero: navy-light background
- Form card: navy-surface background
- Fund selection buttons: navy-light default, cyan selected
- Amount buttons: navy-light default, cyan selected
- Custom amount input: navy-surface background
- Recurring toggle: navy-light default, cyan active
- Summary: navy background
- "Continue to Payment" button: cyan primary
- "Where Your Gift Goes" cards: navy-surface

**Step 2: Commit**

```bash
git add src/app/give/page.tsx
git commit -m "feat: restyle give page with dark water theme"
```

---

## Task 10: Flyer Generator

**Files:**
- Create: `src/app/api/flyer/route.ts`
- Create: `src/components/FlyerTemplates.tsx`
- Modify: `src/app/admin/page.tsx` (add flyer generator section)

**Step 1: Create the flyer API route**

`src/app/api/flyer/route.ts` — POST endpoint that takes `{ title, scripture, description? }` and uses Claude Haiku to generate polished flyer text:

```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const FLYER_PROMPT = `You are a creative church flyer copywriter for L.I.F.E. Ministry. Given a sermon title, scripture reference, and optional description, generate polished text for a church service flyer.

Respond with valid JSON:
{
  "headline": "A compelling 3-6 word headline (can differ from the title)",
  "subheadline": "A powerful one-line hook or question that draws people in",
  "scripture_text": "The actual verse text (look it up and quote it accurately)",
  "scripture_ref": "Book Chapter:Verse",
  "details": "L.I.F.E. Ministry | Sunday 10:00 AM ET | Google Meet",
  "tagline": "A brief inspiring closing phrase (under 10 words)"
}

Keep it punchy, warm, and inviting. No churchy clichés.`;

export async function POST(request: NextRequest) {
  // Verify auth, parse body, call Haiku, return structured flyer text
}
```

**Step 2: Create FlyerTemplates component**

`src/components/FlyerTemplates.tsx` — Three preset template designs that take the generated text and render beautiful HTML/CSS cards:

1. **"Deep Water"** — Dark navy gradient background, water cross logo watermark, cyan glow text
2. **"Clean Light"** — White background, navy text, cyan accent line, minimal
3. **"Bold Impact"** — Full cyan-to-navy gradient, large white bold text, dramatic

Each template renders as a fixed-aspect-ratio div (1080x1080 for Instagram, or 1080x1920 for stories) that can be screenshot.

**Step 3: Add flyer generator to admin page**

Add a new section to the admin page with:
- Input fields: Title, Scripture, Description (optional)
- "Generate Flyer" button
- Template selector (3 options)
- Preview of the generated flyer
- Instructions: "Screenshot this flyer to share on social media"

**Step 4: Commit**

```bash
git add src/app/api/flyer/route.ts src/components/FlyerTemplates.tsx src/app/admin/page.tsx
git commit -m "feat: add AI-powered flyer generator with 3 preset templates"
```

---

## Task 11: Admin Page Updates

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1: Update admin page**

Add fields for new content:
- Google Meet link input
- YouTube latest video URL input
- Keep existing: weekly message, TikTok videos, social links
- Add the flyer generator (from Task 10)

Restyle the entire admin page to dark theme.

**Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: update admin with Google Meet link, YouTube URL, dark theme"
```

---

## Task 12: Cleanup & Final Polish

**Files:**
- Delete: `data/` directory (no longer needed with Vercel KV)
- Delete: `src/components/JitsiMeet.tsx` (if not already deleted)
- Delete: `src/components/LiveIndicator.tsx` (if not already deleted)
- Modify: `src/components/index.ts` (clean up exports)
- Modify: various files for any remaining old color references

**Step 1: Search for leftover old theme references**

```bash
grep -r "terracotta\|cream\|forest\|charcoal\|warm-gray" src/ --include="*.tsx" --include="*.ts" -l
```

Fix any remaining old color references.

**Step 2: Remove data directory**

```bash
rm -rf data/
```

**Step 3: Build and verify**

```bash
npm run build
```

Fix any TypeScript or build errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup old theme references, remove JSON data files"
```

---

## Task 13: Deployment Preparation

**Files:**
- Modify: `.env.local` (ensure all env vars documented)
- Modify: `next.config.ts` (if any changes needed)

**Step 1: Set up Vercel KV**

In Vercel dashboard:
1. Go to the virtual-church project
2. Add a KV database (Storage → KV → Create)
3. This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars

**Step 2: Verify ANTHROPIC_API_KEY is set**

Ensure the API key is in Vercel environment variables.

**Step 3: Deploy and test**

```bash
vercel --prod
```

Verify all pages load, prayer wall persists, Ask The Word works with Haiku, flyer generator works.

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: deployment preparation and final fixes"
```
