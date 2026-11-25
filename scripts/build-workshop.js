// build-workshop.js
// Builds the Workshop from workshop.json (hand-written categories) and
// posts.json (Clinical References = section "workshop"):
//   - workshop.html: per-category overview (title links to the subpage,
//     a few example links, a "See all" pill) plus the search index
//   - workshop-<category>.html: one subpage per category, every item
// Search keywords come from each local target page: its <title>, meta
// description and h1–h3 headings. Run by scripts/build-post-lists.js.

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const START    = '<!-- CV:WORKSHOP-START -->';
const END      = '<!-- CV:WORKSHOP-END -->';
const EXAMPLES = 4;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decode = s => String(s)
  .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&middot;/g, '·')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function keywordsFor(href) {
  if (/^https?:/.test(href)) return '';
  let file = path.join(ROOT, href.split('#')[0]);
  if (href.endsWith('/')) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return '';
  const raw = fs.readFileSync(file, 'utf8');
  const html = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  const bits = [];
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (t) bits.push(text(t[1]));
  const d = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
  if (d) bits.push(decode(d[1]));
  for (const [, h] of html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) bits.push(text(h));
  // Pages that draw their content from script data (the pocket guides,
  // the apps) have few headings: index their short section labels too.
  if (bits.length < 6) {
    for (const [, v] of raw.matchAll(/\b(?:label|title|name)\s*:\s*["']([^"'<>{}$\n]{3,60})["']/g)) bits.push(text(v));
  }
  const seen = new Set();
  return bits.filter(b => b && !seen.has(b.toLowerCase()) && seen.add(b.toLowerCase())).join(' · ').slice(0, 1500);
}

function row(item, typeLabel) {
  return `      <a href="${esc(item.href)}" class="post-row workshop-row">
        <div class="post-info">
          <div class="post-type workshop-type">${esc(typeLabel || item.type)}</div>
          <div class="post-title">${esc(item.title)}</div>
          <div class="post-meta">${esc(item.meta)}</div>
        </div>
        <span class="post-arrow">›</span>
      </a>`;
}

function shell(workshopHtml) {
  const head = workshopHtml.slice(0, workshopHtml.indexOf('<div class="section-hero">'));
  // The search script only belongs on workshop.html itself.
  const foot = workshopHtml.slice(workshopHtml.indexOf('<footer')).replace(/\n?<script src="js\/workshop-search\.js[^"]*"><\/script>/, '');
  return { head, foot };
}

function subpage({ head, foot }, cat) {
  const title = `${cat.title} — The Workshop — The Critical Vector`;
  const h = head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(cat.blurb)}" />`);
  return `${h}<div class="section-hero">
    <a href="workshop.html" class="section-label workshop-label wk-back" style="margin-bottom:16px;">‹ The Workshop</a>
    <h1 style="color:var(--teal)">${esc(cat.title)}</h1>
    <p>${esc(cat.blurb)}</p>
  </div>

  <div class="section-grid">

    <div class="section-label workshop-label">${cat.items.length} ${cat.items.length === 1 ? 'entry' : 'entries'}</div>
    <div class="post-list">
${cat.items.map(i => row(i)).join('\n')}
    </div>

    <a class="wk-more" href="workshop.html#search">Search the whole Workshop</a>

  </div>

  ${foot}`;
}

function overview(cats, index) {
  const blocks = cats.map(cat => {
    const shown = cat.items.slice(0, EXAMPLES);
    const n = cat.items.length;
    return `    <section class="wk-cat" aria-labelledby="wk-${cat.key}">
      <a href="${cat.page}" class="section-label workshop-label wk-cat-link" id="wk-${cat.key}">${esc(cat.title)} <span class="wk-cat-count">${n}</span></a>
      <p class="wk-cat-blurb">${esc(cat.blurb)}</p>
      <div class="post-list">
${shown.map(i => row(i)).join('\n')}
      </div>
      <a class="wk-more" href="${cat.page}">${n > shown.length ? `See all ${n} →` : `Open ${esc(cat.title)} →`}</a>
    </section>`;
  }).join('\n\n');
  const json = JSON.stringify(index).replace(/</g, '\\u003c');
  return `\n    <div id="wkOverview">\n${blocks}\n    </div>\n    <script type="application/json" id="wkIndex">${json}</script>\n    `;
}

function buildWorkshop(posts) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'workshop.json'), 'utf8'));
  const cats = data.categories.map(c => ({
    ...c,
    items: c.source === 'posts'
      ? posts.filter(p => p.section === 'workshop')
          .sort((a, b) => b.date.localeCompare(a.date))
          .map(p => ({ href: p.file, type: decode(p.type), title: decode(p.title), meta: decode(p.meta) }))
      : c.items,
  }));

  const index = cats.flatMap(c => c.items.map(i => ({
    h: i.href, t: i.title, y: i.type, m: i.meta, c: c.title, p: c.page, k: keywordsFor(i.href),
  })));

  const wsPath = path.join(ROOT, 'workshop.html');
  let ws = fs.readFileSync(wsPath, 'utf8');
  if (!ws.includes(START) || !ws.includes(END)) throw new Error('workshop.html is missing the CV:WORKSHOP sentinels');
  ws = ws.slice(0, ws.indexOf(START) + START.length) + overview(cats, index) + ws.slice(ws.indexOf(END));
  fs.writeFileSync(wsPath, ws, 'utf8');

  const parts = shell(ws);
  for (const cat of cats) fs.writeFileSync(path.join(ROOT, cat.page), subpage(parts, cat), 'utf8');

  const total = cats.reduce((n, c) => n + c.items.length, 0);
  console.log(`Updated workshop.html and ${cats.length} subpages (${total} entries)`);
  return { total, pages: cats.map(c => c.page) };
}

module.exports = { buildWorkshop, keywordsFor, decode, text };
if (require.main === module) {
  buildWorkshop(JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8')));
}
