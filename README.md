# ig-carousel

A Claude Code skill that generates Instagram carousel posts from a locked design template. Each slide is a standalone 4:5 image ready for export.

## What it does

Builds a swipeable carousel deck from a fixed design. The design — clay-Joe character, circuit-board background, terminal cards, HPA branding, fonts, colors — never changes. Only the content in `slidesData` varies per carousel. Joe's poses auto-rotate through the bundled PNGs.

## Install

Clone into your Claude Code skills directory:

```bash
git clone https://github.com/Dartagnan98/ig-carousel.git ~/.claude/skills/ig-carousel
```

## Use

Trigger with "carousel", "IG carousel", "make me a carousel", or `/ig-carousel`.

The skill copies `template.html` → `/tmp/carousel-{topic-slug}.html` and `assets/` → `/tmp/carousel-assets/`, rewrites only the content, and previews over http.

## Files

- `template.html` — the locked carousel design
- `assets/` — Joe pose PNGs, HPA logo, Recoleta font
- `SKILL.md` — generation instructions
