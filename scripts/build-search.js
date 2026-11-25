// build-search.js
// Writes search-index.json for the homepage's site-wide search: every
// post and library guide (posts.json), every hand-written Workshop item
// (workshop.json), every Stack resource (stack.html) and the main section
// pages. Each entry carries title, type, meta, section and keywords taken
// from the target page (title, description, headings). Unlisted pages and
// anesocalc/ are never included. Run by scripts/build-post-lists.js.

const fs   = require('fs');
const path = require('path');
const { keywordsFor, decode, text } = require('./build-workshop');

const ROOT = path.join(__dirname, '..');
const KEYWORDS = 700;

const SITE_PAGES = [
  ['continuum.html',  'continuum',  'The Continuum'],
  ['workshop.html',   'workshop',   'The Workshop'],
  ['locker.html',     'locker',     'The Evidence Locker'],
  ['flightdeck.html', 'flightdeck', 'From the Flight Deck'],
  ['stack.html',      'stack',      'The Stack'],
  ['about.html',      'site',       'About'],
];

function stackResources() {
  const html = fs.readFileSync(path.join(ROOT, 'stack.html'), 'utf8');
  const out = [];
  // Each group starts with a section-label; its rows follow until the next one.
  // The hero's label carries a style attribute, so it doesn't match; every
  // match here starts a resource group.
  const parts = html.split(/<div class="section-label [^"]*">/).slice(1);
  for (const part of parts) {
    const group = text(part.slice(0, part.indexOf('</div>')));
    for (const [, href, name, sub] of part.matchAll(/<a href="([^"]+)"[^>]*class="rrow">[\s\S]*?class="rname">([^<]*)<[\s\S]*?class="rsub">([^<]*)</g)) {
      out.push({ h: href, t: decode(name), y: group, m: decode(sub), s: 'stack', x: 1 });
    }
  }
  return out;
}

function buildSearch(posts) {
  const entries = [];
  const seen = new Set();
  const add = e => { if (!seen.has(e.h)) { seen.add(e.h); entries.push(e); } };

  for (const [file, section, title] of SITE_PAGES) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const lede = (html.match(/<div class="section-hero">[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1];
    add({ h: file, t: title, y: 'Section', m: lede ? text(lede) : '', s: section, k: '' });
  }

  for (const p of posts) {
    add({ h: p.file, t: decode(p.title), y: decode(p.type), m: decode(p.meta), s: p.section, k: keywordsFor(p.file).slice(0, KEYWORDS) });
  }

  const ws = JSON.parse(fs.readFileSync(path.join(ROOT, 'workshop.json'), 'utf8'));
  for (const cat of ws.categories) {
    if (cat.source === 'posts') continue;
    add({ h: cat.page, t: cat.title, y: 'Workshop category', m: cat.blurb, s: 'workshop', k: '' });
    for (const i of cat.items) {
      add({ h: i.href, t: i.title, y: `${cat.title} · ${i.type}`, m: i.meta, s: 'workshop', k: keywordsFor(i.href).slice(0, KEYWORDS) });
    }
  }
  const refs = ws.categories.find(c => c.source === 'posts');
  if (refs) add({ h: refs.page, t: refs.title, y: 'Workshop category', m: refs.blurb, s: 'workshop', k: '' });

  stackResources().forEach(add);

  fs.writeFileSync(path.join(ROOT, 'search-index.json'), JSON.stringify(entries) + '\n', 'utf8');
  console.log(`Wrote search-index.json (${entries.length} entries)`);
  return entries.length;
}

module.exports = { buildSearch };
if (require.main === module) {
  buildSearch(JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8')));
}
