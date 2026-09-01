// ui.js — Router de la SPA y sistema de modales. Sin lógica de negocio.

const routes = new Map();
let notFoundRoute = '/inicio';

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function setNotFoundRoute(path) {
  notFoundRoute = path;
}

export function navigate(path) {
  if (window.location.hash === `#${path}`) {
    renderRoute();
  } else {
    window.location.hash = `#${path}`;
  }
}

export function currentQuery() {
  const hash = window.location.hash.replace('#', '');
  const [, query] = hash.split('?');
  return Object.fromEntries(new URLSearchParams(query || ''));
}

let renderGeneration = 0;

export async function renderRoute() {
  const generation = (renderGeneration += 1);
  const hash = window.location.hash.replace('#', '') || notFoundRoute;
  const [path] = hash.split('?');
  const renderFn = routes.get(path) || routes.get(notFoundRoute);
  highlightNav(routes.has(path) ? path : notFoundRoute);

  const app = document.getElementById('app');
  // Si otra llamada a renderRoute() se lanza mientras esta espera datos
  // (típico cuando llegan varios cambios en tiempo real casi a la vez),
  // esta versión antigua no debe pisar el resultado de la más nueva.
  app.classList.remove('view-enter');
  app.innerHTML = '<div class="spinner"></div>';

  try {
    await renderFn(app, currentQuery());
    if (generation !== renderGeneration) return;
    app.classList.add('view-enter');
    app.scrollTop = 0;
  } catch (err) {
    if (generation !== renderGeneration) return;
    console.error('Error al renderizar la vista:', err);
    app.innerHTML = `
      <div class="empty-state">
        <span class="emoji">⚠️</span>
        <p>Ha ocurrido un error al cargar esta pantalla.</p>
      </div>`;
  }
}

function highlightNav(path) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === path);
  });
}

export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  return renderRoute();
}

// --- Sistema de modales (bottom sheet) ---

let escListener = null;
let modalGeneration = 0;

export function openModal(innerHTML, { onMount } = {}) {
  modalGeneration += 1;
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-sheet" role="dialog" aria-modal="true">
        <div class="modal-handle"></div>
        ${innerHTML}
      </div>
    </div>`;

  const overlay = document.getElementById('modal-overlay');
  requestAnimationFrame(() => overlay.classList.add('show'));

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  if (escListener) document.removeEventListener('keydown', escListener);
  escListener = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', escListener);

  if (onMount) onMount(overlay);
  return overlay;
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  if (escListener) {
    document.removeEventListener('keydown', escListener);
    escListener = null;
  }
  const generationAtClose = modalGeneration;
  setTimeout(() => {
    if (generationAtClose !== modalGeneration) return; // se ha abierto otro modal entretanto
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  }, 220);
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal-header"><h3 class="modal-title">${title}</h3></div>
      <p class="text-muted">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmLabel}</button>
      </div>
    `, {
      onMount: (overlay) => {
        overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
          closeModal();
          resolve(false);
        });
        overlay.querySelector('#confirm-ok').addEventListener('click', () => {
          closeModal();
          resolve(true);
        });
      },
    });
  });
}
