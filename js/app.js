// app.js — Punto de entrada: sesión familiar, rutas, sincronización y Service Worker.

import { registerRoute, setNotFoundRoute, initRouter, renderRoute } from './ui.js';
import { getHouseholds, getCurrentHouseholdId, setCurrentHouseholdId } from './households.js';
import { getSettings } from './settings.js';
import { applyTheme } from './theme.js';
import { seedDemoData } from './demoData.js';
import { openHouseholdSwitcherModal, refreshHouseholdTopbar } from './views/householdsView.js';
import { openGlobalSearchModal } from './views/search.js';
import { bus, debounce } from './utils.js';
import { db, STORES } from './database.js';
import { isFirebaseConfigured } from './firebaseConfig.js';
import { initAuthListener, waitForAuthReady, onAuthChange } from './auth.js';
import { renderSetupScreen, renderLoginScreen } from './views/loginView.js';

import * as homeView from './views/home.js';
import * as inventoryView from './views/inventory.js';
import * as shoppingView from './views/shoppingView.js';
import * as calendarView from './views/calendarView.js';
import * as recipesView from './views/recipesView.js';
import * as aiView from './views/ai.js';
import * as settingsView from './views/settingsView.js';

registerRoute('/inicio', homeView.render);
registerRoute('/alimentos', inventoryView.render);
registerRoute('/compra', shoppingView.render);
registerRoute('/calendario', calendarView.render);
registerRoute('/recetas', recipesView.render);
registerRoute('/ia', aiView.render);
registerRoute('/ajustes', settingsView.render);
setNotFoundRoute('/inicio');

let appStarted = false;
let unsubscribers = [];

async function start() {
  if (!isFirebaseConfigured()) {
    showAuthScreen();
    renderSetupScreen();
    return;
  }

  initAuthListener();
  const user = await waitForAuthReady();

  if (!user) {
    showAuthScreen();
    renderLoginScreen({ onSuccess: () => window.location.reload() });
    return;
  }

  onAuthChange((nextUser) => {
    // Si la sesión se cierra desde este u otro dispositivo, vuelve a la pantalla de acceso.
    if (!nextUser && appStarted) window.location.reload();
  });

  await runApp();
}

function hideBootLoader() {
  const loader = document.getElementById('boot-loader');
  if (!loader) return;
  loader.classList.add('boot-loader-hidden');
  setTimeout(() => loader.remove(), 300);
}

function showAuthScreen() {
  hideBootLoader();
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('root').classList.add('hidden');
}

function showApp() {
  hideBootLoader();
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('root').classList.remove('hidden');
}

async function runApp() {
  showApp();
  appStarted = true;

  const settings = await getSettings();
  applyTheme(settings.theme);

  const households = await getHouseholds();
  if (!households.length) {
    const household = await seedDemoData();
    await setCurrentHouseholdId(household.id);
  } else {
    await getCurrentHouseholdId();
  }

  await refreshHouseholdTopbar();
  await initRouter();

  document.getElementById('household-switch-btn').addEventListener('click', openHouseholdSwitcherModal);
  document.getElementById('search-btn').addEventListener('click', openGlobalSearchModal);

  window.addEventListener('foodstock:household-switched', async () => {
    await refreshHouseholdTopbar();
    renderRoute();
  });
  window.addEventListener('foodstock:refresh-home', () => {
    if ((window.location.hash || '#/inicio').startsWith('#/inicio')) renderRoute();
  });
  window.addEventListener('foodstock:data-cleared', async () => {
    stopLiveSync();
    const remaining = await getHouseholds();
    if (!remaining.length) {
      const household = await seedDemoData();
      await setCurrentHouseholdId(household.id);
    }
    await refreshHouseholdTopbar();
    window.location.hash = '#/inicio';
    renderRoute();
    startLiveSync();
  });

  bus.on('settings:changed', ({ key, value }) => {
    if (key === 'theme') applyTheme(value);
  });

  startLiveSync();
  registerServiceWorker();
}

// Vuelve a pintar la vista actual cuando otro dispositivo cambia algo. No hace
// falta saber qué cambió exactamente: como cada renderRoute() ya vuelve a
// leer todos los datos, basta con disparar un refresco.
function startLiveSync() {
  const refresh = debounce(() => renderRoute(), 200);
  unsubscribers = Object.keys(STORES).map((storeName) => db.watchStore(storeName, refresh));
}

function stopLiveSync() {
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const doRegister = () => {
    const swUrl = new URL('service-worker.js', window.location.href);
    navigator.serviceWorker.register(swUrl, { scope: './' }).catch((err) => {
      console.warn('No se pudo registrar el Service Worker:', err);
    });
  };
  if (document.readyState === 'complete') {
    doRegister();
  } else {
    window.addEventListener('load', doRegister);
  }
}

start().catch((err) => {
  console.error('Error inicializando FoodStock:', err);
  const loader = document.getElementById('boot-loader');
  if (loader) loader.remove();
  const authScreen = document.getElementById('auth-screen');
  authScreen.classList.remove('hidden');
  document.getElementById('root').classList.add('hidden');
  authScreen.innerHTML = `
    <div class="empty-state">
      <span class="emoji">⚠️</span>
      <p>No se ha podido iniciar FoodStock. Prueba a recargar la página.</p>
    </div>`;
});
