// views/recipesView.js — Recetas: listado, detalle, alta/edición y planificación.

import { getCurrentHouseholdId } from '../households.js';
import {
  getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe,
  toggleFavoriteRecipe, checkAvailability,
} from '../recipes.js';
import { createEntry, resolveMissingIngredients } from '../calendar.js';
import { addItem as addShoppingItem } from '../shopping.js';
import { getSetting } from '../settings.js';
import { RECIPE_CATEGORIES, DIFFICULTIES, MEAL_TYPES, UNITS } from '../constants.js';
import { emptyState, recipeCardMini } from '../components.js';
import { openModal, closeModal, confirmDialog } from '../ui.js';
import { escapeHTML, toast, todayKey } from '../utils.js';

let state = { category: null, favoritesOnly: false };

export async function render(container) {
  const householdId = await getCurrentHouseholdId();

  container.innerHTML = `
    <h1 class="greeting">🍳 Recetas</h1>
    <div class="chip-row" id="recipe-filters">
      <button class="chip ${state.favoritesOnly ? 'active' : ''}" data-toggle="favoritesOnly">⭐ Favoritas</button>
      ${RECIPE_CATEGORIES.map((c) => `<button class="chip ${state.category === c ? 'active' : ''}" data-category="${c}">${c}</button>`).join('')}
    </div>
    <div id="recipe-list" class="stack mt-16" style="gap:8px;"></div>
    <button class="fab" id="fab-add-recipe" aria-label="Añadir receta">+</button>
  `;

  container.querySelectorAll('#recipe-filters [data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.favoritesOnly = !state.favoritesOnly;
      btn.classList.toggle('active', state.favoritesOnly);
      refresh(householdId);
    });
  });
  container.querySelectorAll('#recipe-filters [data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = state.category === btn.dataset.category ? null : btn.dataset.category;
      container.querySelectorAll('#recipe-filters [data-category]').forEach((b) => b.classList.toggle('active', b.dataset.category === state.category));
      refresh(householdId);
    });
  });

  container.querySelector('#fab-add-recipe').addEventListener('click', () => openRecipeFormModal(householdId));

  await refresh(householdId);
}

async function refresh(householdId) {
  const listEl = document.getElementById('recipe-list');
  if (!listEl) return;
  let recipes = await getRecipes();
  if (state.favoritesOnly) recipes = recipes.filter((r) => r.favorite);
  if (state.category) recipes = recipes.filter((r) => r.category === state.category);

  if (!recipes.length) {
    listEl.innerHTML = emptyState('🍳', 'No hay recetas con estos filtros. Añade una nueva.');
    return;
  }

  const withMatch = await Promise.all(recipes.map(async (r) => {
    const { available } = await checkAvailability(r.id, householdId);
    const ratio = r.ingredients.length ? available.length / r.ingredients.length : 0;
    return { recipe: r, ratio };
  }));

  listEl.innerHTML = withMatch.map(({ recipe, ratio }) => recipeCardMini(recipe, ratio)).join('');
  listEl.querySelectorAll('[data-action="open-recipe"]').forEach((el) => {
    el.addEventListener('click', () => openRecipeDetailModal(el.dataset.recipeId, householdId));
  });
}

async function openRecipeDetailModal(recipeId, householdId) {
  const recipe = await getRecipe(recipeId);
  if (!recipe) return;
  const { available, missing } = await checkAvailability(recipeId, householdId);

  const ingredientRows = recipe.ingredients.map((ing) => {
    const has = available.some((a) => a.name === ing.name);
    return `<div class="ingredient-check"><span>${has ? '✅' : '❌'} ${escapeHTML(ing.name)}</span><span class="text-muted">${ing.quantity ? `${ing.quantity} ${ing.unit || ''}` : ''}</span></div>`;
  }).join('');

  const nutritionHTML = recipe.nutrition ? `
    <div class="nutrition-grid">
      <div class="nutrition-item"><div class="nutrition-value">${recipe.nutrition.calories ?? '–'}</div><div class="nutrition-label">kcal</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${recipe.nutrition.protein ?? '–'}g</div><div class="nutrition-label">Proteína</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${recipe.nutrition.carbs ?? '–'}g</div><div class="nutrition-label">Carbos</div></div>
      <div class="nutrition-item"><div class="nutrition-value">${recipe.nutrition.fat ?? '–'}g</div><div class="nutrition-label">Grasas</div></div>
    </div>
    <p class="nutrition-disclaimer">Información orientativa, no sustituye el consejo de un profesional.</p>
  ` : '';

  openModal(`
    <div class="modal-header">
      <h3 class="modal-title">${escapeHTML(recipe.name)}</h3>
      <button class="star-btn" id="fav-recipe-btn">${recipe.favorite ? '⭐' : '☆'}</button>
    </div>
    <p class="recipe-meta">${recipe.time ? `⏱️ ${recipe.time} min · ` : ''}${recipe.difficulty} · ${recipe.category}</p>

    <div class="section-title mt-16"><span>Ingredientes</span></div>
    ${ingredientRows}

    ${missing.length ? `<button class="btn btn-secondary btn-block mt-16" id="add-missing-btn">🛒 Añadir ingredientes faltantes a la compra</button>` : ''}

    ${recipe.steps.length ? `
      <div class="section-title mt-16"><span>Pasos</span></div>
      ${recipe.steps.map((s, i) => `<div class="step-item"><span class="step-num">${i + 1}</span><span>${escapeHTML(s)}</span></div>`).join('')}
    ` : ''}

    ${nutritionHTML}

    <div class="modal-actions">
      <button class="btn btn-secondary" id="edit-recipe-btn">Editar</button>
      <button class="btn btn-primary" id="plan-recipe-btn">📅 Planificar comida</button>
    </div>
    <button class="btn btn-danger btn-block mt-16" id="delete-recipe-btn">Eliminar receta</button>
  `, {
    onMount: (overlay) => {
      overlay.querySelector('#fav-recipe-btn').addEventListener('click', async () => {
        await toggleFavoriteRecipe(recipeId);
        closeModal();
        openRecipeDetailModal(recipeId, householdId);
      });

      overlay.querySelector('#add-missing-btn')?.addEventListener('click', async () => {
        await Promise.all(missing.map((ing) => addShoppingItem({
          householdId, name: ing.name, quantity: 1, unit: ing.unit || 'unidades', category: 'otros', linkedRecipeId: recipeId,
        })));
        toast('Ingredientes añadidos a la compra', 'success');
        closeModal();
      });

      overlay.querySelector('#edit-recipe-btn').addEventListener('click', () => {
        closeModal();
        openRecipeFormModal(householdId, recipe);
      });

      overlay.querySelector('#plan-recipe-btn').addEventListener('click', () => {
        closeModal();
        openPlanRecipeModal(recipe, householdId);
      });

      overlay.querySelector('#delete-recipe-btn').addEventListener('click', async () => {
        const ok = await confirmDialog({ title: 'Eliminar receta', message: `¿Eliminar "${recipe.name}"?`, confirmLabel: 'Eliminar', danger: true });
        if (ok) {
          await deleteRecipe(recipeId);
          closeModal();
          toast('Receta eliminada', 'success');
          refresh(householdId);
        }
      });
    },
  });
}

function openPlanRecipeModal(recipe, householdId) {
  openModal(`
    <div class="modal-header"><h3 class="modal-title">📅 Planificar "${escapeHTML(recipe.name)}"</h3></div>
    <form id="plan-form">
      <div class="form-group">
        <label class="form-label" for="plan-date">Fecha</label>
        <input class="form-control" id="plan-date" name="date" type="date" value="${todayKey()}" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="plan-meal">Tipo de comida</label>
        <select class="form-control" id="plan-meal" name="mealType">
          ${MEAL_TYPES.map((mt) => `<option value="${mt.id}">${mt.emoji} ${mt.label}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-plan">Cancelar</button>
        <button type="submit" class="btn btn-primary">Planificar</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      overlay.querySelector('#cancel-plan').addEventListener('click', closeModal);
      overlay.querySelector('#plan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entry = await createEntry({
          householdId, date: formData.get('date'), mealType: formData.get('mealType'), recipeId: recipe.id,
        });
        closeModal();
        toast('Comida planificada', 'success');

        const { missing } = await resolveMissingIngredients(entry.id, { autoAdd: false });
        if (missing.length) {
          const autoAdd = await getSetting('autoAddMissingIngredients');
          if (autoAdd) {
            await resolveMissingIngredients(entry.id, { autoAdd: true });
            toast(`${missing.length} ingrediente(s) añadidos a la compra`, 'success');
          } else {
            const add = await confirmDialog({
              title: '🛒 Necesitas comprar',
              message: `Te faltan: ${missing.map((m) => m.name).join(', ')}. ¿Añadir a la compra?`,
              confirmLabel: 'Añadir',
            });
            if (add) {
              await resolveMissingIngredients(entry.id, { autoAdd: true });
              toast('Ingredientes añadidos a la compra', 'success');
            }
          }
        }
        window.dispatchEvent(new CustomEvent('foodstock:refresh-home'));
      });
    },
  });
}

function openRecipeFormModal(householdId, existing = null) {
  const ingredients = existing ? [...existing.ingredients] : [{ name: '', quantity: '', unit: 'g' }];
  const steps = existing ? [...existing.steps] : [''];
  let photoDataUrl = existing?.photo || null;

  openModal(`
    <div class="modal-header"><h3 class="modal-title">${existing ? 'Editar receta' : '🍳 Nueva receta'}</h3></div>
    <form id="recipe-form">
      <div class="form-group">
        <label class="form-label" for="r-name">Nombre</label>
        <input class="form-control" id="r-name" name="name" required value="${existing ? escapeHTML(existing.name) : ''}" placeholder="Ej. Pasta boloñesa" />
      </div>
      <div class="form-group">
        <label class="form-label">Foto (opcional)</label>
        <div class="row" style="gap:12px;">
          <div class="recipe-photo" id="photo-preview" style="width:64px;height:64px;">${photoDataUrl ? `<img src="${photoDataUrl}" alt="">` : '🍽️'}</div>
          <div class="stack" style="gap:6px;flex:1;">
            <input type="file" id="r-photo" accept="image/*" class="form-control" />
            ${photoDataUrl ? '<button type="button" class="btn btn-ghost" id="remove-photo-btn" style="padding:4px 0;">Quitar foto</button>' : ''}
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="r-time">Tiempo (min)</label>
          <input class="form-control" id="r-time" name="time" type="number" min="0" value="${existing?.time || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="r-difficulty">Dificultad</label>
          <select class="form-control" id="r-difficulty" name="difficulty">
            ${DIFFICULTIES.map((d) => `<option value="${d}" ${existing?.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="r-category">Categoría</label>
        <select class="form-control" id="r-category" name="category">
          ${RECIPE_CATEGORIES.map((c) => `<option value="${c}" ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Ingredientes</label>
        <div id="ingredients-list" class="stack" style="gap:8px;"></div>
        <button type="button" class="btn btn-ghost" id="add-ingredient-btn">+ Añadir ingrediente</button>
      </div>

      <div class="form-group">
        <label class="form-label">Pasos</label>
        <div id="steps-list" class="stack" style="gap:8px;"></div>
        <button type="button" class="btn btn-ghost" id="add-step-btn">+ Añadir paso</button>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-recipe">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar receta</button>
      </div>
    </form>
  `, {
    onMount: (overlay) => {
      const ingredientsList = overlay.querySelector('#ingredients-list');
      const stepsList = overlay.querySelector('#steps-list');

      function renderIngredientRow(ing = { name: '', quantity: '', unit: 'g' }) {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.innerHTML = `
          <input class="form-control ing-name" placeholder="Ingrediente" value="${escapeHTML(ing.name)}" style="flex:2;" />
          <input class="form-control ing-qty" type="number" min="0" step="0.1" placeholder="Cant." value="${ing.quantity ?? ''}" style="flex:1;" />
          <select class="form-control ing-unit" style="flex:1;">
            ${UNITS.map((u) => `<option value="${u}" ${ing.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <button type="button" class="icon-btn remove-ing" aria-label="Quitar">✕</button>
        `;
        row.querySelector('.remove-ing').addEventListener('click', () => row.remove());
        ingredientsList.appendChild(row);
      }

      function renderStepRow(text = '') {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.innerHTML = `
          <input class="form-control step-text" placeholder="Describe el paso" value="${escapeHTML(text)}" style="flex:3;" />
          <button type="button" class="icon-btn remove-step" aria-label="Quitar">✕</button>
        `;
        row.querySelector('.remove-step').addEventListener('click', () => row.remove());
        stepsList.appendChild(row);
      }

      ingredients.forEach(renderIngredientRow);
      steps.forEach(renderStepRow);

      overlay.querySelector('#add-ingredient-btn').addEventListener('click', () => renderIngredientRow());
      overlay.querySelector('#add-step-btn').addEventListener('click', () => renderStepRow());
      overlay.querySelector('#cancel-recipe').addEventListener('click', closeModal);

      overlay.querySelector('#remove-photo-btn')?.addEventListener('click', () => {
        photoDataUrl = null;
        overlay.querySelector('#photo-preview').innerHTML = '🍽️';
      });

      overlay.querySelector('#r-photo').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          photoDataUrl = await resizeImageToDataUrl(file, 480);
          overlay.querySelector('#photo-preview').innerHTML = `<img src="${photoDataUrl}" alt="">`;
        } catch (err) {
          toast('No se ha podido leer la imagen', 'error');
        }
      });

      overlay.querySelector('#recipe-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const ingredientRows = [...ingredientsList.querySelectorAll('.form-row')].map((row) => ({
          name: row.querySelector('.ing-name').value.trim(),
          quantity: Number(row.querySelector('.ing-qty').value) || null,
          unit: row.querySelector('.ing-unit').value,
        })).filter((i) => i.name);

        const stepTexts = [...stepsList.querySelectorAll('.step-text')].map((i) => i.value.trim()).filter(Boolean);

        const payload = {
          name: formData.get('name').trim(),
          photo: photoDataUrl,
          time: formData.get('time') ? Number(formData.get('time')) : null,
          difficulty: formData.get('difficulty'),
          category: formData.get('category'),
          ingredients: ingredientRows,
          steps: stepTexts,
        };

        if (existing) {
          await updateRecipe(existing.id, payload);
          toast('Receta actualizada', 'success');
        } else {
          await createRecipe(payload);
          toast('Receta creada', 'success');
        }
        closeModal();
        refresh(householdId);
      });
    },
  });
}

function resizeImageToDataUrl(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export { openRecipeFormModal, openRecipeDetailModal };
