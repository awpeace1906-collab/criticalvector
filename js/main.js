// ── THEME ──
const html = document.documentElement;
const saved = localStorage.getItem('cv-theme');
if (saved) html.setAttribute('data-theme', saved);
updateToggleLabel(html.getAttribute('data-theme') || 'dark');

function toggleTheme() {
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cv-theme', next);
  updateToggleLabel(next);
}

// The button offers the mode you would switch to
function updateToggleLabel(theme) {
  const label = document.querySelector('.mode-label');
  const icon = document.querySelector('.mode-icon');
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
}

const modeToggle = document.getElementById('modeToggle');
if (modeToggle) modeToggle.addEventListener('click', toggleTheme);

// ── MOBILE MENU ──
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    setMenu(!navLinks.classList.contains('open'));
  });

  // Close on outside click, link tap or Escape
  document.addEventListener('click', function(e) {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target)) setMenu(false);
  });
  navLinks.addEventListener('click', function(e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function() {
    if (window.innerWidth > 860) setMenu(false);
  });
}

// ── WEBMASTER ACCESS ──
// The © in the footer quietly links to the webmaster page. It keeps the
// text's look (no colour, underline or pointer) so it reads as plain text.
(function () {
  const footer = document.querySelector('.footer-left');
  const me = document.currentScript;
  if (!footer || !me || !footer.firstChild || footer.firstChild.nodeType !== 3) return;
  const text = footer.firstChild;
  if (!text.textContent.startsWith('©')) return;
  const link = document.createElement('a');
  link.href = new URL('../webmaster.html', me.src).href;
  link.className = 'wm-door';
  link.textContent = '©';
  link.setAttribute('aria-label', 'Copyright');
  text.textContent = text.textContent.slice(1);
  footer.insertBefore(link, text);
})();
