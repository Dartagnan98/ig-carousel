---
name: ig-carousel
description: "Generate Instagram carousel posts from a locked design template. Pick one of three styles (clay-Joe terminal, blue-asterisk, orange-machine); only the content varies, the design stays identical every time. Use when the user says 'carousel', 'IG carousel', 'Instagram carousel', 'make me a carousel', 'slide deck for Instagram', or 'ig-carousel'."
metadata:
  version: 3.1.0
---

# Instagram Carousel Generator

This skill produces Instagram carousels from **fixed design templates**. The design is locked — fonts, colors, layout never change. The ONLY thing that varies per carousel is the content.

Do not redesign. Do not ask about brand colors, fonts, or layout. Pick the template, write the content, render.

---

## Templates

Three locked styles. **Ask the user which one (or pick by fit) before writing content.**

| Style | File | Render with | Edit |
|---|---|---|---|
| **clay-joe** — HPA terminal (cream, circuit board, clay-Joe, terminal cards) | `template.html` | `export.mjs` (http-served, see below) | `slidesData` array |
| **blue-asterisk** — electric-blue, heavy grotesk headline, asterisk motif, fanned HOOK/VALUE/FRAME/PROOF/CTA cards, "swipe to steal" | `carousel-blue.html` | `render.mjs` (file path) | slide HTML inline |
| **orange-machine** — cream + rounded frame, orange highlight boxes, doc-card fan, pixel mascot, serif byline | `carousel-orange.html` | `render.mjs` (file path) | slide HTML inline |

**blue-asterisk / orange-machine** are native 1080×1350 multi-slide files (`.slide` divs), self-contained (fonts in `assets/*.woff2`). Both can render **with or without the host avatar** (Dartagnan's tattooed cartoon, on the cover + CTA of blue, the CTA of orange — poses in `assets/pose-*.png`).

**Invocation — pick template + avatar variant by argument:**
```bash
cd ~/.claude/skills/ig-carousel
node render.mjs blue                  # blue, WITH avatar
node render.mjs blue --no-avatar      # blue, WITHOUT avatar (clean reference look)
node render.mjs orange                # orange, WITH avatar
node render.mjs orange --no-avatar    # orange, WITHOUT avatar
node render.mjs orange --no-avatar /tmp/out   # custom out dir
```
`--no-avatar` adds `body.no-avatar` which hides every `.me` element. Outputs `slide-01.jpg … slide-NN.jpg` at 1080×1350, no http server needed.

To change the **content**: copy the template (`cp carousel-blue.html my-deck.html`), edit the headline/sub/bullets/CTA text inside each `.slide` (keep structure + classes), then `node render.mjs my-deck.html [--no-avatar]`.

The rest of this doc covers **clay-joe** (`template.html` + `slidesData` + `export.mjs`).

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

### Step 6 — Export to images

Once the user is happy with the preview, export every slide to an Instagram-ready JPEG (1080×1350, 4:5):

```bash
node ~/.claude/skills/ig-carousel/export.mjs \
  "http://localhost:8899/carousel-{slug}.html" \
  /tmp/carousel-export
```

`export.mjs` uses Playwright. It renders each `.slide` at exactly 1080×1350 JPEG quality 95 and writes `slide-01.jpg … slide-NN.jpg`. The carousel URL MUST be http (assets are http-served). It prints a JSON list of the written files.

### Step 7 — Post to Instagram via Composio

Only do this when the user asks to post/publish. Posting is public and irreversible.

1. **Connect the account** (once): if a later command says the toolkit is not connected, run `composio link instagram`.
2. **Resolve the publishing account id:**
   ```bash
   composio execute INSTAGRAM_GET_USER_INFO -d '{}'
   ```
   Take the numeric Instagram Business account id → `ig_user_id`.
3. **Draft the caption.** Match the carousel: short hook, the 5 moves or topic beats, then the outro CTA wording (e.g. `Comment "FRAMEWORK" 👇`). Max 2,200 chars, max 30 hashtags.
4. **Confirm before posting (MANDATORY).** Open the exported slides so the user can see them:
   ```bash
   open /tmp/carousel-export/*.jpg
   ```
   Then ask: *"This posts to @<account>. Reply POST to submit, or tell me what to change."* Wait for an explicit **POST** before publishing — never on assumed permission or a vague "looks good". If they change anything, re-render and ask again.
5. **Create the carousel container** (2–10 slides, ordered):
   ```bash
   composio execute INSTAGRAM_CREATE_CAROUSEL_CONTAINER -d '{
     "ig_user_id": "<id>",
     "caption": "<caption>",
     "child_image_files": [
       "/tmp/carousel-export/slide-01.jpg",
       "/tmp/carousel-export/slide-02.jpg",
       "... in slide order ..."
     ]
   }'
   ```
   Store `response.data.id` as `creation_id`.
6. **Publish** — ONLY after the Step 4 gate passed with an explicit "POST". If you're unsure whether it passed, stop and re-run the gate.
   ```bash
   composio execute INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH -d '{
     "ig_user_id": "<id>",
     "creation_id": "<creation_id>"
   }'
   ```
   Report the published `permalink` back to the user.

Pitfalls: slides must be JPEG, 4:5 aspect (the exporter already enforces 1080×1350); a single bad asset fails the whole container; publishing the same `creation_id` twice returns 409 — make a fresh container to retry; if near the publishing limit, `INSTAGRAM_GET_IG_USER_CONTENT_PUBLISHING_LIMIT` shows headroom.

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
4. On request: export to JPEGs, then post to Instagram via Composio — but ONLY after **opening the slides for the user to see and getting an explicit "POST"** (Step 7.4). Never publish on a vague "looks good".
