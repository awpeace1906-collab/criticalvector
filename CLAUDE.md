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

- `_config.yml` keeps repo-only files (this file, `README.md`, `docs/`, `scripts/`) off the published site. Add any new maintainer-only file or folder to its `exclude` list.

- Post lists, homepage "Latest from each section" and sidebar counts are generated from `posts.json` by `scripts/build-post-lists.js`. Edit `posts.json`, then run the script.
- Bump the `?v=` query on `css/main.css` / `css/post.css` links when those files change.
- The Workshop is built from data: `workshop.json` holds the hand-written categories and items, Clinical References come from `posts.json` (section `workshop`). `scripts/build-workshop.js` (run by `build-post-lists.js`, and by the workflow on every push) writes the `workshop.html` overview (4 examples per category, a "See all" pill), the `workshop-<category>.html` subpages and the search index. Never hand-edit those lists; add or move items in the data and run `node scripts/build-post-lists.js`.
- The homepage search (bottom of `index.html`, `js/site-search.js`) reads `search-index.json`, written by `scripts/build-search.js` (run by `build-post-lists.js` and the workflow): every post and library guide, the Workshop's hand-written items, every Stack resource and the section pages, with keywords from each page. Never add unlisted pages or `anesocalc/` to it. The Workshop search covers Workshop entries only.
- Printables (Workshop › Hard Copy): each gets `printables/<name>.html` (previews, download table, print tips) and a folder `printables/<name>/` with the PDFs (`<name>_<size>_<orientation>_<theme>.pdf`, metadata title set, no personal metadata), WebP previews and an all-files zip. Download links carry `data-goatcounter-click` so downloads show as GoatCounter events. Add it to the `hard-copy` category in `workshop.json`.
- Every public page loads `js/stats.js` (GoatCounter, cookieless). The site code lives only in that file. Add the script tag to any new page; never add it under `anesocalc/`, and never link `anesocalc/` from public pages. The encrypted webmaster index is the only place the two connect.
- `webmaster.html` is the back office, reached from the footer `©` (wired in `js/main.js`) and locked by the owner's password. Edit its panels in `webmaster/panel.html` and `webmaster/panel.js`: templates with no secrets, kept off the published site by `_config.yml`. Keep `SITE_INDEX` `null` in the template. On every push to `main`, `.github/workflows/build-posts.yml` runs `scripts/webmaster-vault.js encrypt` with the `WM_PASS` repository secret: it adds the generated site index (every page in the repo, listed and unlisted, with `anesocalc/` in its own group) and encrypts the result into `webmaster.html`. Sessions never need the password; never change the encrypted vault block in `webmaster.html` from a session (editing its unencrypted shell, such as the stylesheet `?v=`, is fine), and never put the password, keys or a generated index in the repo.
- Passwords count only their letters and digits (at least 12; case, spaces and dashes are ignored on both sides; keep `normalize()` in `js/webmaster-gate.js` and the vault script identical). The salt is kept while the password is unchanged, so remembered devices stay signed in, and nothing is written when nothing changed.
- To change the password: set `WM_PASS` to the new one and add `WM_PASS_OLD` holding the current one; the next run re-locks the page with `WM_PASS`. Then delete `WM_PASS_OLD`. Without it, a `WM_PASS` that doesn't open the page is refused.
- GoatCounter's API allows 4 requests per second: the panel sends requests one at a time and retries a 429 after the reset.
- Visit counts are private: the webmaster page reads GoatCounter's API with a read-only key stored per device, and the public counter endpoint ("Allow adding visitor counts") stays off. Never put a GoatCounter or GitHub key in the repo or the vault.
- Planned, not built: per-page on/off switches in the webmaster index. Design: a fine-grained GitHub token (this repo, contents read/write) entered per device on the webmaster page commits the choice to a small visibility file; the workflow then adds "off" pages to `_config.yml`'s `exclude` (taking them offline) and drops them from the post lists.
