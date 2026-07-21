# Design System — Tech Setup

## Register

brand (blog)

## Color Strategy

**Restrained** — tinted neutrals + accent ≤10%. Content carries the design.

## Palette (OKLCH)

| Role | Value | Hex (ref) | Usage |
|------|-------|-----------|-------|
| bg | `oklch(1.000 0.000 0)` | `#ffffff` | Body background — pure white |
| surface | `oklch(0.975 0.005 160)` | `~#f8faf8` | Cards, sections, subtle tint |
| ink | `oklch(0.15 0.01 160)` | `~#222623` | Body text — deep, high contrast |
| primary | `oklch(0.45 0.12 160)` | `~#1a6b4a` | Links, badges, primary actions |
| accent | `oklch(0.72 0.10 85)` | `~#c89030` | Hover states, callouts, secondary highlights |
| muted | `oklch(0.55 0.008 160)` | `~#7a827e` | Secondary text, timestamps, categories |

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Body | Geist Sans | 16px base, 1.7 line-height | 400 |
| Headings | Geist Sans | clamp(1.5rem → 2.5rem) | 700 |
| Code | Geist Mono | 14px | 400 |
| Small | Geist Sans | 14px | 400 |

- `text-wrap: balance` on h1-h3
- `text-wrap: pretty` on prose
- Max line length: 65ch

## Spacing Scale

4px base: 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64

## Layout

- Single column, max-width 720px for prose
- 2-column grid on home (desktop): `repeat(auto-fit, minmax(320px, 1fr))`
- Max-width container: 1080px
- Section spacing: 48px vertical

## Components

### Article Card
- Hero image (16:9, rounded-lg, next/image)
- Date + category pill
- Title (h2, semibold)
- Excerpt (muted text)
- No border, no shadow — hierarchy through spacing + type

### Category/Tag Pill
- Small, rounded-full, bg-surface, ink text
- Hover: primary color bg, white text

### Ad Placeholder
- Dashed border, surface bg, muted text
- Min-height reserved, no layout shift

### Footer
- Simple: copyright + nav links
- surface bg, muted text, small type
