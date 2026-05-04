/* Critical Vector — main.js */

(function () {
  'use strict';

  /* ── THEME ── */
  const root = document.documentElement;
  const toggleBtn = document.getElementById('modeToggle');
  const STORAGE_KEY = 'cv-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggleBtn) {
      const icon  = toggleBtn.querySelector('.mode-icon');
      const label = toggleBtn.querySelector('.mode-label');
      if (theme === 'dark') {
        if (icon)  icon.textContent  = '☀';
        if (label) label.textContent = 'Light';
      } else {
        if (icon)  icon.textContent  = '🌙';
        if (label) label.textContent = 'Dark';
      }
    }
  }

  /* Load saved preference or default to dark */
  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  applyTheme(saved);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  /* ── MOBILE NAV ── */
  const hamburger = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    /* Close on nav link click */
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav')) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── NAV SCROLL SHADOW ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      nav.style.boxShadow = window.scrollY > 10
        ? '0 1px 20px rgba(0,0,0,0.35)'
        : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

})();
