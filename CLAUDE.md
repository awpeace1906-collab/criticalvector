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
- Every public page loads `js/stats.js` (GoatCounter, cookieless). The site code lives only in that file. Add the script tag to any new page; never add it under `anesocalc/`, and never link `anesocalc/` from public pages. The encrypted webmaster index is the only place the two connect.
- `webmaster.html` is the back office, reached from the footer `©` (wired in `js/main.js`) and locked by password. Its panels and script are stored encrypted in the page; the plaintext lives in the git-ignored `webmaster-src/`. To edit it, get the password from the site owner, then run `WM_PASS=… node scripts/webmaster-vault.js decrypt`, edit `webmaster-src/`, and `encrypt`. The encrypt step also rebuilds the page's site index (every page in the repo, listed and unlisted, with `anesocalc/` in its own group), so re-run it after adding or removing pages. Passwords count only their letters and digits (case, spaces and dashes are ignored on both sides; keep `normalize()` in the gate and the vault script identical). Never commit `webmaster-src/`, the password, or plaintext of the panels. Even locked, keep secrets and identifying details off it.
- To change the webmaster password without handling it in a session: set the `WM_PASS` secret to the new password, add `WM_PASS_OLD` holding the current one, and let the workflow run once (push or Run workflow); it re-locks the page with `WM_PASS`. Then delete `WM_PASS_OLD`. Passwords need at least 12 letters and digits.
- The `WM_PASS` repository secret lets `.github/workflows/build-posts.yml` re-encrypt the webmaster index on every push to `main`. Re-encrypting with the same password keeps the salt (remembered devices stay signed in) and writes nothing when the index is unchanged.
- Visit counts are private: the webmaster page reads GoatCounter's API with a read-only key stored per device, and the public counter endpoint ("Allow adding visitor counts") stays off. Never put a GoatCounter or GitHub key in the repo or the vault.
- Planned, not built: per-page on/off switches in the webmaster index. Design: a fine-grained GitHub token (this repo, contents read/write) entered per device on the webmaster page commits the choice to a small visibility file; the workflow then adds "off" pages to `_config.yml`'s `exclude` (taking them offline) and drops them from the post lists.
