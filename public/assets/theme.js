// ------------------------------------------------------------------
// 2060.io — shared client-side theme + UX utilities.
// Mirrors the Hologram site pattern; ports cleanly to a React hook
// or ThemeProvider when porting to Next.js.
// ------------------------------------------------------------------

(function () {
  const STORAGE_KEY = '2060-theme';
  const root = document.documentElement;

  // 1. Theme handling. Dark is the 2060 default; we respect the OS
  //    preference on the first visit and then honour the user's choice.
  function applyTheme(theme) {
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    // Icon glyph is rendered by CSS ::before based on the `.light` /
    // `.dark` class on <html>, so no textContent update is needed here.
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }

  function getInitialTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (_) {
      /* storage blocked — fall through to media query */
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function toggleTheme() {
    const next = root.classList.contains('light') ? 'dark' : 'light';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* ignore */ }
    applyTheme(next);
  }

  // Apply immediately to avoid a flash of the wrong theme.
  applyTheme(getInitialTheme());

  // 2. Wire up interactive elements once the DOM is ready.
  document.addEventListener('DOMContentLoaded', () => {
    // Re-sync the toggle UI: the first applyTheme() runs from <head>
    // before the button exists, so the icon / aria-label were skipped.
    applyTheme(root.classList.contains('light') ? 'light' : 'dark');

    const themeBtn = document.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Mobile nav toggle.
    const menuBtn = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (menuBtn && menu) {
      menuBtn.addEventListener('click', () => {
        const open = menu.classList.toggle('hidden') === false;
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    // Mark the current page in the nav if not already explicit.
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('[data-nav-link]').forEach((el) => {
      if (el.hasAttribute('aria-current')) return;
      const target = (el.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (target === here) el.setAttribute('aria-current', 'page');
    });

    // Scroll reveal.
    const reveals = document.querySelectorAll('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  });
})();
