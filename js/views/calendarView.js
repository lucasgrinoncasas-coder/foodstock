// views/calendarView.js — Planificación de comidas (calendario semanal/mensual).

import { getCurrentHouseholdId } from '../households.js';
import {
  getEntriesForDate, getEntriesForRange, createEntry, updateEntry, deleteEntry,
  copyEntry, repeatEntryWeekly, entryLabel, resolveMissingIngredients,
} from '../calendar.js';
import { getRecipes } from '../recipes.js';
import { MEAL_TYPES } from '../constants.js';
import { openModal, closeModal, confirmDialog } from '../ui.js';
import { toast, todayKey, addDays, startOfWeek, formatDateLabel, escapeHTML } from '../utils.js';

let weekStart = startOfWeek(todayKey());

export async function render(container) {
  const householdId = await getCurrentHouseholdId();

  container.innerHTML = `
    <h1 class="greeting">📅 Calendario</h1>
    <div class="week-nav">
      <button class="nav-btn" id="prev-week">‹</button>
      <strong id="week-label"></strong>
      <button class="nav-btn" id="next-week">›</button>
    </div>
    <div id="week-content" class="stack" style="gap:10px;"></div>
    <button class="btn btn-secondary btn-block mt-16" id="today-btn">Ir a hoy</button>
  `;

  container.querySelector('#prev-week').addEventListener('click', () => {
    weekStart = addDays(weekStart, -7);
    renderWeek(householdId);
  });
  container.querySelector('#next-week').addEventListener('click', () => {
    weekStart = addDays(weekStart, 7);
    renderWeek(householdId);
  });
  container.querySelector('#today-btn').addEventListener('click', () => {
    weekStart = startOfWeek(todayKey());
    renderWeek(householdId);
  });

  await renderWeek(householdId);
}

async function renderWeek(householdId) {
  const label = document.getElementById('week-label');
  const content = document.getElementById('week-content');
  if (!label || !content) return;

  const weekEnd = addDays(weekStart, 6);
  label.textContent = `${formatDateLabel(weekStart)} – ${formatDateLabel(weekEnd)}`;

  const entries = await getEntriesForRange(householdId, weekStart, weekEnd);
  const recipes = await getRecipes();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const html = [];
  for (const day of days) {
    const dayEntries = entries.filter((e) => e.date === day);
    html.push(`
      <div class="card day-card">
        <div class="day-title">${formatDateLabel(day)}${day === todayKey() ? ' · Hoy' : ''}</div>
        ${MEAL_TYPES.map((mt) => {
          const entry = dayEntries.find((e) => e.mealType === mt.id);
          const label = entry ? (entry.recipeId ? (recipeMap.get(entry.recipeId)?.name || 'Receta eliminada') : entry.customName) : null;
          return `
            <div class="meal-row" data-date="${day}" data-meal="${mt.id}" data-entry-id="${entry ? entry.id : ''}">
              <span class="meal-type">${mt.emoji} ${mt.label}</span>
              <span class="meal-content ${label ? '' : 'empty'}">${label ? escapeHTML(label) : 'Sin planificar'}</span>
              <div class="meal-actions">
                ${entry ? `
                  <button class="icon-btn" data-action="edit-entry" data-id="${entry.id}" aria-label="Editar">✏️</button>
                  <button class="icon-btn" data-action="delete-entry" data-id="${entry.id}" aria-label="Eliminar">🗑️</button>
                ` : `<button class="icon-btn" data-action="add-entry" data-date="${day}" data-meal="${mt.id}" aria-label="Añadir">➕</button>`}
              </div>
            </div>`;
        }).join('')}
      </div>`);
  }

  content.innerHTML = html.join('');
  wireEvents(content, householdId);
}

function wireEvents(root, householdId) {
  root.querySelectorAll('[data-action="add-entry"]').forEach((btn) => {
    btn.addEventListener('click', () => openAddCalendarEntryModal(householdId, btn.dataset.date, btn.dataset.meal, () => renderWeek(householdId)));
  });
  root.querySelectorAll('[data-action="edit-entry"]').forEach((btn) => {
    btn.addEventListener('click', () => openEditCalendarEntryModal(btn.dataset.id, householdId, () => renderWeek(householdId)));
  });
  root.querySelectorAll('[data-action="delete-entry"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Eliminar comida', message: '¿Quieres eliminar esta comida planificada?', confirmLabel: 'Eliminar', danger: true });
      if (ok) {
        await deleteEntry(btn.dataset.id);
        toast('Comida eliminada', 'success');
        renderWeek(householdId);
      }
    });
  });
}

export async function openAddCalendarEntryModal(householdId, date, presetMeal, onSaved) {
  const recipes = await getRecipes();
  openModal(`
    <div class="modal-header"><h3 class="modal-title">📅 Planificar comida</h3></div>
    <p class="text-muted">${formatDateLabel(date)}</p>
    <form id="entry-form" class="mt-16">
      <div class="form-group">
        <label class="form-label" for="ent-meal">Tipo de comida</label>
        <select class="form-control" id="ent-meal" name="mealType">
          ${MEAL_TYPES.map((mt) => `<option value="${mt.id}" ${presetMeal === mt.id ? 'selected' : ''}>${mt.emoji} ${mt.label}</option>`).join('')}
        </select>
      </div>
      <div class="tab-row" id="source-tabs">
        <button type="button" class="tab-btn active" data-source="recipe">Receta guardada</button>
        <button type="button" class="tab-btn" data-source="custom">Nombre libre</button>
      </div>
      <div class="form-group" id="recipe-select-group">
        <label class="form-label" for="ent-recipe">Receta</label>
        <select class="form-control" id="ent-recipe" name="recipeId">
          <option value="">Selecciona una receta…</option>
          ${recipes.map((r) => `<option value="${r.id}">${escapeHTML(r.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group hidden" id="custom-name-group">
        <label class="form-label" for="ent-custom">Nombre</label>
        <input class="form-control" id="ent-custom" name="customName" placeholder="Ej. Cena fuera" />
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-entry">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      let source = 'recipe';
      overlay.querySelectorAll('#source-tabs .tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          source = btn.dataset.source;
          overlay.querySelectorAll('#source-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
          overlay.querySelector('#recipe-select-group').classList.toggle('hidden', source !== 'recipe');
          overlay.querySelector('#custom-name-group').classList.toggle('hidden', source !== 'custom');
        });
      });

      overlay.querySelector('#cancel-entry').addEventListener('click', closeModal);
      overlay.querySelector('#entry-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const mealType = formData.get('mealType');
        const recipeId = source === 'recipe' ? formData.get('recipeId') : null;
        const customName = source === 'custom' ? formData.get('customName').trim() : null;
        if (source === 'recipe' && !recipeId) { toast('Selecciona una receta', 'error'); return; }
        if (source === 'custom' && !customName) { toast('Escribe un nombre', 'error'); return; }

        const entry = await createEntry({ householdId, date, mealType, recipeId: recipeId || null, customName });
        closeModal();
        toast('Comida planificada', 'success');

        if (recipeId) {
          const { missing } = await resolveMissingIngredients(entry.id, { autoAdd: false });
          if (missing.length) {
            const { getSetting } = await import('../settings.js');
            const autoAdd = await getSetting('autoAddMissingIngredients');
            if (autoAdd) {
              await resolveMissingIngredients(entry.id, { autoAdd: true });
              toast(`${missing.length} ingrediente(s) añadidos a la compra`, 'success');
            } else {
              offerMissingIngredients(entry, missing);
            }
          }
        }
        if (onSaved) onSaved();
        window.dispatchEvent(new CustomEvent('foodstock:refresh-home'));
      });
    },
  });
}

async function offerMissingIngredients(entry, missing) {
  const add = await confirmDialog({
    title: '🛒 Necesitas comprar',
    message: `Para esta receta te faltan: ${missing.map((m) => m.name).join(', ')}. ¿Quieres añadirlos a la lista de la compra?`,
    confirmLabel: 'Añadir ingredientes',
  });
  if (add) {
    await resolveMissingIngredients(entry.id, { autoAdd: true });
    toast('Ingredientes añadidos a la compra', 'success');
  }
}

async function openEditCalendarEntryModal(entryId, householdId, onSaved) {
  // Buscamos la entrada en todo el rango visible (semana actual)
  let entry = null;
  for (let i = 0; i < 7; i += 1) {
    const dayEntries = await getEntriesForDate(householdId, addDays(weekStart, i));
    const found = dayEntries.find((e) => e.id === entryId);
    if (found) { entry = found; break; }
  }
  if (!entry) return;

  const label = await entryLabel(entry);

  openModal(`
    <div class="modal-header"><h3 class="modal-title">${escapeHTML(label)}</h3></div>
    <p class="text-muted">${formatDateLabel(entry.date)} · ${MEAL_TYPES.find((m) => m.id === entry.mealType)?.label}</p>
    <div class="stack mt-16" style="gap:10px;">
      <div class="form-group">
        <label class="form-label" for="copy-date">Copiar a otro día</label>
        <div class="form-row">
          <input class="form-control" type="date" id="copy-date" />
          <button class="btn btn-secondary" id="copy-btn">Copiar</button>
        </div>
      </div>
      <button class="btn btn-secondary btn-block" id="repeat-btn">🔁 Repetir la próxima semana</button>
      <button class="btn btn-danger btn-block" id="delete-btn">Eliminar</button>
    </div>
  `, {
    onMount: (overlay) => {
      overlay.querySelector('#copy-btn').addEventListener('click', async () => {
        const targetDate = overlay.querySelector('#copy-date').value;
        if (!targetDate) { toast('Elige una fecha', 'error'); return; }
        await copyEntry(entryId, targetDate);
        closeModal();
        toast('Comida copiada', 'success');
        if (onSaved) onSaved();
      });
      overlay.querySelector('#repeat-btn').addEventListener('click', async () => {
        await repeatEntryWeekly(entryId, 1);
        closeModal();
        toast('Comida repetida la semana que viene', 'success');
        if (onSaved) onSaved();
      });
      overlay.querySelector('#delete-btn').addEventListener('click', async () => {
        await deleteEntry(entryId);
        closeModal();
        toast('Comida eliminada', 'success');
        if (onSaved) onSaved();
      });
    },
  });
}
