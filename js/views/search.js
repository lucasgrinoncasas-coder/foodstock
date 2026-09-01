// views/search.js — Buscador global de alimentos.

import { getCurrentHouseholdId } from '../households.js';
import { searchProducts, changeQuantity, toggleFavorite } from '../products.js';
import { LOCATIONS, CATEGORIES } from '../constants.js';
import { productListItem, emptyState } from '../components.js';
import { openModal, closeModal } from '../ui.js';
import { debounce, vibrate } from '../utils.js';

export async function openGlobalSearchModal() {
  const householdId = await getCurrentHouseholdId();
  const filters = { category: null, location: null, favoritesOnly: false, lowOnly: false };

  openModal(`
    <div class="modal-header"><h3 class="modal-title">🔍 Buscar</h3></div>
    <div class="search-bar">
      <span>🔍</span>
      <input type="text" id="global-search-input" placeholder="Busca en nevera, congelador o despensa..." autofocus />
    </div>
    <div class="chip-row" id="search-filters">
      <button class="chip" data-toggle="favoritesOnly">⭐ Favoritos</button>
      <button class="chip" data-toggle="lowOnly">⚠️ Poco stock</button>
      ${LOCATIONS.map((l) => `<button class="chip" data-location="${l.id}">${l.emoji} ${l.label}</button>`).join('')}
      ${CATEGORIES.map((c) => `<button class="chip" data-category="${c.id}">${c.emoji} ${c.label}</button>`).join('')}
    </div>
    <div id="search-results" class="stack mt-16" style="gap:8px;"></div>
  `, {
    onMount: (overlay) => {
      const input = overlay.querySelector('#global-search-input');
      const runSearch = debounce(() => performSearch(overlay, householdId, input.value, filters), 150);

      input.addEventListener('input', runSearch);

      overlay.querySelectorAll('[data-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => {
          filters[btn.dataset.toggle] = !filters[btn.dataset.toggle];
          btn.classList.toggle('active', filters[btn.dataset.toggle]);
          performSearch(overlay, householdId, input.value, filters);
        });
      });
      overlay.querySelectorAll('[data-location]').forEach((btn) => {
        btn.addEventListener('click', () => {
          filters.location = filters.location === btn.dataset.location ? null : btn.dataset.location;
          overlay.querySelectorAll('[data-location]').forEach((b) => b.classList.toggle('active', b.dataset.location === filters.location));
          performSearch(overlay, householdId, input.value, filters);
        });
      });
      overlay.querySelectorAll('[data-category]').forEach((btn) => {
        btn.addEventListener('click', () => {
          filters.category = filters.category === btn.dataset.category ? null : btn.dataset.category;
          overlay.querySelectorAll('[data-category]').forEach((b) => b.classList.toggle('active', b.dataset.category === filters.category));
          performSearch(overlay, householdId, input.value, filters);
        });
      });

      performSearch(overlay, householdId, '', filters);
    },
  });
}

async function performSearch(overlay, householdId, query, filters) {
  const resultsEl = overlay.querySelector('#search-results');
  const products = await searchProducts(householdId, query, filters);
  if (!products.length) {
    resultsEl.innerHTML = emptyState('🔍', 'No se han encontrado alimentos.');
    return;
  }
  resultsEl.innerHTML = products.map(productListItem).join('');

  resultsEl.querySelectorAll('[data-action="qty-inc"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      vibrate();
      await changeQuantity(btn.dataset.id, 1);
      performSearch(overlay, householdId, overlay.querySelector('#global-search-input').value, filters);
    });
  });
  resultsEl.querySelectorAll('[data-action="qty-dec"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      vibrate();
      await changeQuantity(btn.dataset.id, -1);
      performSearch(overlay, householdId, overlay.querySelector('#global-search-input').value, filters);
    });
  });
  resultsEl.querySelectorAll('[data-action="toggle-fav-product"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await toggleFavorite(btn.dataset.id);
      performSearch(overlay, householdId, overlay.querySelector('#global-search-input').value, filters);
    });
  });

  resultsEl.querySelectorAll('.list-item').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      closeModal();
      window.location.hash = '#/alimentos';
    });
  });
}
