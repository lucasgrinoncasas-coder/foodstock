// views/householdsView.js — Selector y gestor de viviendas.

import {
  getHouseholds, createHousehold, updateHousehold, deleteHousehold,
  getCurrentHouseholdId, setCurrentHouseholdId,
} from '../households.js';
import { HOUSEHOLD_EMOJIS, HOUSEHOLD_COLORS } from '../constants.js';
import { openModal, closeModal, confirmDialog } from '../ui.js';
import { escapeHTML, toast } from '../utils.js';

export async function refreshHouseholdTopbar() {
  const id = await getCurrentHouseholdId();
  if (!id) return;
  const households = await getHouseholds();
  const household = households.find((h) => h.id === id);
  if (!household) return;
  const emojiEl = document.getElementById('household-emoji');
  const nameEl = document.getElementById('household-name');
  if (emojiEl) emojiEl.textContent = household.emoji;
  if (nameEl) nameEl.textContent = household.name;
}

export async function openHouseholdSwitcherModal() {
  const households = await getHouseholds();
  const currentId = await getCurrentHouseholdId();

  openModal(`
    <div class="modal-header"><h3 class="modal-title">🏠 Tus viviendas</h3></div>
    <div class="stack" id="household-list" style="gap:8px;">
      ${households.map((h) => `
        <div class="list-item" data-household-id="${h.id}" style="cursor:pointer; ${h.id === currentId ? `border-color:${h.color};` : ''}">
          <div class="item-emoji" style="background:${h.color}22;">${h.emoji}</div>
          <div class="item-info"><div class="item-name">${escapeHTML(h.name)}</div></div>
          ${h.id === currentId ? '<span class="badge badge-success">Actual</span>' : ''}
          <button class="icon-btn" data-action="edit-household" data-id="${h.id}" aria-label="Editar">✏️</button>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary btn-block mt-16" id="new-household-btn">➕ Crear vivienda</button>
  `, {
    onMount: (overlay) => {
      overlay.querySelectorAll('[data-household-id]').forEach((row) => {
        row.addEventListener('click', async (e) => {
          if (e.target.closest('[data-action="edit-household"]')) return;
          await setCurrentHouseholdId(row.dataset.householdId);
          closeModal();
          window.dispatchEvent(new CustomEvent('foodstock:household-switched'));
        });
      });
      overlay.querySelectorAll('[data-action="edit-household"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const household = households.find((h) => h.id === btn.dataset.id);
          openHouseholdFormModal(household);
        });
      });
      overlay.querySelector('#new-household-btn').addEventListener('click', () => openHouseholdFormModal(null));
    },
  });
}

function openHouseholdFormModal(existing) {
  let selectedEmoji = existing?.emoji || HOUSEHOLD_EMOJIS[0];
  let selectedColor = existing?.color || HOUSEHOLD_COLORS[0];

  openModal(`
    <div class="modal-header"><h3 class="modal-title">${existing ? 'Editar vivienda' : '➕ Nueva vivienda'}</h3></div>
    <form id="household-form">
      <div class="form-group">
        <label class="form-label" for="h-name">Nombre</label>
        <input class="form-control" id="h-name" name="name" required value="${existing ? escapeHTML(existing.name) : ''}" placeholder="Ej. Casa" />
      </div>
      <div class="form-group">
        <label class="form-label">Icono</label>
        <div class="emoji-picker" id="emoji-picker">
          ${HOUSEHOLD_EMOJIS.map((e) => `<button type="button" class="emoji-option ${e === selectedEmoji ? 'selected' : ''}" data-emoji="${e}">${e}</button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <div class="color-picker" id="color-picker">
          ${HOUSEHOLD_COLORS.map((c) => `<button type="button" class="color-option ${c === selectedColor ? 'selected' : ''}" data-color="${c}" style="background:${c};"></button>`).join('')}
        </div>
      </div>
      <div class="modal-actions">
        ${existing ? '<button type="button" class="btn btn-danger" id="delete-household-btn">Eliminar</button>' : '<button type="button" class="btn btn-secondary" id="cancel-household-btn">Cancelar</button>'}
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      overlay.querySelectorAll('#emoji-picker .emoji-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedEmoji = btn.dataset.emoji;
          overlay.querySelectorAll('#emoji-picker .emoji-option').forEach((b) => b.classList.toggle('selected', b === btn));
        });
      });
      overlay.querySelectorAll('#color-picker .color-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedColor = btn.dataset.color;
          overlay.querySelectorAll('#color-picker .color-option').forEach((b) => b.classList.toggle('selected', b === btn));
        });
      });

      overlay.querySelector('#cancel-household-btn')?.addEventListener('click', () => openHouseholdSwitcherModal());
      overlay.querySelector('#delete-household-btn')?.addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: 'Eliminar vivienda',
          message: `Se eliminará "${existing.name}" y todos sus alimentos, compra y calendario. Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
          danger: true,
        });
        if (!ok) return;
        try {
          await deleteHousehold(existing.id);
          closeModal();
          toast('Vivienda eliminada', 'success');
          window.dispatchEvent(new CustomEvent('foodstock:household-switched'));
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      overlay.querySelector('#household-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name').trim();
        if (!name) return;

        if (existing) {
          await updateHousehold(existing.id, { name, emoji: selectedEmoji, color: selectedColor });
          toast('Vivienda actualizada', 'success');
        } else {
          const household = await createHousehold({ name, emoji: selectedEmoji, color: selectedColor });
          await setCurrentHouseholdId(household.id);
          toast('Vivienda creada', 'success');
        }
        closeModal();
        window.dispatchEvent(new CustomEvent('foodstock:household-switched'));
      });
    },
  });
}
