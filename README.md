# ig-carousel

A Claude Code skill that generates Instagram carousel posts as self-contained HTML. Each slide is a standalone 4:5 image ready for export.

## What it does

Builds a 7-slide swipeable carousel deck from a brand and a topic:
Hero → Problem → Solution → Features → Details → How-to → CTA.
One HTML file, Google Fonts loaded, swipe/arrow/dot navigation, brand-derived 6-token color palette.

## Install

Clone into your Claude Code skills directory:

```bash
git clone https://github.com/Dartagnan98/ig-carousel.git ~/.claude/skills/ig-carousel
```

## Use

Trigger with "carousel", "IG carousel", "make me a carousel", or `/ig-carousel`.

Output is written to `/tmp/carousel-{topic-slug}.html` and opened in the browser for review.
