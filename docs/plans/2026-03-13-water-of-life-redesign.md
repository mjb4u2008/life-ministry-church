# L.I.F.E. Ministry — "Water of Life" Full Redesign

**Date:** 2026-03-13
**Status:** Approved (revised with Pastor Mike's direct input)

## Overview

Complete redesign of the L.I.F.E. Ministry virtual church website. The current terracotta/forest theme is replaced with a **light, inviting, white-and-blue "Living Water"** identity. The site should feel like hope — airy, clean, welcoming, like a blue sky reflected on water. Design language draws from 2819church.org (bold typography, spaced-out headings, dramatic whitespace) but adapted with light water/sky elements and a warm, inviting tone.

**Core message (from Pastor Mike):** "Jesus is life. Without life, there's no us."

## Visual Identity

### Color Palette (REVISED — Light & Inviting)
- **White base:** #ffffff (primary background — clean, open, welcoming)
- **Off-white/Cloud:** #f0f6ff (secondary background — soft blue-white like clouds)
- **Sky blue:** #e8f4fd (section backgrounds — gentle, calming)
- **Water blue:** #3b9dd9 (primary accent — inviting, alive)
- **Deep blue:** #1a5276 (headings, strong text — authority with warmth)
- **Ocean blue:** #0c2d48 (footer, dark sections — grounding depth)
- **Cyan glow:** #00d4ff (highlight accent — energy from the logo)
- **Light text:** #5a7a94 (body text on light backgrounds)
- **White:** #ffffff (text on dark sections)

The overall feel: imagine standing at the edge of clear water looking up at a blue sky — light, hopeful, clean, alive.

### Typography
- Bold, spaced-out headings (inspired by 2819's letter-spaced h1s)
- Serif display font (Cormorant Garamond — keep existing) for scripture/quotes
- Clean sans-serif body (DM Sans — keep existing)
- Massive hero text — the L.I.F.E. meaning should dominate

### Design Elements
- **Water cross logo** as hero centerpiece with soft radial glow
- **CSS wave animations** as section dividers (gentle, flowing, light blue waves)
- **Subtle ripple effects** on button hover
- **Soft gradient backgrounds** transitioning between white and sky blue
- **Parenthetical button style:** `( Join This Sunday )` matching 2819's pattern
- **White cards** with soft blue shadow on hover
- **Ambient background music** option (subtle play/pause control)

## Pages

### Home (/)
- **Hero:** Clean white/sky-blue gradient background. Water cross logo centered with soft glow. **PROMINENT** spaced-out heading: "L . I . F . E ." with "Lord Is Forever Emmanuel" below it. Tagline: "Without life, there's no us." Two CTA buttons: `( Join This Sunday )` and `( What is L.I.F.E.? )`.
- **L.I.F.E. Meaning Section:** Right on the home page — break down what L.I.F.E. stands for prominently. Each letter gets a visual card. This is the HEART of the site.
- **Daily Scripture:** Auto-generated daily inspirational verse (Haiku picks a verse each day, cached for 24hrs).
- **Next Service Countdown:** Styled countdown timer with blue accent numbers.
- **This Week's Message:** YouTube embed for latest sermon + weekly flyer.
- **Latest from Pastor Mike:** TikTok video carousel.
- **Need Prayer?** Soft wave section with CTA to prayer wall.
- **Testimonies Preview:** Latest 2-3 testimonies from the testimony wall.
- **Wave dividers** between major sections (light, gentle).

### Watch (/watch)
- **Replace Jitsi with Google Meet link.** Large hero section with "Join on Google Meet" button that opens in new tab.
- **Weekly Flyer:** Display the AI-generated flyer for the current week.
- **Past Services:** YouTube video embeds in a grid.
- **Get Reminded:** Reminder signup restyled.
- Remove all Jitsi-related code.

### Prayer Wall (/connect)
- **Fix persistence:** Replace JSON file storage with Vercel KV.
- Same core features: submit prayer requests, view wall, "I'm Praying" button.
- Light-themed cards with soft blue accents.
- Prayer count persists across deployments.

### Testimony Wall (/testimonies) — NEW PAGE
- **"We Are All Ministers"** — Header message from Pastor Mike.
- People can submit their testimony of how they came to know Christ.
- Card-based display (similar to prayer wall).
- Fields: Name (or anonymous), testimony text, optional "How I came to know Christ" tag.
- Stored in Vercel KV.
- Share button to share individual testimonies.

### Ask The Word (/ask)
- **Switch from Claude Sonnet to Claude Haiku** for cost savings.
- Restyle to match light blue theme.
- Keep the same UX flow.

### About (/about)
- **L.I.F.E. deep dive:** Thorough explanation of Lord Is Forever Emmanuel. The life of Jesus Christ. What the ministry stands for. This should be rich, compelling content.
- **Pastor Mike section:** TikTok embeds + bio. Contact info (name, phone, ministry email — email TBD).
- **What We Believe:** Numbered belief cards with scripture references.
- **FAQ:** Clean accordion-style.

### Give (/give)
- Restyle to match light theme. Keep existing functionality.

### Contact (/contact) — NEW or section on About
- Pastor Mike's name
- Ministry email (TBD — placeholder for now)
- Phone number (TBD)
- Social media links

### Admin (/admin)
- **Flyer Generator:** Pastor Mike enters lesson title + scripture → Haiku generates text → 3 preset templates to screenshot.
- Manage: weekly message, Google Meet link, YouTube URLs, social links, daily scripture override.
- Manage testimonies (approve/remove).

## New Features

### Daily Scripture
- New API route `/api/daily-scripture` that uses Haiku to select an inspiring verse.
- Cached for 24 hours (use Vercel KV with TTL or timestamp check).
- Displayed prominently on the home page.
- Admin can override with a manual pick.

### Testimony Wall
- New page at `/testimonies`.
- New API route `/api/testimonies` — CRUD similar to prayers.
- New Vercel KV key `testimonies` storing array.
- Submit form: name, testimony text, anonymous option.
- Admin can moderate (approve/remove).

### Ambient Background Music
- Small play/pause floating button (bottom corner).
- Plays a gentle, royalty-free ambient track.
- Opt-in only — does NOT auto-play (browsers block autoplay anyway).
- Use an HTML5 `<audio>` element with a single looping track.
- Store a royalty-free ambient audio file in `/public/audio/`.
- Muted by default, user clicks to enable.

## Technical Changes

### Data Persistence
- **Vercel KV** replaces JSON file storage for:
  - Prayers (prayer wall)
  - Testimonies (testimony wall) — NEW
  - Subscribers (reminder signups)
  - Insights (shared topics from Ask The Word)
  - Site content (weekly message, Google Meet link, etc.)
  - Daily scripture cache
- Install `@vercel/kv` package.

### AI Model
- **Ask The Word:** Switch to `claude-haiku-4-5-20251001`.
- **Flyer Generator:** New API route `/api/flyer` using Haiku.
- **Daily Scripture:** New API route `/api/daily-scripture` using Haiku.

### Removed
- `JitsiMeet` component
- All Jitsi-related lobby/waiting room/service state logic
- `LiveIndicator` component
- Old color system (terracotta, forest, cream, charcoal)

### Added
- Light water wave CSS animations
- Ripple effect utility class
- Soft gradient section backgrounds
- Flyer template components (3 preset designs)
- Testimony wall page + API
- Daily scripture API + display
- Ambient music player component
- Contact info section
- `/api/flyer`, `/api/daily-scripture`, `/api/testimonies` routes
- Vercel KV integration

## Content Requirements
- **Google Meet link** from Pastor Mike
- **YouTube channel or video URLs** for past sermons
- **TikTok video URLs** for Pastor Mike's clips
- **Weekly lesson details** entered via admin flyer generator
- **Ministry email** (Pastor Mike to provide)
- **Phone number** (Pastor Mike to provide)
- **Ambient music track** — royalty-free worship/peaceful audio file
- **Testimony seed content** — initial testimonies to populate the wall

## Out of Scope
- AI image generation
- Google Meet embedding (technically not possible)
- User authentication for prayer/testimony walls (keep anonymous/named)
- Mobile app
- Payment processing (Stripe placeholder stays)
