# L.I.F.E. Ministry — "Water of Life" Full Redesign

**Date:** 2026-03-13
**Status:** Approved

## Overview

Complete redesign of the L.I.F.E. Ministry virtual church website. The current terracotta/forest theme is replaced with a dark navy/cyan "Water of Life" identity inspired by the water cross logo. Design language is modeled after 2819church.org (bold typography, spaced-out headings, dramatic whitespace) but adapted with water/ocean elements — wave animations, ripple effects, flowing particles.

## Visual Identity

### Color Palette
- **Navy base:** #0a1628 (primary background)
- **Deep navy:** #0f1d32 (secondary/card backgrounds)
- **Cyan glow:** #00d4ff (primary accent, matching logo)
- **Blue:** #0077ff (secondary accent)
- **White:** #ffffff (text, contrast)
- **Muted blue:** #4a6a8a (secondary text)
- **Dark surface:** #131f33 (elevated surfaces/cards)

### Typography
- Bold, spaced-out headings (inspired by 2819's letter-spaced h1s)
- Serif display font (Cormorant Garamond — keep existing) for scripture/quotes
- Clean sans-serif body (DM Sans — keep existing)
- Massive hero text with gradient/glow effects

### Design Elements
- **Water cross logo** as hero centerpiece with radial cyan glow
- **CSS wave animations** as section dividers
- **Ripple effects** on button hover
- **Flowing particle background** on hero section (CSS-only or lightweight canvas)
- **Parenthetical button style:** `( Join This Sunday )` matching 2819's pattern
- Dark cards with subtle blue border glow on hover

## Pages

### Home (/)
- **Hero:** Full-viewport dark navy background. Water cross logo centered with radial glow. Bold spaced-out heading "LORD IS FOREVER EMMANUEL" below. Two CTA buttons: `( Join This Sunday )` and `( Learn More )`.
- **Next Service Countdown:** Styled countdown timer with cyan accent numbers.
- **This Week's Message:** Section with weekly message title, scripture, description. YouTube embed for latest sermon video. The AI-generated flyer displayed here.
- **Latest from Pastor Mike:** TikTok video carousel (keep existing but restyle).
- **Need Prayer?** Dark section with wave divider, CTA to prayer wall.
- **Wave dividers** between major sections.

### Watch (/watch)
- **Replace Jitsi with Google Meet link.** Large hero section with "Join on Google Meet" button that opens in new tab. Google Meet cannot be embedded (blocked by security headers).
- **Weekly Flyer:** Display the AI-generated flyer for the current week's lesson.
- **Past Services:** YouTube video embeds in a grid (replaces the placeholder cards).
- **Get Reminded:** Keep the reminder signup, restyled.
- Remove all Jitsi-related code (JitsiMeet component, lobby states, waiting room).

### Prayer Wall (/connect)
- **Fix persistence:** Replace JSON file storage with Vercel KV (free tier, 256MB).
- Same core features: submit prayer requests, view wall, "I'm Praying" button.
- Dark-themed cards with subtle glow effects.
- Prayer count persists across deployments.

### Ask The Word (/ask)
- **Switch from Claude Sonnet to Claude Haiku** for cost savings.
- Update the model in `/api/ask/route.ts` to `claude-haiku-4-5-20251001`.
- Restyle to match dark navy theme.
- Keep the same UX flow (input -> loading -> scripture response).

### About (/about)
- **2819-style layout:** Bold spaced headings, numbered sections.
- **L.I.F.E. meaning breakdown:** Keep the L-I-F-E letter cards, restyle with dark theme and cyan accents.
- **Pastor Mike section:** Replace photo placeholder with **embedded TikTok videos** showcasing his clips. Brief bio alongside.
- **What We Believe:** Numbered belief cards (inspired by 2819's beliefs section with expandable scripture references).
- **FAQ:** Dark accordion-style cards.

### Give (/give)
- Restyle to match new dark theme. Keep existing functionality.

### Admin (/admin)
- **New: Flyer Generator.** Pastor Mike enters:
  - Lesson title
  - Scripture reference
  - Brief description (optional)
- Claude Haiku generates polished text (sermon title treatment, pull quote, description).
- Display in **3 preset HTML/CSS templates** (dark/water theme, light/clean, bold/graphic).
- Pastor Mike can preview and screenshot to share on social media.
- Admin also manages: weekly message content, Google Meet link, social links.

## Technical Changes

### Data Persistence
- **Vercel KV** replaces JSON file storage for:
  - Prayers (prayer wall)
  - Subscribers (reminder signups)
  - Insights (shared topics from Ask The Word)
  - Site content (weekly message, Google Meet link, etc.)
- Install `@vercel/kv` package.
- Migrate all `src/lib/data.ts` functions to use KV.

### AI Model
- **Ask The Word:** Switch to `claude-haiku-4-5-20251001` (from claude-sonnet-4).
- **Flyer Generator:** New API route `/api/flyer` using Haiku.
- Update system prompt for flyer generation to output structured text for templates.

### Removed
- `JitsiMeet` component
- All Jitsi-related lobby/waiting room/service state logic in watch page
- `LiveIndicator` component (no longer needed)

### Added
- Water wave CSS animations (keyframe-based, no JS library)
- Ripple effect utility class
- Particle background component (CSS or lightweight canvas)
- Flyer template components (3 preset designs)
- `/api/flyer` route for Haiku-powered text generation
- Vercel KV integration

## Content Requirements
- **Google Meet link** from Pastor Mike (stored in admin/content)
- **YouTube channel or video URLs** for past sermons
- **TikTok video URLs** for Pastor Mike's clips on the About page
- **Weekly lesson details** entered via admin flyer generator

## Out of Scope
- AI image generation (water animations replace the need for generated images)
- Google Meet embedding (technically not possible)
- User authentication for prayer wall (keep anonymous/named as-is)
- Mobile app
