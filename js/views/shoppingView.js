// views/shoppingView.js — Lista de la compra.

import { getCurrentHouseholdId } from '../households.js';
import {
  getShoppingList, addItem, updateItem, deleteItem, setPurchased, clearPurchased, groupByCategory,
} from '../shopping.js';
import { createProduct, searchProducts, addLowStockToShoppingList } from '../products.js';
import { CATEGORIES, UNITS } from '../constants.js';
import { categoryInfo } from '../constants.js';
import { emptyState, formatQty } from '../components.js';
import { openModal, closeModal, confirmDialog } from '../ui.js';
import { escapeHTML, toast } from '../utils.js';

export async function render(container) {
  const householdId = await getCurrentHouseholdId();
  container.innerHTML = `
    <div class="row">
      <h1 class="greeting">🛒 Lista de compra</h1>
    </div>
    <div class="row mt-8" style="gap:8px;">
      <button class="btn btn-secondary btn-sm" id="btn-add-low-stock">⚠️ Añadir productos bajos</button>
      <button class="btn btn-secondary btn-sm" id="btn-clear-purchased">Vaciar comprados</button>
    </div>
    <div id="shopping-content" class="mt-16"></div>
    <button class="fab" id="fab-add-item" aria-label="Añadir producto">+</button>
  `;

  container.querySelector('#fab-add-item').addEventListener('click', () => openAddShoppingItemModal(householdId));
  container.querySelector('#btn-add-low-stock').addEventListener('click', async () => {
    const added = await addLowStockToShoppingList(householdId);
    toast(added.length ? `${added.length} producto(s) añadidos` : 'No hay productos con poco stock', added.length ? 'success' : 'info');
    refresh(householdId);
  });
  container.querySelector('#btn-clear-purchased').addEventListener('click', async () => {
    const removed = await clearPurchased(householdId);
    toast(removed.length ? 'Comprados eliminados' : 'No había productos comprados', 'success');
    refresh(householdId);
  });

  await refresh(householdId);
}

async function refresh(householdId) {
  const contentEl = document.getElementById('shopping-content');
  if (!contentEl) return;
  const items = await getShoppingList(householdId);

  if (!items.length) {
    contentEl.innerHTML = emptyState('🛒', 'Tu lista de la compra está vacía.');
    return;
  }

  const pending = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);
  const groupedPending = groupByCategory(pending);

  let html = '';
  if (pending.length) {
    html += Object.entries(groupedPending).map(([catId, group]) => {
      const cat = categoryInfo(catId);
      return `
        <div class="mt-16">
          <div class="section-title"><span>${cat.emoji} ${cat.label}</span></div>
          <div class="stack" style="gap:8px;">
            ${group.map(shoppingRow).join('')}
          </div>
        </div>`;
    }).join('');
  } else {
    html += `<p class="text-muted mt-16">No queda nada pendiente por comprar 🎉</p>`;
  }

  if (purchased.length) {
    html += `
      <div class="mt-16">
        <div class="section-title"><span>✅ Comprados</span></div>
        <div class="stack" style="gap:8px;">
          ${purchased.map(shoppingRow).join('')}
        </div>
      </div>`;
  }

  contentEl.innerHTML = html;
  wireEvents(contentEl, householdId);
}

function shoppingRow(item) {
  return `
    <div class="list-item" data-item-id="${item.id}">
      <button class="item-emoji" data-action="toggle" data-id="${item.id}" style="border:none;cursor:pointer;">
        ${item.purchased ? '✅' : '☐'}
      </button>
      <div class="item-info">
        <div class="item-name" style="${item.purchased ? 'text-decoration:line-through;color:var(--color-text-faint);' : ''}">${escapeHTML(item.name)}</div>
        <div class="item-meta"><span>${formatQty(item.quantity)} ${item.unit}</span></div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Menos">−</button>
        <span class="qty-value">${formatQty(item.quantity)}</span>
        <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Más">+</button>
      </div>
      <button class="icon-btn" data-action="delete" data-id="${item.id}" aria-label="Eliminar">🗑️</button>
    </div>`;
}

function wireEvents(root, householdId) {
  root.querySelectorAll('[data-action="inc"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const items = await getShoppingList(householdId);
      const item = items.find((i) => i.id === btn.dataset.id);
      await updateItem(btn.dataset.id, { quantity: (Number(item.quantity) || 0) + 1 });
      refresh(householdId);
    });
  });
  root.querySelectorAll('[data-action="dec"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const items = await getShoppingList(householdId);
      const item = items.find((i) => i.id === btn.dataset.id);
      const newQty = Math.max(0, (Number(item.quantity) || 0) - 1);
      await updateItem(btn.dataset.id, { quantity: newQty });
      refresh(householdId);
    });
  });
  root.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await deleteItem(btn.dataset.id);
      toast('Eliminado de la lista', 'success');
      refresh(householdId);
    });
  });
  root.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const items = await getShoppingList(householdId);
      const item = items.find((i) => i.id === btn.dataset.id);
      const nowPurchased = !item.purchased;
      await setPurchased(item.id, nowPurchased);

      if (nowPurchased) {
        const addToPantry = await confirmDialog({
          title: '¿Añadir a tu despensa?',
          message: `¿Quieres añadir "${item.name}" a tu almacenamiento ahora que lo has comprado?`,
          confirmLabel: 'Sí, añadir',
        });
        if (addToPantry) {
          const existing = await searchProducts(householdId, item.name, {});
          const exact = existing.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
          if (exact) {
            const { updateProduct } = await import('../products.js');
            await updateProduct(exact.id, { quantity: (Number(exact.quantity) || 0) + (Number(item.quantity) || 1) });
          } else {
            await createProduct({
              householdId,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              location: 'despensa',
            });
          }
          toast(`${item.name} añadido a tu despensa`, 'success');
        }
      }
      refresh(householdId);
    });
  });
}

export function openAddShoppingItemModal(householdId) {
  openModal(`
    <div class="modal-header"><h3 class="modal-title">🛒 Añadir a la compra</h3></div>
    <form id="shopping-form">
      <div class="form-group">
        <label class="form-label" for="s-name">Nombre</label>
        <input class="form-control" id="s-name" name="name" required placeholder="Ej. Manzanas" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="s-quantity">Cantidad</label>
          <input class="form-control" id="s-quantity" name="quantity" type="number" min="1" step="0.1" value="1" />
        </div>
        <div class="form-group">
          <label class="form-label" for="s-unit">Unidad</label>
          <select class="form-control" id="s-unit" name="unit">
            ${UNITS.map((u) => `<option value="${u}">${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-category">Categoría</label>
        <select class="form-control" id="s-category" name="category">
          ${CATEGORIES.map((c) => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-shopping">Cancelar</button>
        <button type="submit" class="btn btn-primary">Añadir</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      overlay.querySelector('#cancel-shopping').addEventListener('click', closeModal);
      overlay.querySelector('#shopping-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        if (!name) return;
        await addItem({
          householdId,
          name,
          quantity: formData.get('quantity'),
          unit: formData.get('unit'),
          category: formData.get('category'),
        });
        closeModal();
        toast(`${name} añadido a la compra`, 'success');
        refresh(householdId);
        window.dispatchEvent(new CustomEvent('foodstock:refresh-home'));
      });
    },
  });
}
