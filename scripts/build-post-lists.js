// build-post-lists.js
// Reads posts.json and injects post rows into section pages and index.html
// Triggered automatically by GitHub Actions on push to main.

const fs   = require('fs');
const path = require('path');

const ROOT  = path.join(__dirname, '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// ── Section pages ──────────────────────────────────────────────
const SECTIONS = {
  continuum:  'continuum.html',
  workshop:   'workshop.html',
  locker:     'locker.html',
  flightdeck: 'flightdeck.html',
};

const SECTION_NAMES = {
  continuum:  'The Continuum',
  workshop:   'The Workshop',
  locker:     'The Evidence Locker',
  flightdeck: 'From the Flight Deck',
};

const SENTINEL_START = '<!-- CV:POST-LIST-START -->';
const SENTINEL_END   = '<!-- CV:POST-LIST-END -->';

function buildRows(section) {
  return posts
    .filter(p => p.section === section)
    .map(p => `      <a href="${p.file}" class="post-row ${p.section}-row">
        <div class="post-info">
          <div class="post-type ${p.typeClass}">${p.type}</div>
          <div class="post-title">${p.title}</div>
          <div class="post-meta">${p.meta}</div>
        </div>
        <span class="post-arrow">›</span>
      </a>`).join('\n');
}

let updated = 0;

for (const [section, filename] of Object.entries(SECTIONS)) {
  const filepath = path.join(ROOT, filename);
  if (!fs.existsSync(filepath)) { console.log(`Skipping ${filename} — not found`); continue; }

  let html = fs.readFileSync(filepath, 'utf8');
  if (!html.includes(SENTINEL_START) || !html.includes(SENTINEL_END)) {
    console.log(`Skipping ${filename} — sentinels not found`);
    continue;
  }

  const rows    = buildRows(section);
  const before  = html.indexOf(SENTINEL_START) + SENTINEL_START.length;
  const after   = html.indexOf(SENTINEL_END);
  const newHtml = html.slice(0, before) + '\n' + rows + '\n    ' + html.slice(after);

  fs.writeFileSync(filepath, newHtml, 'utf8');
  console.log(`Updated ${filename} with ${posts.filter(p => p.section === section).length} post(s)`);
  updated++;
}

// ── index.html — featured card + recent posts ──────────────────
const indexPath = path.join(ROOT, 'index.html');
if (fs.existsSync(indexPath)) {
  let index = fs.readFileSync(indexPath, 'utf8');

  // ── Featured card ──
  const FEAT_START = '<!-- CV:FEATURED-START -->';
  const FEAT_END   = '<!-- CV:FEATURED-END -->';

  const featured = posts.find(p => p.featured);
  if (featured && index.includes(FEAT_START) && index.includes(FEAT_END)) {
    const badges = (featured.featuredBadges || [])
      .map(b => `          <span class="badge ${b.class}">${b.text}</span>`)
      .join('\n');

    const featHtml = `
      <article class="featured-card">
        <div class="feat-head">
${badges}
          <span class="feat-meta">${featured.featuredMeta || featured.meta}</span>
        </div>
        <div class="feat-body">
          <h2>${featured.title}</h2>
          <p>${featured.featuredBlurb || ''}</p>
          <a href="${featured.file}" class="read-more">${featured.featuredCta || 'Read the breakdown'} →</a>
        </div>
      </article>`;

    const fb = index.indexOf(FEAT_START) + FEAT_START.length;
    const fe = index.indexOf(FEAT_END);
    index = index.slice(0, fb) + featHtml + '\n      ' + index.slice(fe);
    console.log(`Updated index.html featured card: "${featured.title}"`);
  }

  // ── Latest from each section, newest first ──
  const RECENT_START = '<!-- CV:RECENT-START -->';
  const RECENT_END   = '<!-- CV:RECENT-END -->';

  if (index.includes(RECENT_START) && index.includes(RECENT_END)) {
    const recent = Object.keys(SECTIONS)
      .map(section => posts.find(p => p.section === section))
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentRows = recent.map(p => `        <a href="${p.file}" class="post-row ${p.section}-row">
          <div class="post-info">
            <div class="post-type ${p.section}-type">${SECTION_NAMES[p.section]} · ${p.type}</div>
            <div class="post-title">${p.title}</div>
            <div class="post-meta">${p.meta}</div>
          </div>
          <span class="post-arrow">›</span>
        </a>`).join('\n');

    const rb = index.indexOf(RECENT_START) + RECENT_START.length;
    const re = index.indexOf(RECENT_END);
    index = index.slice(0, rb) + '\n' + recentRows + '\n      ' + index.slice(re);
    console.log(`Updated index.html latest posts (${recent.length} posts)`);
  }

  // ── Section counts in the sidebar (entries listed on each page) ──
  for (const section of Object.keys(SECTIONS)) {
    const page = fs.readFileSync(path.join(ROOT, SECTIONS[section]), 'utf8');
    const n = (page.match(/class="post-row[ "]/g) || []).length;
    index = index.replace(
      new RegExp(`(<span class="sec-count" data-section="${section}">)[^<]*(</span>)`),
      `$1${n}$2`);
  }

  fs.writeFileSync(indexPath, index, 'utf8');
  updated++;
}

console.log(`Done — ${updated} file(s) updated`);
