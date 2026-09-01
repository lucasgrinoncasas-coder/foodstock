// views/inventory.js — Gestión de alimentos (nevera, congelador, despensa).

import { getCurrentHouseholdId } from '../households.js';
import {
  searchProducts, createProduct, updateProduct, deleteProduct,
  changeQuantity, toggleFavorite, getProduct,
} from '../products.js';
import { addItem as addShoppingItem } from '../shopping.js';
import { getSetting } from '../settings.js';
import { CATEGORIES, LOCATIONS, UNITS } from '../constants.js';
import { productListItem, emptyState } from '../components.js';
import { openModal, closeModal, confirmDialog, currentQuery } from '../ui.js';
import { escapeHTML, toast, debounce, vibrate } from '../utils.js';

const FREQUENT_PRODUCTS = [
  'Leche', 'Huevos', 'Pan', 'Arroz', 'Aceite', 'Tomate', 'Cebolla', 'Yogures',
  'Queso', 'Pasta', 'Pollo', 'Patatas',
];

let state = { location: null, category: null, query: '', favoritesOnly: false, lowOnly: false };

export async function render(container) {
  const householdId = await getCurrentHouseholdId();
  const query = currentQuery();
  if (query.location) state.location = query.location;

  container.innerHTML = `
    <h1 class="greeting">📦 Alimentos</h1>
    <div class="search-bar">
      <span>🔍</span>
      <input type="text" id="product-search" placeholder="Buscar un alimento..." value="${escapeHTML(state.query)}" />
    </div>

    <div class="tab-row" id="location-tabs">
      <button class="tab-btn ${!state.location ? 'active' : ''}" data-location="">Todos</button>
      ${LOCATIONS.map((l) => `<button class="tab-btn ${state.location === l.id ? 'active' : ''}" data-location="${l.id}">${l.emoji} ${l.label}</button>`).join('')}
    </div>

    <div class="chip-row mt-8" id="category-chips">
      ${chip('Favoritos ⭐', 'favoritesOnly')}
      ${chip('Poco stock ⚠️', 'lowOnly')}
      ${CATEGORIES.map((c) => `<button class="chip ${state.category === c.id ? 'active' : ''}" data-category="${c.id}">${c.emoji} ${c.label}</button>`).join('')}
    </div>

    <div id="product-list" class="stack mt-16" style="gap:8px;"></div>

    <button class="fab" id="fab-add-product" aria-label="Añadir alimento">+</button>
  `;

  wireFilters(container, householdId);
  await refreshList(householdId);

  container.querySelector('#fab-add-product').addEventListener('click', () => openAddProductModal(householdId));
}

function chip(label, key) {
  return `<button class="chip ${state[key] ? 'active' : ''}" data-toggle="${key}">${label}</button>`;
}

function wireFilters(container, householdId) {
  const searchInput = container.querySelector('#product-search');
  searchInput.addEventListener('input', debounce((e) => {
    state.query = e.target.value;
    refreshList(householdId);
  }, 200));

  container.querySelectorAll('#location-tabs [data-location]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.location = btn.dataset.location || null;
      container.querySelectorAll('#location-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      refreshList(householdId);
    });
  });

  container.querySelectorAll('#category-chips [data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = state.category === btn.dataset.category ? null : btn.dataset.category;
      container.querySelectorAll('#category-chips [data-category]').forEach((b) => b.classList.toggle('active', b.dataset.category === state.category));
      refreshList(householdId);
    });
  });

  container.querySelectorAll('#category-chips [data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle;
      state[key] = !state[key];
      btn.classList.toggle('active', state[key]);
      refreshList(householdId);
    });
  });
}

async function refreshList(householdId) {
  const listEl = document.getElementById('product-list');
  if (!listEl) return;
  const products = await searchProducts(householdId, state.query, {
    location: state.location,
    category: state.category,
    favoritesOnly: state.favoritesOnly,
    lowOnly: state.lowOnly,
  });

  if (!products.length) {
    listEl.innerHTML = emptyState('📦', 'No se han encontrado alimentos con estos filtros.');
    return;
  }

  listEl.innerHTML = products.map(productListItem).join('');
  wireListEvents(listEl, householdId);
}

function wireListEvents(listEl, householdId) {
  listEl.querySelectorAll('[data-action="qty-inc"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      vibrate();
      await changeQuantity(btn.dataset.id, 1);
      refreshList(householdId);
    });
  });

  listEl.querySelectorAll('[data-action="qty-dec"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      vibrate();
      const result = await changeQuantity(btn.dataset.id, -1);
      if (result.reachedZero) {
        const add = await confirmDialog({
          title: '¿Añadir a la lista de la compra?',
          message: `${result.product.name} se ha quedado a 0. ¿Quieres añadirlo a la lista de la compra?`,
          confirmLabel: 'Sí, añadir',
        });
        if (add) {
          await addShoppingItem({
            householdId,
            name: result.product.name,
            quantity: Math.max(1, result.product.minQuantity || 1),
            unit: result.product.unit,
            category: result.product.category,
            linkedProductId: result.product.id,
          });
          toast(`${result.product.name} añadido a la compra`, 'success');
        }
      }
      refreshList(householdId);
    });
  });

  listEl.querySelectorAll('[data-action="toggle-fav-product"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await toggleFavorite(btn.dataset.id);
      refreshList(householdId);
    });
  });

  listEl.querySelectorAll('.list-item').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      openEditProductModal(row.dataset.productId, householdId);
    });
  });
}

export function openAddProductModal(householdId) {
  const expiryEnabledPromise = getSetting('expiryAlerts');

  openModal(`
    <div class="modal-header"><h3 class="modal-title">➕ Añadir alimento</h3></div>
    <div class="chip-row" id="frequent-chips">
      ${FREQUENT_PRODUCTS.map((name) => `<button class="chip" data-name="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join('')}
    </div>
    <form id="product-form" class="mt-16">
      <div class="form-group">
        <label class="form-label" for="p-name">Nombre</label>
        <input class="form-control" id="p-name" name="name" required placeholder="Ej. Leche" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="p-quantity">Cantidad</label>
          <input class="form-control" id="p-quantity" name="quantity" type="number" min="0" step="0.1" value="1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="p-unit">Unidad</label>
          <select class="form-control" id="p-unit" name="unit">
            ${UNITS.map((u) => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="p-category">Categoría</label>
          <select class="form-control" id="p-category" name="category">
            ${CATEGORIES.map((c) => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="p-location">Ubicación</label>
          <select class="form-control" id="p-location" name="location">
            ${LOCATIONS.map((l) => `<option value="${l.id}">${l.emoji} ${l.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="p-min">Cantidad mínima</label>
          <input class="form-control" id="p-min" name="minQuantity" type="number" min="0" step="0.1" value="0" />
        </div>
        <div class="form-group" id="expiry-group">
          <label class="form-label" for="p-expiry">Caducidad (opcional)</label>
          <input class="form-control" id="p-expiry" name="expiryDate" type="date" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="p-notes">Notas (opcional)</label>
        <input class="form-control" id="p-notes" name="notes" placeholder="Ej. marca, tienda..." />
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-add-product">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar producto</button>
      </div>
    </form>
  `, {
    onMount: async (overlay) => {
      const expiryEnabled = await expiryEnabledPromise;
      if (!expiryEnabled) overlay.querySelector('#expiry-group').classList.add('hidden');

      overlay.querySelector('#cancel-add-product').addEventListener('click', closeModal);
      overlay.querySelectorAll('#frequent-chips .chip').forEach((chipBtn) => {
        chipBtn.addEventListener('click', () => {
          overlay.querySelector('#p-name').value = chipBtn.dataset.name;
        });
      });

      overlay.querySelector('#product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        if (!name) return;
        await createProduct({
          householdId,
          name,
          quantity: formData.get('quantity'),
          unit: formData.get('unit'),
          category: formData.get('category'),
          location: formData.get('location'),
          minQuantity: formData.get('minQuantity'),
          expiryDate: formData.get('expiryDate') || null,
          notes: formData.get('notes'),
        });
        closeModal();
        toast(`${name} añadido a tu inventario`, 'success');
        refreshList(householdId);
        window.dispatchEvent(new CustomEvent('foodstock:refresh-home'));
      });
    },
  });
}

async function openEditProductModal(productId, householdId) {
  const product = await getProduct(productId);
  if (!product) return;
  const expiryEnabled = await getSetting('expiryAlerts');

  openModal(`
    <div class="modal-header"><h3 class="modal-title">Editar alimento</h3></div>
    <form id="edit-product-form">
      <div class="form-group">
        <label class="form-label" for="e-name">Nombre</label>
        <input class="form-control" id="e-name" name="name" required value="${escapeHTML(product.name)}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="e-quantity">Cantidad</label>
          <input class="form-control" id="e-quantity" name="quantity" type="number" min="0" step="0.1" value="${product.quantity}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="e-unit">Unidad</label>
          <select class="form-control" id="e-unit" name="unit">
            ${UNITS.map((u) => `<option value="${u}" ${u === product.unit ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="e-category">Categoría</label>
          <select class="form-control" id="e-category" name="category">
            ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === product.category ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="e-location">Ubicación</label>
          <select class="form-control" id="e-location" name="location">
            ${LOCATIONS.map((l) => `<option value="${l.id}" ${l.id === product.location ? 'selected' : ''}>${l.emoji} ${l.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="e-min">Cantidad mínima</label>
          <input class="form-control" id="e-min" name="minQuantity" type="number" min="0" step="0.1" value="${product.minQuantity}" />
        </div>
        <div class="form-group ${expiryEnabled ? '' : 'hidden'}">
          <label class="form-label" for="e-expiry">Caducidad</label>
          <input class="form-control" id="e-expiry" name="expiryDate" type="date" value="${product.expiryDate || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="e-notes">Notas</label>
        <input class="form-control" id="e-notes" name="notes" value="${escapeHTML(product.notes || '')}" />
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" id="delete-product-btn">Eliminar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      overlay.querySelector('#delete-product-btn').addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: 'Eliminar alimento',
          message: `¿Seguro que quieres eliminar "${product.name}"?`,
          confirmLabel: 'Eliminar',
          danger: true,
        });
        if (ok) {
          await deleteProduct(productId);
          closeModal();
          toast('Producto eliminado', 'success');
          refreshList(householdId);
        }
      });

      overlay.querySelector('#edit-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await updateProduct(productId, {
          name: formData.get('name').trim(),
          quantity: Number(formData.get('quantity')) || 0,
          unit: formData.get('unit'),
          category: formData.get('category'),
          location: formData.get('location'),
          minQuantity: Number(formData.get('minQuantity')) || 0,
          expiryDate: formData.get('expiryDate') || null,
          notes: formData.get('notes'),
        });
        closeModal();
        toast('Producto actualizado', 'success');
        refreshList(householdId);
      });
    },
  });
}

