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

async function encrypt(password) {
  const html = fs.readFileSync(path.join(SRC, 'panel.html'), 'utf8');
  const js   = fs.readFileSync(path.join(SRC, 'panel.js'), 'utf8');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt, ITERATIONS);
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ html, js })));
  const vault = { v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };

  const page = fs.readFileSync(PAGE, 'utf8');
  const block = `${START}\n  <script type="application/json" id="wmVault">${JSON.stringify(vault)}</script>\n  ${END}`;
  fs.writeFileSync(PAGE, page.slice(0, page.indexOf(START)) + block + page.slice(page.indexOf(END) + END.length));
  console.log(`Encrypted ${html.length + js.length} characters into webmaster.html`);
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
