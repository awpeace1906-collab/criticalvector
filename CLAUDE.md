# The Critical Vector: rules for working in this repo

## Color tokens (canon)

`docs/color-tokens.md` is the source of truth for every color on the site. Read it before touching CSS or inline styles.

- Use only the canonical tokens: `--teal`, `--blue`, `--amber`, `--red`, `--purple`, plus the documented shades (`--teal-deep`, `--blue-deep`, `--red-soft`) and the derived `--tag-<hue>-*` set.
- No raw hex or `rgba()` in label, pill or tint rules. Tints are `color-mix(in srgb, var(--<hue>) …, transparent)`.
- No alias tokens. `--accent`, `--accent2` and `--red-tag` are retired; never reintroduce them.
- Section identity (titles, labels, post-types, list titles, sidebar names and dots, nav hover) uses the section token: Continuum `--blue`, Workshop `--teal`, Evidence Locker `--amber`, Flight Deck `--red-soft`, Stack `--purple`.
- `--red` is reserved for alerts, warnings and error flags.
- Teal text under ~16px uses `--teal-deep`; pill text uses `var(--tag-<hue>-text)`.
- Light mode comes from the token, not from per-rule `[data-theme="light"]` overrides.
- `--hue` is a per-section slot in standalone guides, not a brand color.
- Before pushing a color change, compare computed colors in dark and light against `main` and report every element that moves.

## Other conventions

- Post lists, homepage "Latest from each section" and sidebar counts are generated from `posts.json` by `scripts/build-post-lists.js`. Edit `posts.json`, then run the script.
- Bump the `?v=` query on `css/main.css` / `css/post.css` links when those files change.
- Every public page loads `js/stats.js` (GoatCounter, cookieless). The site code lives only in that file. Add the script tag to any new page; never add it under `anesocalc/`.
- `webmaster.html` is the back office, reached from the footer `©` (wired in `js/main.js`) and locked by password. Its panels and script are stored encrypted in the page; the plaintext lives in the git-ignored `webmaster-src/`. To edit it, get the password from the site owner, then run `WM_PASS=… node scripts/webmaster-vault.js decrypt`, edit `webmaster-src/`, and `encrypt`. Never commit `webmaster-src/`, the password, or plaintext of the panels. Even locked, keep secrets and identifying details off it.
