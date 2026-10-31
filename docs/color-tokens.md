# The Critical Vector: color token spec

Status: canon. Every Critical Vector change follows these rules.
Source of truth: `css/main.css` → `:root` (dark, default) and `[data-theme="light"]`.

## 1. Brand palette (canonical names)

| Token | Dark | Light | Role |
|---|---|---|---|
| `--teal` | `#00d4aa` | `#00a688` | Primary brand color. The Workshop. Logo mark, links, "magnitude" in the hero, focus and hover accents. |
| `--blue` | `#60a5fa` | `#1d4ed8` | The Continuum. |
| `--amber` | `#f59e0b` | `#b45309` | The Evidence Locker (the "yellow"). |
| `--red` | `#e84c4c` | `#c53030` | Reserved for alerts, warnings and error flags (danger callouts, injury and transfusion pills). |
| `--purple` | `#a78bfa` | `#7c3aed` | The Stack. Critical-care tags. |

Retired: `--accent` (now `--teal`) and `--accent2` (now `--blue`). Do not reintroduce them.

## 2. Supporting tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `--teal-deep` | `#00d4aa` | `#007a63` | Teal for small text on light surfaces (pills, captions); dark value = `--teal`. Feeds `--tag-teal-text`. Use for any teal text under ~16px (labels, meta, small links, hover states); keep `--teal` for large text, headings, the logo, borders, icons and fills. |
| `--blue-deep` | `#2563eb` | `#1d4ed8` | Only the end stop of the teal→blue gradient stripe (About card). Not a section color. |
| `--red-soft` | `#f87171` | `#dc2626` | From the Flight Deck identity: page title, sidebar dot, section label, post-type, nav hover, htags, badges, sidebar name, list link titles. Not for alerts. |
| `--bg` | `#0a0e14` | `#f4f5f7` | Page background |
| `--surface` | `#111720` | `#ffffff` | Cards, nav, footer |
| `--surface2` | `#182030` | `#f0f2f5` | Nested surfaces |
| `--border` | `rgba(255,255,255,.08)` | `rgba(0,0,0,.08)` | Hairlines |
| `--border-hover` | `rgba(0,212,170,.3)` | `rgba(0,174,136,.35)` | Teal hover border |
| `--text` | `#e8edf5` | `#0f1923` | Body text |
| `--text2` | `#8a9ab5` | `#4a5670` | Secondary text |
| `--text3` | `#4a5670` | `#9aa3b5` | Meta, captions |
| `--tag-alpha` | `10%` | `8%` | Pill background opacity knob |
| `--tag-border-alpha` | `22%` | `20%` | Pill border opacity knob |

### Pill / tag tokens (derived, never hand-typed)

For each hue `<h>` in `teal`, `blue`, `amber`, `purple`, `red-soft`, `red`, plus `neutral` (from `--text2`):

```css
--tag-<h>-bg:     color-mix(in srgb, var(--<h>) var(--tag-alpha), transparent);
--tag-<h>-border: color-mix(in srgb, var(--<h>) var(--tag-border-alpha), transparent);
--tag-<h>-text:   var(--<h>);
```

Exception: `--tag-teal-text` is `var(--teal-deep)`, because light-mode `--teal` (`#00a688`) is too light for small text. Pill rules always set `color: var(--tag-<h>-text)`, never the bare hue.

Defined once in `:root`. `data-theme` sits on `<html>` (the same element), so the set recomputes from the light hue and alpha values automatically. Section pills use their section's set; Flight Deck pills use `red-soft`; alert pills use `red`.

Non-pill tints (callouts, disclaimers) use the same formula with a fixed percentage, e.g. `color-mix(in srgb, var(--amber) 6%, transparent)`.

Typography tokens: `--font-sans: 'Syne'`, `--font-serif: 'Source Serif 4'`. Radii: `--radius: 10px`, `--radius-sm: 6px`.

## 3. Section → color map

| Section | Token | Applies to |
|---|---|---|
| The Continuum | `--blue` | Section h1, labels, nav hover, post-type label, link titles in lists |
| The Workshop | `--teal` | Same |
| The Evidence Locker | `--amber` | Same |
| From the Flight Deck | `--red-soft` | Same, including the page title and homepage sidebar dot |
| The Stack | `--purple` | Same, plus resource names on the Stack page |

Rules:
- Section **labels** always use the section token. `--red` stays reserved for alerts and warnings, so Flight Deck labels use `--red-soft`.
- No label rule hardcodes a hex or needs a `[data-theme="light"]` override; the token carries both modes.
- A post's list label and link title always use its section color (`typeClass = <section>-type`, row class `<section>-row`). The guide/post page itself is not recolored.
- Light mode uses the darker value of the same token. Never hardcode a dark-mode hex in a rule that also renders in light mode.

## 4. Guide pages (library/)

- Each standalone guide defines the same five brand tokens in its own `:root`, with light values in `@media print` (the print light-mode swap).
- Tints: `--t-teal`, `--t-blue`, `--t-red`, `--t-amber`, `--t-purple` (≈7–10% alpha of the brand color) for box and section backgrounds.
- `--hue` (with `--hue-dark`, `--hue-tint`, `--hue-border` in the binders) is a per-section **slot**, not a brand color. A section sets `style="--hue:…"` or a class like `.c-red`, and its borders and labels read `var(--hue, var(--teal))`. Never name this slot after a brand token.

## 5. Naming conventions

- Brand colors are named by hue (`--teal`, `--blue`, `--amber`, `--red`, `--purple`), never by role (`--accent`, `--primary`).
- Shades of a brand hue get a suffix (`--blue-deep`). Tints get a `--t-` prefix. Tag pill sets get a `--tag-<hue>-bg/-text/-border` pattern.
- Component slots that take any color get a neutral name (`--hue`).
- Pill and tint colors are a `color-mix()` of the hue token, never a raw `rgba()` or hex.
- No alias tokens. `--red-tag` and the accent tokens are retired; reference the canonical token directly.

## 6. Known gaps

- Tools and PWAs (POCUS Field Guide, TEE Compass, Hemo Calc, pocket guides) and some standalone library guides keep their own hex palettes. Separate pass.
