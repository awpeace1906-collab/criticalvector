// ── VISIT COUNTER ──
// Cookieless page counts through GoatCounter. GOATCOUNTER_CODE is the site
// code chosen at goatcounter.com; an empty string turns counting off.
// Pages marked <html data-no-count> (the webmaster page) load the config
// without counting themselves. A browser opted out from the webmaster page
// (localStorage "skipgc") is skipped by count.js itself.
(function () {
  const GOATCOUNTER_CODE = 'criticalvector';
  if (!GOATCOUNTER_CODE) return;

  const endpoint = 'https://' + GOATCOUNTER_CODE + '.goatcounter.com';
  window.CV_STATS = { code: GOATCOUNTER_CODE, endpoint: endpoint };

  if (document.documentElement.hasAttribute('data-no-count')) return;

  // Pinned release with Subresource Integrity, as GoatCounter recommends:
  // the browser refuses the script if its contents ever change. To upgrade,
  // update the version and the sha384 hash together.
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.v5.js';
  s.integrity = 'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ';
  s.crossOrigin = 'anonymous';
  s.dataset.goatcounter = endpoint + '/count';
  document.head.appendChild(s);
})();
