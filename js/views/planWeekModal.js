// views/planWeekModal.js — Interfaz para la planificación semanal con IA.

import { PLAN_GOALS, detectGoalsFromText, generateWeeklyPlan } from '../mealPlanner.js';
import { openModal, closeModal, navigate } from '../ui.js';
import { escapeHTML, toast, debounce, formatDateLabel } from '../utils.js';

const MEAL_OPTIONS = [
  { id: 'desayuno', label: '🥣 Desayuno', defaultOn: false },
  { id: 'comida', label: '🍝 Comida', defaultOn: true },
  { id: 'cena', label: '🥗 Cena', defaultOn: true },
];

export function openPlanWeekModal(householdId) {
  const selectedGoals = new Set();
  const selectedMeals = new Set(MEAL_OPTIONS.filter((m) => m.defaultOn).map((m) => m.id));

  openModal(`
    <div class="modal-header"><h3 class="modal-title">📅 Planificar mi semana</h3></div>
    <p class="text-muted">Cuéntame qué necesitas y elegiré recetas de tu recetario para rellenar el calendario de esta semana.</p>

    <div class="form-group mt-16">
      <input class="form-control" id="plan-free-text" placeholder="Ej. tengo poco tiempo y quiero perder peso" autocomplete="off" />
    </div>

    <div class="chip-row" id="goal-chips">
      ${PLAN_GOALS.map((g) => `<button type="button" class="chip" data-goal="${g.id}">${g.label}</button>`).join('')}
    </div>

    <div class="form-group mt-16">
      <label class="form-label">Comidas a planificar</label>
      <div class="chip-row" id="meal-chips">
        ${MEAL_OPTIONS.map((m) => `<button type="button" class="chip ${m.defaultOn ? 'active' : ''}" data-meal="${m.id}">${m.label}</button>`).join('')}
      </div>
    </div>

    <div class="switch-row">
      <div>
        <div class="switch-label">Sobrescribir lo ya planificado</div>
        <div class="switch-desc">Si lo dejas apagado, solo se rellenan los huecos vacíos de esta semana</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="plan-overwrite" />
        <span class="switch-track"></span>
      </label>
    </div>

    <p class="nutrition-disclaimer mt-8">Los ingredientes que no tengas en casa se añadirán automáticamente a tu lista de la compra.</p>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" id="cancel-plan-week">Cancelar</button>
      <button type="button" class="btn btn-primary" id="generate-plan-btn">Generar planificación</button>
    </div>
  `, {
    onMount: (overlay) => {
      const chipsEl = overlay.querySelector('#goal-chips');

      function syncGoalChips() {
        chipsEl.querySelectorAll('[data-goal]').forEach((btn) => {
          btn.classList.toggle('active', selectedGoals.has(btn.dataset.goal));
        });
      }

      chipsEl.querySelectorAll('[data-goal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.goal;
          if (selectedGoals.has(id)) selectedGoals.delete(id);
          else selectedGoals.add(id);
          syncGoalChips();
        });
      });

      overlay.querySelector('#plan-free-text').addEventListener('input', debounce((e) => {
        detectGoalsFromText(e.target.value).forEach((id) => selectedGoals.add(id));
        syncGoalChips();
      }, 350));

      overlay.querySelectorAll('#meal-chips [data-meal]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.meal;
          if (selectedMeals.has(id)) selectedMeals.delete(id);
          else selectedMeals.add(id);
          btn.classList.toggle('active', selectedMeals.has(id));
        });
      });

      overlay.querySelector('#cancel-plan-week').addEventListener('click', closeModal);

      overlay.querySelector('#generate-plan-btn').addEventListener('click', async (e) => {
        if (!selectedMeals.size) {
          toast('Elige al menos una comida a planificar', 'error');
          return;
        }
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Generando…';

        const overwrite = overlay.querySelector('#plan-overwrite').checked;
        const result = await generateWeeklyPlan(householdId, {
          goals: [...selectedGoals],
          meals: [...selectedMeals],
          overwrite,
        });

        if (result.error === 'no-recipes') {
          toast('Todavía no tienes recetas guardadas. Añade alguna primero en 🍳 Recetas.', 'error');
          btn.disabled = false;
          btn.textContent = 'Generar planificación';
          return;
        }

        renderPlanResult(overlay, result);
      });
    },
  });
}

function renderPlanResult(overlay, result) {
  const { created, skipped, missingAdded } = result;

  const rows = created.map((c) => `<li>${formatDateLabel(c.date)} · ${c.mealType}: <strong>${escapeHTML(c.recipe.name)}</strong></li>`);

  overlay.innerHTML = `
    <div class="modal-header"><h3 class="modal-title">✅ Planificación generada</h3></div>
    <p class="text-muted">${created.length} comida${created.length === 1 ? '' : 's'} añadida${created.length === 1 ? '' : 's'} a tu calendario${skipped.length ? ` · ${skipped.length} ya estaban planificadas y se han mantenido` : ''}.</p>

    <div class="stack mt-16" style="gap:4px;max-height:220px;overflow-y:auto;">
      <ul style="font-size:13.5px;line-height:1.6;">${rows.join('')}</ul>
    </div>

    ${missingAdded.length ? `
      <div class="card mt-16" style="background:var(--color-surface-alt);border:none;">
        <div class="section-title"><span>🛒 Añadido a la compra</span></div>
        <p class="text-muted">${missingAdded.map((i) => escapeHTML(i.name)).join(', ')}</p>
      </div>
    ` : `<p class="text-muted mt-16">Ya tenías en casa todos los ingredientes necesarios. 🎉</p>`}

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" id="close-plan-result">Cerrar</button>
      <button type="button" class="btn btn-primary" id="view-calendar-btn">Ver calendario</button>
    </div>
  `;

  overlay.querySelector('#close-plan-result').addEventListener('click', closeModal);
  overlay.querySelector('#view-calendar-btn').addEventListener('click', () => {
    closeModal();
    navigate('/calendario');
  });

  window.dispatchEvent(new CustomEvent('foodstock:refresh-home'));
}
