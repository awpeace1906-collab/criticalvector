// ── WEBMASTER PAGE ──
// Reads public GoatCounter counts (the "visitor counter" JSON endpoint) and
// posts.json. Nothing here is secret: the page is unlinked and unindexed,
// not protected.
(function () {
  const stats = window.CV_STATS;
  // Filled in by scripts/webmaster-vault.js at encrypt time, inside the
  // encrypted copy only. Keep on one line and null in this template.
  const SITE_INDEX = null;
  const $ = id => document.getElementById(id);

  const SECTIONS = [
    { key: 'continuum',  name: 'The Continuum',        page: 'continuum.html' },
    { key: 'workshop',   name: 'The Workshop',         page: 'workshop.html' },
    { key: 'locker',     name: 'The Evidence Locker',  page: 'locker.html' },
    { key: 'flightdeck', name: 'From the Flight Deck', page: 'flightdeck.html' },
    { key: 'stack',      name: 'The Stack',            page: 'stack.html' },
  ];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // posts.json titles and metas are HTML-encoded (&amp;), like the section
  // pages that render them; decode before setting textContent.
  function decode(s) {
    if (s == null || !/&/.test(s)) return s;
    const t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  function row(href, name, sub, nameCls, count) {
    name = decode(name);
    sub = decode(sub);
    const a = el('a', 'rrow');
    a.href = href;
    const box = el('div');
    box.appendChild(el('div', 'rname' + (nameCls ? ' sec-name ' + nameCls : ''), name));
    if (sub) box.appendChild(el('div', 'rsub', sub));
    a.appendChild(box);
    if (count != null) a.appendChild(el('span', 'wm-count', count));
    return a;
  }

  // ── Visits ──
  // Read through GoatCounter's private API with a read-only key that stays
  // on this device (localStorage); the public counter endpoint is not used,
  // so with "Allow adding visitor counts" off, only the GoatCounter
  // dashboard and this page can see the numbers.
  const KEY_STORE = 'cv-goatcounter-key';
  const getKey = () => { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } };
  const setKey = k => { try { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE); } catch (e) {} };
  const fmt = n => n.toLocaleString('en-US');
  const SITE_START = '2026-01-01T00:00:00Z';

  // GoatCounter wants times rounded to the hour.
  function hour(d, up) {
    const t = new Date(d);
    if (up && (t.getUTCMinutes() || t.getUTCSeconds())) t.setUTCHours(t.getUTCHours() + 1);
    t.setUTCMinutes(0, 0, 0);
    return t.toISOString().replace('.000', '');
  }
  function since(days) {
    if (days === 'all') return SITE_START;
    const d = new Date();
    if (days === 'today') d.setHours(0, 0, 0, 0); else d.setDate(d.getDate() - Number(days));
    return hour(d);
  }

  // GoatCounter allows 4 API requests per second, so requests go out one
  // at a time with a gap, and a 429 waits for the limit to reset and retries.
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let queue = Promise.resolve();
  function api(path, params) {
    const q = new URLSearchParams(Object.assign({ end: hour(Date.now(), true) }, params));
    const run = async () => {
      for (let attempt = 0; ; attempt++) {
        const r = await fetch(stats.endpoint + '/api/v0/' + path + '?' + q, {
          headers: { Authorization: 'Bearer ' + getKey(), 'Content-Type': 'application/json' },
        });
        if (r.status === 429 && attempt < 4) {
          const reset = parseFloat(r.headers.get('X-Rate-Limit-Reset'));
          await sleep((reset > 0 ? reset : 1) * 1000 + 100);
          continue;
        }
        if (!r.ok) throw r.status;
        return r.json();
      }
    };
    const result = queue.then(run);
    queue = result.catch(() => {}).then(() => sleep(300));
    return result;
  }

  // All-time visitors per path, paging through /stats/hits.
  async function hitsByPath() {
    const counts = {};
    let exclude = [];
    for (let page = 0; page < 10; page++) {
      const params = { start: SITE_START, limit: 100 };
      if (exclude.length) params.exclude_paths = exclude.join(',');
      const res = await api('stats/hits', params);
      (res.hits || []).forEach(h => { counts[h.path] = (counts[h.path] || 0) + h.count; exclude.push(h.path_id); });
      if (!res.more || !(res.hits || []).length) break;
    }
    return counts;
  }

  function showKeyForm(message) {
    $('wmStatus').textContent = message;
    $('wmKeyForm').hidden = false;
    $('wmForgetKey').hidden = true;
  }

  function loadVisits() {
    const status = $('wmStatus');
    if (!stats) { status.textContent = 'Counting is off: set GOATCOUNTER_CODE in js/stats.js.'; return; }
    $('wmDashboard').href = stats.endpoint;

    $('wmKeyForm').addEventListener('submit', e => {
      e.preventDefault();
      setKey($('wmKey').value.trim());
      $('wmKey').value = '';
      $('wmKeyForm').hidden = true;
      fetchVisits();
    });
    $('wmForgetKey').addEventListener('click', () => { setKey(''); location.reload(); });
    fetchVisits();
  }

  function fetchVisits() {
    const status = $('wmStatus');
    if (!getKey()) {
      showKeyForm('Counts are private. Add a read-only GoatCounter API key (GoatCounter → Settings → API) to see them on this device.');
      return;
    }
    status.textContent = 'Loading counts…';
    $('wmForgetKey').hidden = false;

    const tiles = [...document.querySelectorAll('[data-days]')];
    Promise.allSettled(tiles.map(t => api('stats/total', { start: since(t.dataset.days) }).then(j => { t.textContent = fmt(j.total || 0); })))
      .then(res => {
        const failed = res.find(r => r.status === 'rejected');
        if (failed && failed.reason === 401) { setKey(''); showKeyForm('GoatCounter rejected that key. Check it has "Read statistics" permission, then add it again.'); return; }
        status.textContent = failed
          ? 'Counts unavailable right now (GoatCounter error ' + failed.reason + ').'
          : 'Visitors counted by GoatCounter (' + stats.code + '): no cookies, no personal data. Private to your GoatCounter login and this page.';
      });

    const pages = [{ name: 'Home', paths: ['/', '/index.html'], href: 'index.html' }]
      .concat(SECTIONS.map(s => ({ name: s.name, paths: ['/' + s.page], href: s.page, cls: s.key + '-name' })))
      .concat([{ name: 'About', paths: ['/about.html'], href: 'about.html' }]);
    const list = $('wmPages');
    list.textContent = '';
    const rows = pages.map(p => { const r = row(p.href, p.name, null, p.cls, '—'); list.appendChild(r); return r; });
    hitsByPath().then(counts => {
      pages.forEach((p, i) => { rows[i].querySelector('.wm-count').textContent = fmt(p.paths.reduce((n, path) => n + (counts[path] || 0), 0)); });
    }).catch(() => {});
  }

  // Opting out uses GoatCounter's own switch: count.js skips a browser
  // whose localStorage has skipgc = "t".
  function skipToggle() {
    const btn = $('wmSkip');
    const read = () => { try { return localStorage.getItem('skipgc') === 't'; } catch (e) { return false; } };
    const paint = () => { btn.textContent = 'Count my visits on this device: ' + (read() ? 'Off' : 'On'); };
    btn.addEventListener('click', () => {
      try { read() ? localStorage.removeItem('skipgc') : localStorage.setItem('skipgc', 't'); } catch (e) {}
      paint();
    });
    paint();
  }

  // ── Content ──
  function loadContent() {
    fetch('posts.json').then(r => r.json()).then(posts => {
      const sec = $('wmSections');
      SECTIONS.filter(s => s.key !== 'stack').forEach(s => {
        const mine = posts.filter(p => p.section === s.key);
        const newest = mine.map(p => p.date).sort().pop();
        sec.appendChild(row(s.page, s.name, newest ? 'Newest: ' + newest : null, s.key + '-name', String(mine.length)));
      });
      const latest = $('wmLatest');
      posts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).forEach(p => {
        latest.appendChild(row(p.file, p.title, p.meta, p.section + '-name'));
      });
    }).catch(() => { $('wmSections').appendChild(el('div', 'wm-note', 'posts.json could not be read.')); });
  }

  // ── Site index ──
  // Every page, listed and unlisted, grouped and collapsible.
  function group(name, items, opts) {
    const d = el('details', 'wm-group');
    if (opts.open) d.open = true;
    const sum = el('summary', 'rrow');
    sum.appendChild(el('div', 'rname' + (opts.cls ? ' sec-name ' + opts.cls : ''), name));
    sum.appendChild(el('span', 'wm-count', String(items.length)));
    d.appendChild(sum);
    items.forEach(i => d.appendChild(row(i.path, i.title, i.meta || i.path)));
    return d;
  }

  function loadIndex() {
    const box = $('wmIndex');
    if (!SITE_INDEX) { box.appendChild(el('div', 'wm-note', 'Index not built: re-run the vault encrypt step.')); return; }

    const search = el('div', 'wm-search');
    const input = el('input', 'wm-input');
    input.type = 'search';
    input.placeholder = 'Search ' + (SITE_INDEX.unlisted.length + SITE_INDEX.groups.reduce((n, g) => n + g.items.length, 0)) + ' pages by title, type or path';
    input.setAttribute('aria-label', 'Search the site index');
    const found = el('div', 'wm-label');
    search.append(input, found);
    box.appendChild(search);

    const groups = [group('Unlisted', SITE_INDEX.unlisted, { open: true })]
      .concat(SITE_INDEX.groups.map(g => group(g.name, g.items, { cls: g.section ? g.section + '-name' : '' })));
    groups.forEach(g => {
      g.dataset.wasOpen = g.open ? '1' : '';
      g.querySelectorAll('a.rrow').forEach(a => { a.dataset.find = (a.textContent + ' ' + a.getAttribute('href')).toLowerCase(); });
      box.appendChild(g);
    });
    box.appendChild(el('div', 'wm-note', 'Index built ' + SITE_INDEX.built + '. Unlisted means no page on the site links to it.'));

    // Every word must match somewhere in the title, type line or path.
    // Groups with hits open; empty groups hide; clearing restores the view.
    input.addEventListener('input', () => {
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      let hits = 0;
      groups.forEach(g => {
        let n = 0;
        g.querySelectorAll('a.rrow').forEach(a => {
          const show = words.every(w => a.dataset.find.includes(w));
          a.hidden = !show;
          if (show) n++;
        });
        g.querySelector('.wm-count').textContent = String(n);
        g.hidden = words.length > 0 && n === 0;
        g.open = words.length ? n > 0 : !!g.dataset.wasOpen;
        hits += n;
      });
      found.textContent = words.length ? (hits === 1 ? '1 page' : hits + ' pages') : '';
    });
  }

  // ── Housekeeping ──
  function loadBuild() {
    const css = document.querySelector('link[href*="main.css"]');
    const ver = css ? (css.getAttribute('href').split('?v=')[1] || '—') : '—';
    fetch('index.html', { method: 'HEAD', cache: 'no-store' })
      .then(r => r.headers.get('last-modified'))
      .then(lm => {
        $('wmBuild').textContent = 'Live site last deployed ' + (lm ? new Date(lm).toLocaleString() : 'at an unknown time') + ' · stylesheet v' + ver;
      })
      .catch(() => { $('wmBuild').textContent = 'Stylesheet v' + ver; });
  }

  // Clears service workers and caches for this site on this device only,
  // for when an installed app (POCUS, TEE, Hemo Calc) shows an old version.
  function cacheButton() {
    const btn = $('wmCaches');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      let regs = 0, stores = 0;
      try {
        if ('serviceWorker' in navigator) {
          const rs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(rs.map(r => r.unregister()));
          regs = rs.length;
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          stores = keys.length;
        }
        btn.textContent = 'Cleared ' + regs + ' app worker(s) and ' + stores + ' cache(s). Reopen the apps.';
      } catch (e) {
        btn.textContent = 'Could not clear caches on this browser.';
      }
    });
  }

  loadVisits();
  skipToggle();
  loadContent();
  loadIndex();
  loadBuild();
  cacheButton();
})();
