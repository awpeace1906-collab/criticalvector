// ── WEBMASTER SIGN-IN ──
// The page's panels and script are stored AES-256-GCM encrypted in the
// #wmVault block (see scripts/webmaster-vault.js). The password derives the
// key in the browser; nothing readable exists without it. "Remember this
// device" keeps the derived key in IndexedDB as a non-extractable CryptoKey,
// so the password itself is never stored. Lock forgets it.
(function () {
  const $ = id => document.getElementById(id);
  const vaultEl = $('wmVault');
  if (!vaultEl) return;
  const vault = JSON.parse(vaultEl.textContent);
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  // ── remembered key (IndexedDB) ──
  const DB = 'cv-webmaster', STORE = 'keys', ID = 'vault-key';
  function db() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => res(req && req.result);
      tx.onerror = () => rej(tx.error);
    });
  }
  const remember = key => idb('readwrite', s => s.put(key, ID)).catch(() => {});
  const recall   = () => idb('readonly', s => s.get(ID)).catch(() => null);
  const forget   = () => idb('readwrite', s => s.delete(ID)).catch(() => {});

  // Only letters and digits count: case, spaces and dashes (including the
  // long dashes phone keyboards substitute) are ignored. Must match
  // normalize() in scripts/webmaster-vault.js.
  const normalize = p => String(p).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');

  async function deriveKey(password) {
    password = normalize(password);
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(vault.salt), iterations: vault.iter },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }

  async function open(key) {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) }, key, unb64(vault.ct));
    const { html, js } = JSON.parse(new TextDecoder().decode(plain));
    const main = $('wmMain');
    main.innerHTML = html;

    const lock = document.createElement('section');
    lock.className = 'sidebar-card';
    lock.innerHTML = '<div class="wm-actions"><button class="wm-btn" type="button">Lock and forget this device</button></div>';
    lock.querySelector('button').addEventListener('click', async () => { await forget(); location.reload(); });
    main.appendChild(lock);

    const s = document.createElement('script');
    s.textContent = js;
    document.body.appendChild(s);
  }

  const form = $('wmLogin');
  const msg  = $('wmLoginMsg');
  const btn  = form.querySelector('button');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    msg.textContent = 'Unlocking…';
    // Read the form before open() replaces it with the panels.
    const password = $('wmPass').value;
    const keep = $('wmRemember').checked;
    let key;
    try {
      key = await deriveKey(password);
      await open(key);
    } catch (err) {
      msg.textContent = 'Wrong password.';
      btn.disabled = false;
      $('wmPass').select();
      return;
    }
    if (keep) await remember(key);
  });

  // A remembered key opens the page straight away; a stale one (after the
  // vault was re-encrypted) is dropped and the form stays.
  recall().then(key => {
    if (!key) return;
    open(key).catch(forget);
  });
})();
