# PHASE 19B — Public Landing & Marketing Page
> DirectorByte Rebuild · Depends on: PHASE_08 (design system), PHASE_09 (auth routes exist)
> Can be built in parallel with Phases 10-15.

---

## Objective

Build the public-facing marketing page at `/` (root). This is the first thing
a new visitor sees when they land on the domain. It must communicate what
DirectorByte does, establish credibility, drive signups, and look genuinely
impressive — not like a generic SaaS landing template.

**Reference visual quality:** Study https://www.uupm.cc/ for dashboard/product aesthetics.
Look at landing pages of: Runway ML, Pika Labs, Luma AI — premium AI creative tools.
DirectorByte should feel like it belongs in that tier.

---

## 19B.1 — Route Structure

```
/ (root)             → Landing page (public, no auth required)
/pricing             → Pricing page (public — this already exists in Phase 13,
                       but also linked from landing)
/shared/:token       → Public project viewer (see 19B.7)
```

Users who are already logged in and visit `/` should be redirected to `/home`.
Implement this redirect in the landing page component:
```typescript
// If isAuthenticated → navigate('/home', { replace: true })
```

---

## 19B.2 — Page Structure (Sections)

The landing page is a single long-scroll page with these sections in order:

1. **Navbar** — Fixed top
2. **Hero** — First fold, max impact
3. **Social Proof Bar** — Logos / stats strip
4. **Features Showcase** — Core capabilities
5. **How It Works** — 3-step pipeline visualization
6. **Studio Preview** — Interactive or animated screenshot
7. **Pricing Preview** — 3 plan cards (simplified)
8. **Testimonials** — Social proof quotes
9. **FAQ** — Expandable accordion
10. **Final CTA** — Bottom conversion section
11. **Footer** — Links, legal

---

## 19B.3 — Navbar (`/components/LandingNav/`)

Fixed top, transparent when at top of page, blurs + darkens on scroll.

Contents:
- Left: DirectorByte logo + wordmark
- Center (desktop only): navigation links — Features, Pricing, Docs, Blog (if exists)
- Right: Sign In button (ghost style) + Get Started button (brand primary)

Mobile: hamburger menu opens fullscreen overlay with links stacked.

Scroll behavior:
```css
/* At top: */
background: transparent; backdrop-filter: none;

/* After 50px scroll: */
background: rgba(13, 13, 15, 0.85);
backdrop-filter: blur(12px);
border-bottom: var(--border-subtle);
transition: all 200ms var(--ease-out);
```

Active section highlighting: as user scrolls, the nav link for the current
section gets an underline/accent. Use IntersectionObserver.

---

## 19B.4 — Hero Section

This is the most important section. It must stop people from scrolling past.

**Layout:** Full viewport height (100svh), centered content with subtle animated background.

**Background:** Animated gradient mesh — slow-moving abstract shapes in brand colors
(dark violet, deep indigo, near-black). Use CSS `@keyframes` or a simple canvas shader.
The movement should be extremely subtle — this is cinema-grade software, not a rave.

**Content:**
```
[Tag badge]   🎬 Now in Beta — AI Film Generation

[H1 Headline, max 60 chars]
"Turn Ideas Into
Cinematic Films
With AI"

[Subheadline, max 100 chars]
"DirectorByte transforms your concept into a full production pipeline —
script, storyboard, keyframes, video, and soundtrack — in minutes."

[CTA Buttons row]
  [Start for Free →]        [Watch Demo ▶]

[Trust signals]
  ⭐ 4.9/5 rating   |   10,000+ creators   |   No credit card required

[Hero visual — below the text]
A sleek mockup showing the studio interface: the 7-stage pipeline
sidebar on the left, a keyframe grid visible in the center workspace.
This should look like a real screenshot of the app (use the actual
UI from Phase 11, take a screenshot, clean it up, use as static image).
```

**Animations:**
- H1: words appear one by one with a 40ms stagger, fade-up from y+20
- Subheadline: fade-in after headline completes, 150ms delay
- CTA buttons: scale-in with spring easing, 300ms after subheadline
- Hero mockup: slow float animation (translate Y ±8px, 6s loop, ease-in-out)
- All animations respect `prefers-reduced-motion`

---

## 19B.5 — Social Proof Bar

Full-width strip, subtle surface, between hero and features.

```
Trusted by creators at         [Logo] [Logo] [Logo] [Logo] [Logo]
                                 (use placeholder company logos)
```

Stats row (animated counter, starts when section scrolls into view):
```
[ 10,000+ ]    [ 50,000+ ]    [ 98% ]      [ 4.9/5 ]
  Films          Scenes         Satisfaction   Rating
  Generated      Created        Rate
```

Counter animation: count up from 0 to the target number over 2 seconds (ease-out curve).
Use IntersectionObserver to trigger only when visible.

---

## 19B.6 — Features Showcase

**Layout:** Alternating left/right feature cards. Desktop: 2-column (text left, visual right, then flip). Mobile: stacked.

Feature items to showcase:

**Feature 1: AI Script Generation**
Icon: Scroll icon
Title: "From Concept to Complete Script"
Body: "Describe your story idea and watch DirectorByte write a production-ready screenplay — character arcs, dialogue, scene descriptions — all in seconds."
Visual: Animated text appearing in a code/script editor UI mockup

**Feature 2: Storyboard & Keyframes**
Icon: Grid icon
Title: "Visualize Every Scene"
Body: "Generate cinematic keyframe images for each scene automatically. Customize the visual style, lighting, and mood with natural language prompts."
Visual: Grid of 6 keyframe thumbnail images (use sample AI images)

**Feature 3: AI Video Generation**
Icon: Film icon
Title: "Bring Storyboards to Life"
Body: "Transform keyframes into full video sequences using state-of-the-art video models — RunwayML, Kling, or Pika. Your choice of provider."
Visual: Video player mockup showing a generated scene

**Feature 4: Custom Soundtrack & Voice**
Icon: Music note icon
Title: "Sound That Matches Your Vision"
Body: "Generate royalty-free background music with AI, then add professional voice-over narration — all in the same pipeline."
Visual: Audio waveform visualization, voice settings panel

**Feature 5: Your API Keys, Your Control**
Icon: Key icon
Title: "Total Provider Flexibility"
Body: "Use our managed API keys on paid plans, or bring your own for any module. Mix and match providers per feature — you're never locked in."
Visual: The API key manager UI from Phase 12 (screenshot or mockup)

**Feature 6: Google Drive Integration**
Icon: Cloud icon
Title: "Cloud Storage Built In"
Body: "Sign in with Google to sync all your projects directly to your Drive. Access your films from any device, anytime."
Visual: Google Drive folder with project files

Scroll-triggered entrance animations: each feature card fades and slides in from the side
as it enters the viewport. Use IntersectionObserver + CSS classes (no heavy JS lib needed).

---

## 19B.7 — How It Works (Pipeline Visualization)

**Title:** "Create a Film in 7 Steps"

Show the 7-stage pipeline as an interactive horizontal (desktop) or vertical (mobile) stepper:

```
[Script] → [Storyboard] → [Keyframes] → [Video] → [Audio] → [Voiceover] → [Export]
```

Each step:
- Numbered circle with stage icon
- Short label
- On hover/click: expand to show brief description + example output

Animated connecting arrows between stages (SVG path with `stroke-dashoffset` animation
triggered when user clicks through stages).

Add a "Try it live" prompt below: clicking opens a demo mode of the studio with
pre-populated sample content. (Even a read-only tour of the studio is fine — link to
`/studio/demo` which loads a pre-made project in view-only mode.)

---

## 19B.8 — Shared Project Viewer (`/shared/:token`)

This is the public URL that users generate when they share a project (Phase 04 / Phase 10).
It's not part of the landing page per se, but it's a public route and fits here.

**Layout:** Minimal header (DirectorByte logo + "Open in App" CTA) + project content.

**Content to show for a shared project:**
- Project title and description
- Selected genre, style, duration
- Generated script excerpt (first scene)
- Keyframe image grid (if generated)
- Any generated video clips (embedded player)
- "Create your own film →" CTA button linking to `/signup`

**Access rules:**
- If `shareEnabled=false` or invalid token: show 404 error state
- If `shareEnabled=true`: show content publicly, no auth required
- If viewer is signed in: show "Open in Studio" button instead of "Sign up"

**Route:** `/shared/:token` → fetches `GET /api/v1/projects/shared/:token`

---

## 19B.9 — Pricing Preview

Simplified 3-column pricing cards (same data as Phase 13 pricing page, but lighter).

```
[Free]          [Creator ★ POPULAR]     [Studio]
$0/mo           $19/mo                  $49/mo
5 projects      Unlimited               Unlimited
50 credits      500 credits             2000 credits
BYO API keys    Managed keys            All features

[Get Started]   [Get Creator →]         [Get Studio]
```

Below the cards:
```
✓ No credit card for Free   ✓ Cancel anytime   ✓ Promo codes accepted
```

"View full pricing →" link takes to `/pricing` (Phase 13 page).

---

## 19B.10 — Testimonials

3 testimonials in a horizontal card row (desktop) or carousel (mobile).

Each card:
```
"DirectorByte cut my pre-production time from weeks to hours.
 The keyframe generation alone is worth the subscription."

[Avatar]  Sarah Chen
          Independent Filmmaker · Los Angeles
```

Star rating (5/5) at top of each card.

For now, use realistic fictional testimonials. Later these can be replaced with real ones.

---

## 19B.11 — FAQ Section

Expandable accordion (use Radix UI Accordion).

Questions to include:
1. "What is DirectorByte?" — 2-sentence answer
2. "Do I need my own API keys?" — explain free vs paid plans
3. "What AI models does DirectorByte use?" — list providers
4. "Can I use my Google Drive to store projects?" — explain the integration
5. "What export formats are supported?" — list MP4, MOV, image sequences, etc.
6. "Is there a free plan?" — yes, explain limits
7. "How do promo codes work?" — brief explanation
8. "Can I cancel at any time?" — yes, no lock-in
9. "Is my data secure?" — brief answer
10. "Where can I get support?" — mention help center + ticket system

Animation: smooth height transition when expanding/collapsing.

---

## 19B.12 — Final CTA Section

Visually distinct from the rest of the page — uses a brand gradient background.

```
[Directorbyte logo large]

"Ready to Direct Your Vision?"

"Join 10,000+ filmmakers using AI to tell their stories.
 Start free today — no credit card required."

[Create Your First Film — Free →]
[or  Sign in  if you have an account]
```

Background: subtle animated gradient (brand violet to deep indigo, very slow movement).

---

## 19B.13 — Footer

4-column grid (desktop), stacked (mobile):

```
Column 1: Logo + tagline + social icons (Twitter/X, YouTube, Discord)

Column 2: Product
  Home    Studio    Pricing    Changelog

Column 3: Company
  About   Blog   Careers   Press

Column 4: Legal & Support
  Help Center   Contact   Privacy Policy
  Terms of Service   Status Page
```

Bottom bar:
```
© 2025 DirectorByte. All rights reserved.   |   Made with AI ❤️
```

---

## 19B.14 — SEO & Meta Tags

Add to the landing page's `<head>` via React Helmet or Next.js metadata:

```html
<title>DirectorByte — AI Film Generator</title>
<meta name="description" content="Turn your ideas into cinematic films with AI. Generate scripts, storyboards, keyframes, video, and audio in one pipeline." />

<!-- Open Graph -->
<meta property="og:title" content="DirectorByte — AI Film Generator" />
<meta property="og:description" content="..." />
<meta property="og:image" content="/og-image.png" />  <!-- 1200x630 -->
<meta property="og:url" content="https://directorbyte.com" />
<meta property="og:type" content="website" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="DirectorByte" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="/og-image.png" />

<!-- Canonical -->
<link rel="canonical" href="https://directorbyte.com" />
```

Create a static `og-image.png` (1200×630) — the hero visual with the logo overlaid.
This appears as the preview when the URL is shared on social media.

Also create:
- `public/sitemap.xml` — listing `/`, `/pricing`, `/help` etc.
- `public/robots.txt` — allow all crawlers

---

## 19B.15 — Performance Requirements

- Lighthouse score: 90+ on all four metrics (Performance, Accessibility, Best Practices, SEO)
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1
- All images: use `loading="lazy"` except hero image (use `fetchpriority="high"`)
- Hero background animation: use CSS only (no canvas/WebGL) for performance
- No third-party scripts that block page load (analytics deferred, no ad scripts)

---

## 19B.16 — Completion Criteria

- [ ] `/` renders landing page, redirect to `/home` for logged-in users
- [ ] Navbar: transparent → blurred on scroll, mobile hamburger works
- [ ] Hero: animated gradient background, H1 word-by-word entrance, CTA buttons
- [ ] Stats counter animates on scroll into view
- [ ] All 6 feature cards render with scroll-triggered animations
- [ ] Pipeline stepper interactive on hover/click
- [ ] Pricing preview shows 3 plans from API (or static if API not ready)
- [ ] Testimonial cards render correctly
- [ ] FAQ accordion expands/collapses smoothly
- [ ] Final CTA section has brand gradient background
- [ ] Footer complete with all links
- [ ] `/shared/:token` renders correctly for valid tokens
- [ ] `/shared/:token` shows 404 state for disabled/invalid tokens
- [ ] All meta tags and OG tags present
- [ ] sitemap.xml and robots.txt exist
- [ ] Mobile responsive at 375px width (all sections)
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Lighthouse score ≥ 90 on all four metrics
- [ ] Zero TypeScript errors
