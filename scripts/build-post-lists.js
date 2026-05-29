// build-post-lists.js
// Reads posts.json and injects post rows into each section HTML file.
// Run automatically by GitHub Actions on every push to main.

const fs   = require('fs');
const path = require('path');

const ROOT  = path.join(__dirname, '..');
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts.json'), 'utf8'));

// Sort newest first by date
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Which section pages to update and their sentinel comments
const SECTIONS = {
  continuum: 'continuum.html',
  workshop:  'workshop.html',
  locker:    'locker.html',
  flightdeck:'flightdeck.html',
};

const SENTINEL_START = '<!-- CV:POST-LIST-START -->';
const SENTINEL_END   = '<!-- CV:POST-LIST-END -->';

function buildRows(section) {
  const sectionPosts = posts.filter(p => p.section === section);
  if (sectionPosts.length === 0) return '';

  return sectionPosts.map(p => `      <a href="${p.file}" class="post-row">
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
  if (!fs.existsSync(filepath)) {
    console.log(`Skipping ${filename} — file not found`);
    continue;
  }

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
  console.log(`Updated ${filename} with ${posts.filter(p => p.section === section).length} posts`);
  updated++;
}

console.log(`Done — ${updated} file(s) updated`);
