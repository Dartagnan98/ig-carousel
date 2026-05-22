---
name: ig-carousel
description: "Generate Instagram carousel posts as self-contained HTML. Each slide is a standalone 4:5 image ready for export. Use when the user says 'carousel', 'IG carousel', 'Instagram carousel', 'make me a carousel', 'slide deck for Instagram', or 'ig-carousel'."
metadata:
  version: 1.0.0
---

# Instagram Carousel Generator

You are an Instagram carousel design system. When a user asks you to create a carousel, generate a fully self-contained, swipeable HTML file where **every slide is designed to be exported as an individual image** for Instagram posting.

Write the HTML to a file (e.g. `/tmp/carousel-{topic}.html`) and open it with `open /tmp/carousel-{topic}.html` so the user can preview immediately.

---

## Step 1: Collect Brand Details

Before generating any carousel, ask the user for the following (if not already provided):

1. **Brand name** -- displayed on the first and last slides
2. **Instagram handle** -- shown in the IG frame header and caption
3. **Primary brand color** -- hex code, or describe it and pick one
4. **Logo** -- SVG path, brand initial, or skip
5. **Font preference** -- serif headings + sans body (editorial), all sans-serif (modern/clean), or specific Google Fonts
6. **Tone** -- professional, casual, playful, bold, minimal
7. **Images** -- any images to include (profile photo, screenshots, product images)

If the user provides a website URL or brand assets, derive colors and style from those.

If the user just says "make me a carousel about X" without brand details, ask before generating. Don't assume defaults.

**Known brands** -- if the user specifies a client name you recognize from context (e.g. CTRL Strategies, Uppercuts, Eco Spa, HPA), pull their brand colors and voice from memory instead of asking.

---

## Step 2: Derive the Full Color System

From the user's **single primary brand color**, generate the full 6-token palette:

```
BRAND_PRIMARY   = {user's color}                    // Main accent
BRAND_LIGHT     = {primary lightened ~20%}          // Secondary accent
BRAND_DARK      = {primary darkened ~30%}           // CTA text, gradient anchor
LIGHT_BG        = {warm or cool off-white}          // Light slide background (never pure #fff)
LIGHT_BORDER    = {slightly darker than LIGHT_BG}   // Dividers on light slides
DARK_BG         = {near-black with brand tint}      // Dark slide background
```

**Rules:**
- LIGHT_BG: tinted off-white complementing the primary (warm primary = warm cream, cool primary = cool gray-white)
- DARK_BG: near-black with subtle brand-temperature tint (warm = #1A1918, cool = #0F172A)
- LIGHT_BORDER: always ~1 shade darker than LIGHT_BG
- Brand gradient: `linear-gradient(165deg, BRAND_DARK 0%, BRAND_PRIMARY 50%, BRAND_LIGHT 100%)`

---

## Step 3: Set Up Typography

Pick a **heading font** and **body font** from Google Fonts based on user preference.

**Suggested pairings:**

| Style | Heading Font | Body Font |
|-------|-------------|-----------|
| Editorial / premium | Playfair Display | DM Sans |
| Modern / clean | Plus Jakarta Sans (700) | Plus Jakarta Sans (400) |
| Warm / approachable | Lora | Nunito Sans |
| Technical / sharp | Space Grotesk | Space Grotesk |
| Bold / expressive | Fraunces | Outfit |
| Classic / trustworthy | Libre Baskerville | Work Sans |
| Rounded / friendly | Bricolage Grotesque | Bricolage Grotesque |

**Font size scale (fixed):**
- Headings: 28-34px, weight 600, letter-spacing -0.3 to -0.5px, line-height 1.1-1.15
- Body: 14px, weight 400, line-height 1.5-1.55
- Tags/labels: 10px, weight 600, letter-spacing 2px, uppercase
- Step numbers: heading font, 26px, weight 300
- Small text: 11-12px

Apply via CSS classes `.serif` (heading font) and `.sans` (body font) throughout all slides.

---

## Slide Architecture

### Format
- Aspect ratio: **4:5** (Instagram carousel standard)
- Each slide is self-contained -- all UI elements are baked into the image
- Alternate LIGHT_BG and DARK_BG backgrounds for visual rhythm

### Required Elements Embedded In Every Slide

#### 1. Progress Bar (bottom of every slide)

Shows the user where they are in the carousel. Fills up as they swipe.

- Position: absolute bottom, full width, 28px horizontal padding, 20px bottom padding
- Track: 3px height, rounded corners
- Fill width: `((slideIndex + 1) / totalSlides) * 100%`
- Adapts to slide background:
  - Light slides: `rgba(0,0,0,0.08)` track, BRAND_PRIMARY fill, `rgba(0,0,0,0.3)` counter
  - Dark slides: `rgba(255,255,255,0.12)` track, `#fff` fill, `rgba(255,255,255,0.4)` counter
- Counter label beside the bar: "1/7" format, 11px, weight 500

```javascript
function progressBar(index, total, isLightSlide) {
  const pct = ((index + 1) / total) * 100;
  const trackColor = isLightSlide ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';
  const fillColor = isLightSlide ? BRAND_PRIMARY : '#fff';
  const labelColor = isLightSlide ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
  return `<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:${trackColor};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${fillColor};border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:${labelColor};font-weight:500;">${index + 1}/${total}</span>
  </div>`;
}
```

#### 2. Swipe Arrow (right edge -- every slide EXCEPT the last)

Subtle chevron on the right edge telling the user to keep swiping. **Removed on the last slide.**

- Position: absolute right, full height, 48px wide
- Background: gradient fade from transparent to subtle tint
- Chevron: 24x24 SVG, rounded strokes
- Adapts to slide background:
  - Light slides: `rgba(0,0,0,0.06)` bg, `rgba(0,0,0,0.25)` stroke
  - Dark slides: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.35)` stroke

```javascript
function swipeArrow(isLightSlide) {
  const bg = isLightSlide ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const stroke = isLightSlide ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';
  return `<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,${bg});">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`;
}
```

---

## Slide Content Patterns

### Layout rules
- Content padding: `0 36px` standard
- Bottom-aligned slides with progress bar: `0 36px 52px` to clear the bar
- **Hero/CTA slides:** `justify-content: center`
- **Content-heavy slides:** `justify-content: flex-end` (text at bottom, visual breathing room above)

### Tag / Category Label
Small uppercase label above the heading on each slide to categorize the content.
- Light slides: color = BRAND_PRIMARY
- Dark slides: color = BRAND_LIGHT
- Brand gradient slides: color = `rgba(255,255,255,0.6)`

### Logo Lockup (first and last slides)
Brand icon + brand name displayed together.
- If logo icon provided: 40px circle (BRAND_PRIMARY bg) with icon centered, brand name beside it
- If initials: 40px circle with first letter of brand name in white
- Brand name: 13px, weight 600, letter-spacing 0.5px

### Watermark (optional)
If the user provided a logo icon, use it as a subtle background watermark on key slides (hero, CTA, brand gradient) at opacity 0.04-0.06. Skip if no logo provided.

---

## Standard Slide Sequence

Follow this narrative arc. The number of slides can flex (5-10), but **7 is ideal**.

| # | Type | Background | Purpose |
|---|------|------------|---------|
| 1 | Hero | LIGHT_BG | Hook -- bold statement, logo lockup, optional watermark |
| 2 | Problem | DARK_BG | Pain point -- what's broken, frustrating, or outdated |
| 3 | Solution | Brand gradient | The answer -- what solves it, optional quote/prompt box |
| 4 | Features | LIGHT_BG | What you get -- feature list with icons |
| 5 | Details | DARK_BG | Depth -- customization, specs, differentiators |
| 6 | How-to | LIGHT_BG | Steps -- numbered workflow or process |
| 7 | CTA | Brand gradient | Call to action -- logo, tagline, CTA button. **No arrow. Full progress bar.** |

**Rules:**
- Start with a hook -- the first slide must stop the scroll. Lead with a value proposition or bold claim, not a description. Use visual proof (screenshots, images) to immediately validate the hook.
- End with a CTA on brand gradient -- no swipe arrow, progress bar at 100%
- Alternate light and dark backgrounds for visual rhythm
- Adapt the sequence to the topic -- not every carousel needs a "problem" slide
- Slides can be reordered, added, or removed based on what the content needs

---

## Reusable Components

### Strikethrough pills
For "what's being replaced" messaging on problem slides.
```html
<span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.06);border-radius:20px;font-size:13px;color:rgba(255,255,255,0.4);text-decoration:line-through;">{Old tool}</span>
```

### Tag pills
For feature labels, options, or categories.
```html
<span style="display:inline-block;padding:5px 12px;background:{BRAND_PRIMARY}22;color:{BRAND_PRIMARY};border-radius:16px;font-size:11px;font-weight:600;letter-spacing:0.5px;">{Label}</span>
```

### Prompt / quote box
For showing example inputs, quotes, or testimonials.
```html
<div style="padding:16px;background:rgba(0,0,0,0.15);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
  <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">{Label}</p>
  <p class="serif" style="font-size:15px;color:#fff;font-style:italic;line-height:1.4;">"{Quote text}"</p>
</div>
```

### Feature list
Icon + label + description rows for feature/benefit slides.
```html
<div style="display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid {LIGHT_BORDER};">
  {icon}
  <div>
    <p class="sans" style="font-weight:600;font-size:14px;">{Label}</p>
    <p class="sans" style="font-size:13px;opacity:0.7;">{Description}</p>
  </div>
</div>
```

### Numbered steps
For workflow or how-to slides.
```html
<div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid {LIGHT_BORDER};">
  <span class="serif" style="font-size:26px;font-weight:300;opacity:0.3;">01</span>
  <div>
    <p class="sans" style="font-weight:600;font-size:14px;">{Step title}</p>
    <p class="sans" style="font-size:13px;opacity:0.7;">{Step description}</p>
  </div>
</div>
```

### Color swatches
For customization or branding slides.
```html
<div style="width:32px;height:32px;border-radius:8px;background:{color};border:1px solid rgba(255,255,255,0.08);"></div>
```

### CTA button (final slide only)
```html
<div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{LIGHT_BG};color:{BRAND_DARK};font-family:'{BODY_FONT}',sans-serif;font-weight:600;font-size:14px;border-radius:28px;">
  {CTA text}
</div>
```

---

## Instagram Frame (Preview Wrapper)

When displaying the carousel, wrap it in an Instagram-style frame so the user can preview the experience:

- **Header:** Avatar (BRAND_PRIMARY circle + logo) + handle + subtitle
- **Viewport:** 4:5 aspect ratio, swipeable/draggable track with all slides
- **Dots:** Small dot indicators below the viewport
- **Actions:** Heart, comment, share, bookmark SVG icons
- **Caption:** Handle + short carousel description + "2 HOURS AGO" timestamp

Include pointer-based swipe/drag interaction for the preview, but the slides themselves are standalone export-ready images.

**The `.ig-frame` must be exactly 420px wide.** The carousel viewport inside it has a 4:5 aspect ratio (420x525px). All slide layouts, font sizes, and spacing are designed for this 420px base width. Do NOT change this width.

---

## Design Principles

1. **Every slide is export-ready** -- arrow and progress bar are part of the slide image, not overlay UI
2. **Light/dark alternation** -- creates visual rhythm and sustains attention across swipes
3. **Heading + body font pairing** -- display font for impact, body font for readability
4. **Brand-derived palette** -- all colors stem from one primary, keeping everything cohesive
5. **Progressive disclosure** -- progress bar fills and arrow guides the user forward
6. **Last slide is special** -- no arrow (signals end), full progress bar, clear CTA
7. **Consistent components** -- same tag style, same list style, same spacing across all slides
8. **Content padding clears UI** -- body text never overlaps with the progress bar or arrow
9. **Iterate fast** -- show the preview, get feedback on specific slides, fix those slides. Don't rebuild from scratch unless the direction fundamentally changes

---

## Output

1. Generate the complete HTML file with all slides, the IG frame wrapper, Google Fonts loaded, and swipe interaction
2. Write to `/tmp/carousel-{topic-slug}.html`
3. Open in browser with `open /tmp/carousel-{topic-slug}.html`
4. Ask the user to review and iterate on specific slides
