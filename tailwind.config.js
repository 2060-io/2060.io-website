/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind JIT scans these for class names. Must cover every file that
  // produces HTML: layouts/, content/, and the handful of partials that
  // inline class strings via Hugo variables.
  content: [
    './layouts/**/*.{html,htm}',
    './content/**/*.{md,html}',
  ],

  // Dark mode is driven by `.light` / `.dark` on <html>, set by
  // static/theme.js. We use the `class` strategy so those classes do
  // anything; the actual palette is driven by CSS custom properties
  // in assets/css/input.css (the `:root.light { ... }` block).
  darkMode: 'class',

  theme: {
    extend: {
      // Colour tokens map onto CSS variables so dark/light theming is
      // done in one place (input.css) and every Tailwind utility —
      // bg-bg, text-fg, border-accent, etc. — picks up the switch for
      // free.
      colors: {
        bg:           'rgb(var(--bg-rgb) / <alpha-value>)',
        fg:           'rgb(var(--fg-rgb) / <alpha-value>)',
        muted:        'rgb(var(--muted-rgb) / <alpha-value>)',
        accent:       'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-hover': 'var(--accent-hover)',
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        '8xl':     '96rem',
        'reading': '72ch',
      },
    },
  },

  plugins: [],
};
