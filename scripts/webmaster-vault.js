// webmaster-vault.js
// Encrypts the webmaster page's panels and script into webmaster.html, or
// decrypts them back for editing. The plaintext lives in webmaster-src/,
// which is git-ignored: only ciphertext is ever committed.
//
//   WM_PASS='…' node scripts/webmaster-vault.js decrypt   → webmaster-src/
//   WM_PASS='…' node scripts/webmaster-vault.js encrypt   → webmaster.html
//
// To change the password: decrypt with the old one, encrypt with the new.
// Format must match js/webmaster-gate.js: PBKDF2-SHA256 → AES-256-GCM.

const fs   = require('fs');
const path = require('path');
const { webcrypto: crypto } = require('crypto');

const ROOT   = path.join(__dirname, '..');
const PAGE   = path.join(ROOT, 'webmaster.html');
const SRC    = path.join(ROOT, 'webmaster-src');
const START  = '<!-- WM:VAULT-START -->';
const END    = '<!-- WM:VAULT-END -->';
const ITERATIONS = 600000;

const b64   = buf => Buffer.from(buf).toString('base64');
const unb64 = str => new Uint8Array(Buffer.from(str, 'base64'));

async function deriveKey(password, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function readVault() {
  const page = fs.readFileSync(PAGE, 'utf8');
  const m = page.slice(page.indexOf(START), page.indexOf(END)).match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('No vault found in webmaster.html');
  return JSON.parse(m[1]);
}

// ── Site index ──
// Every page in the repo, grouped, with the ones nothing links to marked
// unlisted. Built at encrypt time and baked into the (encrypted) panel
// script, so none of it appears in the public page. A top-level folder the
// site's own pages never link into is a separate project: it gets its own
// group, named after the folder. App-internal fragments are skipped.
const SKIP = [/^webmaster-src\//, /^webmaster\.html$/, /_PWA\/(?!index\.html$)/, /^node_modules\//];
const SECTION_NAMES = { continuum: 'The Continuum', workshop: 'The Workshop', locker: 'The Evidence Locker', flightdeck: 'From the Flight Deck' };

function htmlFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

function titleOf(file) {
  const m = fs.readFileSync(path.join(ROOT, file), 'utf8').match(/<title>([^<]*)<\/title>/i);
  const t = m ? m[1].replace(/\s*[—|–-]\s*(The\s+)?Critical\s*Vector\s*$/i, '').replace(/^(The\s+)?Critical\s*Vector\s*[—|–-]\s*/i, '').trim() : '';
  return t || file;
}

function buildSiteIndex() {
  const all = htmlFiles(ROOT);
  const pages = all.filter(f => !SKIP.some(r => r.test(f)));
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));

  const linked = new Set(posts.map(p => p.file));
  for (const f of all.filter(f => !/^webmaster/.test(f))) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const [, href] of html.matchAll(/href="([^"#?]+)/g)) {
      if (/^(https?:|mailto:|data:)/.test(href)) continue;
      let target = path.posix.normalize(path.posix.join(path.posix.dirname(f), href));
      if (href.endsWith('/') || fs.existsSync(path.join(ROOT, target)) && fs.statSync(path.join(ROOT, target)).isDirectory()) target = path.posix.join(target, 'index.html');
      linked.add(target);
    }
  }

  const entry = f => ({ path: f, title: titleOf(f) });
  // Folders reached only from inside themselves are separate projects.
  const siteLinks = new Set();
  for (const f of all.filter(f => !f.includes('/') && !/^webmaster/.test(f)).concat(posts.map(p => p.file))) {
    for (const [, href] of fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/href="([^"#?:]+)/g)) {
      siteLinks.add(path.posix.normalize(path.posix.join(path.posix.dirname(f), href)).split('/')[0]);
    }
  }
  const separate = [...new Set(pages.filter(f => f.includes('/')).map(f => f.split('/')[0]))]
    .filter(d => !siteLinks.has(d) && !posts.some(p => p.file.startsWith(d + '/')) && !/^unlisted$/.test(d)).sort();
  const inSeparate = f => separate.some(d => f.startsWith(d + '/'));
  const listed = pages.filter(f => linked.has(f) && !inSeparate(f));
  const groups = [
    { name: 'Site pages', items: listed.filter(f => !f.includes('/')).map(entry) },
    { name: 'Apps', items: listed.filter(f => /_PWA\/index\.html$/.test(f)).map(entry) },
    { name: 'Tools', items: listed.filter(f => f.startsWith('tools/')).map(entry) },
  ];
  for (const [key, name] of Object.entries(SECTION_NAMES)) {
    const items = posts.filter(p => p.section === key).sort((a, b) => b.date.localeCompare(a.date))
      .map(p => ({ path: p.file, title: p.title, meta: p.meta }));
    groups.push({ name, section: key, items });
  }
  for (const dir of separate) {
    groups.push({ name: dir + '/', items: pages.filter(f => f.startsWith(dir + '/'))
      .map(f => ({ ...entry(f), meta: f + (linked.has(f) ? '' : ' · unlisted') })) });
  }
  const unlisted = pages.filter(f => !inSeparate(f) && !linked.has(f)).map(entry);
  return { built: new Date().toISOString().slice(0, 10), groups, unlisted };
}

async function encrypt(password) {
  const html = fs.readFileSync(path.join(SRC, 'panel.html'), 'utf8');
  let js = fs.readFileSync(path.join(SRC, 'panel.js'), 'utf8');
  const index = buildSiteIndex();
  js = js.replace(/^  const SITE_INDEX = .*$/m, () => '  const SITE_INDEX = ' + JSON.stringify(index) + ';');
  fs.writeFileSync(path.join(SRC, 'panel.js'), js);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt, ITERATIONS);
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ html, js })));
  const vault = { v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };

  const page = fs.readFileSync(PAGE, 'utf8');
  const block = `${START}\n  <script type="application/json" id="wmVault">${JSON.stringify(vault)}</script>\n  ${END}`;
  fs.writeFileSync(PAGE, page.slice(0, page.indexOf(START)) + block + page.slice(page.indexOf(END) + END.length));
  console.log(`Encrypted ${html.length + js.length} characters into webmaster.html (index: ${index.groups.reduce((n, g) => n + g.items.length, 0)} listed, ${index.unlisted.length} unlisted)`);
}

async function decrypt(password) {
  const v = readVault();
  const key = await deriveKey(password, unb64(v.salt), v.iter);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, key, unb64(v.ct));
  } catch (e) {
    throw new Error('Wrong password');
  }
  const { html, js } = JSON.parse(new TextDecoder().decode(plain));
  fs.mkdirSync(SRC, { recursive: true });
  fs.writeFileSync(path.join(SRC, 'panel.html'), html);
  fs.writeFileSync(path.join(SRC, 'panel.js'), js);
  console.log('Decrypted into webmaster-src/ (git-ignored)');
}

const [cmd] = process.argv.slice(2);
const password = process.env.WM_PASS;
if (!password || !['encrypt', 'decrypt'].includes(cmd)) {
  console.error("Usage: WM_PASS='…' node scripts/webmaster-vault.js encrypt|decrypt");
  process.exit(1);
}
(cmd === 'encrypt' ? encrypt : decrypt)(password).catch(e => { console.error(e.message); process.exit(1); });
