---
name: ig-carousel
description: "Generate Instagram carousel posts from a locked design template. Only the content varies; the clay-Joe HPA design stays identical every time. Use when the user says 'carousel', 'IG carousel', 'Instagram carousel', 'make me a carousel', 'slide deck for Instagram', or 'ig-carousel'."
metadata:
  version: 2.0.0
---

# Instagram Carousel Generator

This skill produces Instagram carousels from a **fixed design template**. The design is locked: clay-Joe character, circuit-board background, terminal cards, HPA branding, fonts, colors, layout — none of it changes. The ONLY thing that varies per carousel is the content in `slidesData`.

Do not redesign. Do not ask about brand colors, fonts, or layout. Take the topic, write the content, drop it into the template.

---

## Files

Everything lives in this skill folder (`~/.claude/skills/ig-carousel/`):

- `template.html` — the locked carousel. Self-contained except for the asset folder.
- `assets/` — bundled assets the template needs:
  - `joe-point-trim.png` — Joe pointing up (cover slide only)
  - `joe-present-trim.png`, `joe-pointleft-trim.png`, `joe-thumb-trim.png` — body-slide poses, auto-rotated
  - `hpa-logo.png` — footer avatar logo
  - `recoleta.otf` — Recoleta serif (sub-copy, topbar, kicker)

The template references assets via the relative path `carousel-assets/`. Generation must place that folder next to the output HTML.

---

## How To Generate A Carousel

### Step 1 — Get the topic

The user gives a topic (e.g. "the buyer's consultation", "5 listing mistakes"). If they don't, ask one short question. Don't ask about design.

### Step 2 — Write the content

Open `template.html`, find the **EDIT ZONE** block (clearly marked with comment fences). Rewrite the `slidesData` array. That array is the only thing you touch.

Each slide is an object:

```js
{ cover:true,            // first slide only — big headline, Joe points up
  outro:true,            // last slide only — CTA / comment slide
  kicker:'MOVE 01',      // short orange Recoleta label
  hl:'Set the <span class="o">agenda</span>',  // headline, auto-uppercased; wrap punch words in <span class="o"> for orange
  sub:'Open by framing <b>how the process works.</b>',  // Recoleta serif sub-line; wrap key phrase in <b>
  term:[                 // terminal card lines: [cls, symbol, strong, text]
    ['c','$ ','','move-01 --set-agenda'],   // cls 'c' = orange command
    ['a','→ ','','how the process works'],  // cls 'a' = dim arrow line
    ['ok','✓ ','strong','timeline + next steps'] ] }  // cls 'ok' = green check; 'strong' = white bold
}
```

Rules for content:
- **7 slides is ideal**: cover + 5 body + outro. Slide count can flex (5-9); number and total auto-update.
- **Terminal lines must be ≤ 38 characters** — monospace lines do not wrap. Count before writing.
- 3-5 terminal lines per card. First line is always the `$` command (`c`), last is usually a green `✓` (`ok`).
- Headline: short. Wrap the punch word(s) in `<span class="o">` for orange emphasis.
- Sub-copy: 1-2 lines. Wrap the key phrase in `<b>` for ink-dark emphasis.
- Outro slide: make it a comment CTA — e.g. `Comment <b>"WORD"</b> and I'll send you the breakdown.`
- No em dashes. No AI cliches.

What you do NOT touch: CSS, fonts, the `forEach` render block, `COVER_POSE`/`POSE_CYCLE`, layout JS, asset paths.

### Step 3 — Joe poses are automatic

Do not assign poses. The template auto-rotates:
- Cover slide → `joe-point-trim.png` (points up at the headline)
- Every body/outro slide → cycles `joe-present` → `joe-pointleft` → `joe-thumb`, all facing left at the content.

### Step 4 — Write output + assets

```bash
cp ~/.claude/skills/ig-carousel/template.html /tmp/carousel-{topic-slug}.html
cp -r ~/.claude/skills/ig-carousel/assets /tmp/carousel-assets
```

Then edit `slidesData` inside `/tmp/carousel-{topic-slug}.html` (NOT the skill template — keep the template clean).

The `carousel-assets/` folder must sit next to the HTML and be served over http (the page is http-served; `file://` will not load the assets). Use the Claude Preview MCP server on `/tmp` (localhost:8899).

### Step 5 — Preview and iterate

Load `localhost:8899/carousel-{slug}.html`, wait ~3s for fonts, screenshot. The `layout()` JS flows sub/spark/terminal below the rendered headline after fonts load — check no terminal card collides with the footer. Iterate on specific slides; don't rebuild.

---

## Design (locked — reference only)

- Format: 7 slides, 432×540px each (4:5 → exports to 1080×1350).
- Background: cream `#efe9db`, faint circuit-board SVG texture at .2 opacity.
- Accent: HPA orange `#eb4511`. Ink `#16130d`.
- Fonts: `berthold-block-w1g` heavy display headline (Adobe Typekit kit `opc6jxu`), Recoleta serif for sub/topbar/kicker, JetBrains Mono for terminal + counter.
- Clay-Joe character bottom-right; terminal card to his left; HPA footer lockup with logo + verified tick.
- Per-slide: topbar (HPA mark + `NN / NN` counter), kicker, headline, sub, spark, terminal card, Joe, watermark, footer, swipe arrow, corner brackets.

This design is fixed. If the user wants a different look, that's a new template, not an edit to this one.

---

## Output

1. Copy `template.html` → `/tmp/carousel-{topic-slug}.html` and `assets/` → `/tmp/carousel-assets/`.
2. Rewrite only the `slidesData` EDIT ZONE in the output file.
3. Preview via the http server, verify layout, iterate on specific slides.
