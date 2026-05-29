// ── THEME ──
const html = document.documentElement;
const saved = localStorage.getItem('cv-theme');
if (saved) {
  html.setAttribute('data-theme', saved);
  updateToggleLabel(saved);
}

function toggleTheme() {
  const current = html.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('cv-theme', next);
  updateToggleLabel(next);
}

function updateToggleLabel(theme) {
  const label = document.querySelector('.mode-label');
  if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

// ── MOBILE MENU ──
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('open');
}

// Close menu on outside click
document.addEventListener('click', function(e) {
  const menu = document.getElementById('mobileMenu');
  const hamburger = document.querySelector('.cv-hamburger');
  if (menu && menu.classList.contains('open')) {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove('open');
    }
  }
});
