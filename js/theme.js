// theme.js — Aplica el tema claro/oscuro/sistema a la raíz del documento.

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }

  const meta = document.getElementById('theme-color-meta');
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const color = isDark ? '#0F1720' : '#4F8EF7';
  if (meta) meta.setAttribute('content', color);
}
