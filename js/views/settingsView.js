// views/settingsView.js — Ajustes de la aplicación.

import { getCurrentHouseholdId, getHousehold } from '../households.js';
import { getSettings, setSetting } from '../settings.js';
import { getStats } from '../stats.js';
import { db } from '../database.js';
import { applyTheme } from '../theme.js';
import { importRecipeCatalog } from '../recipes.js';
import { RECIPE_PACKS } from '../recipePacks.js';
import { openHouseholdSwitcherModal, refreshHouseholdTopbar } from './householdsView.js';
import { openModal, closeModal, confirmDialog, navigate } from '../ui.js';
import { toast, escapeHTML } from '../utils.js';
import { getCurrentUser, logout } from '../auth.js';

export async function render(container) {
  const householdId = await getCurrentHouseholdId();
  const household = householdId ? await getHousehold(householdId) : null;
  const settings = await getSettings();
  const stats = householdId ? await getStats(householdId) : null;

  container.innerHTML = `
    <h1 class="greeting">⚙️ Ajustes</h1>

    <section class="card mt-16">
      <div class="section-title"><span>👨‍👩‍👧‍👦 Cuenta familiar</span></div>
      <div class="row">
        <span class="text-muted" style="font-size:13.5px;">${escapeHTML(getCurrentUser()?.email || '')}</span>
        <button class="btn btn-sm btn-secondary" id="logout-btn">Cerrar sesión</button>
      </div>
      <p class="text-muted mt-8" style="font-size:12.5px;">Todos los dispositivos que inicien sesión con esta cuenta comparten y sincronizan los mismos datos.</p>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>🏠 Vivienda actual</span></div>
      <div class="row">
        <span>${household ? `${household.emoji} ${escapeHTML(household.name)}` : 'Sin vivienda'}</span>
        <button class="btn btn-sm btn-secondary" id="manage-households-btn">Gestionar</button>
      </div>
    </section>

    ${stats ? `
    <section class="card mt-16">
      <div class="section-title"><span>📊 Estadísticas</span></div>
      <div class="grid-2 mt-8">
        <div class="stat-card"><span class="stat-emoji">📦</span><div class="stat-value">${stats.storedProducts}</div><div class="stat-label">Productos almacenados</div></div>
        <div class="stat-card"><span class="stat-emoji">🛒</span><div class="stat-value">${stats.purchasedThisMonth}</div><div class="stat-label">Comprados este mes</div></div>
        <div class="stat-card"><span class="stat-emoji">🍽️</span><div class="stat-value">${stats.plannedMeals}</div><div class="stat-label">Comidas planificadas</div></div>
        <div class="stat-card"><span class="stat-emoji">⚠️</span><div class="stat-value">${stats.lowStock}</div><div class="stat-label">Con poco stock</div></div>
      </div>
    </section>` : ''}

    <section class="card mt-16">
      <div class="section-title"><span>🎨 Apariencia</span></div>
      <div class="switch-row">
        <div>
          <div class="switch-label">Tema</div>
          <div class="switch-desc">Claro, oscuro o según el sistema</div>
        </div>
        <select class="form-control" id="theme-select" style="width:auto;">
          <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>Sistema</option>
          <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Claro</option>
          <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Oscuro</option>
        </select>
      </div>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>🔔 Notificaciones y avisos</span></div>
      ${switchRow('notificationsEnabled', 'Notificaciones', 'Estructura preparada para futuras alertas', settings.notificationsEnabled)}
      ${switchRow('lowStockAlerts', 'Avisos de productos bajos', 'Muestra avisos cuando un producto escasea', settings.lowStockAlerts)}
      ${switchRow('expiryAlerts', 'Avisos de caducidad', 'Muestra fechas de caducidad y avisos', settings.expiryAlerts)}
      ${switchRow('autoAddMissingIngredients', 'Añadir ingredientes faltantes automáticamente', 'Al planificar una receta, añade a la compra sin preguntar', settings.autoAddMissingIngredients)}
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>💾 Copia de seguridad</span></div>
      <div class="stack" style="gap:10px;">
        <button class="btn btn-secondary btn-block" id="export-btn">⬇️ Exportar datos</button>
        <label class="btn btn-secondary btn-block" for="import-input" style="cursor:pointer;">⬆️ Importar datos</label>
        <input type="file" id="import-input" accept="application/json" class="hidden" />
      </div>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>📚 Catálogos de recetas</span></div>
      <p class="text-muted">Añade recetas predeterminadas a tu recetario. No duplica las que ya tengas con el mismo nombre.</p>
      <div class="stack mt-16" style="gap:10px;">
        ${RECIPE_PACKS.map((pack) => `
          <div class="list-item">
            <div class="item-emoji">${pack.icon}</div>
            <div class="item-info">
              <div class="item-name">${escapeHTML(pack.title)}</div>
              <div class="item-meta"><span>${pack.catalog.length} recetas</span></div>
            </div>
            <button class="btn btn-sm btn-primary" data-action="load-pack" data-pack="${pack.id}">Cargar</button>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>🧹 Datos</span></div>
      <div class="stack" style="gap:10px;">
        <button class="btn btn-secondary btn-block" id="restore-demo-btn">Restaurar datos de demostración</button>
        <button class="btn btn-danger btn-block" id="delete-all-btn">Borrar todos los datos</button>
      </div>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>ℹ️ Información</span></div>
      <p class="text-muted">FoodStock v1.0 — Gestiona la comida de tu casa: nevera, congelador, despensa, lista de la compra, calendario de comidas y recomendaciones con IA. Los datos se sincronizan entre dispositivos de tu familia a través de Firebase.</p>
    </section>
  `;

  wireEvents(container, householdId);
}

function switchRow(key, label, desc, checked) {
  return `
    <div class="switch-row">
      <div>
        <div class="switch-label">${label}</div>
        <div class="switch-desc">${desc}</div>
      </div>
      <label class="switch">
        <input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} />
        <span class="switch-track"></span>
      </label>
    </div>`;
}

function wireEvents(container, householdId) {
  container.querySelector('#manage-households-btn').addEventListener('click', openHouseholdSwitcherModal);

  container.querySelector('#logout-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Cerrar sesión',
      message: 'Volverás a la pantalla de acceso en este dispositivo. Tus datos seguirán a salvo en la nube.',
      confirmLabel: 'Cerrar sesión',
    });
    if (ok) await logout();
  });

  container.querySelector('#theme-select').addEventListener('change', async (e) => {
    await setSetting('theme', e.target.value);
    applyTheme(e.target.value);
    toast('Tema actualizado', 'success');
  });

  container.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('change', async () => {
      await setSetting(input.dataset.setting, input.checked);
      toast('Ajuste guardado', 'success');
    });
  });

  container.querySelector('#export-btn').addEventListener('click', async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodstock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Copia de seguridad descargada', 'success');
  });

  container.querySelector('#import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const ok = await confirmDialog({
        title: 'Importar datos',
        message: 'Esto reemplazará todos tus datos actuales por los de la copia de seguridad. ¿Continuar?',
        confirmLabel: 'Importar',
        danger: true,
      });
      if (!ok) return;
      await db.importAll(data);
      toast('Datos importados correctamente', 'success');
      await refreshHouseholdTopbar();
      navigate('/inicio');
    } catch (err) {
      toast('El archivo no es una copia de seguridad válida', 'error');
    }
    e.target.value = '';
  });

  container.querySelectorAll('[data-action="load-pack"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const pack = RECIPE_PACKS.find((p) => p.id === btn.dataset.pack);
      if (!pack) return;
      btn.disabled = true;
      const added = await importRecipeCatalog(pack.catalog);
      btn.disabled = false;
      if (added.length) {
        toast(`${added.length} receta(s) añadidas de "${pack.title}"`, 'success');
      } else {
        toast('Ya tenías todas las recetas de este catálogo', 'info');
      }
    });
  });

  container.querySelector('#restore-demo-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Restaurar datos de demostración',
      message: 'Se creará una nueva vivienda de demostración "Casa" con productos, recetas y comidas de ejemplo.',
      confirmLabel: 'Restaurar',
    });
    if (!ok) return;
    const { seedDemoData } = await import('../demoData.js');
    const household = await seedDemoData();
    const { setCurrentHouseholdId } = await import('../households.js');
    await setCurrentHouseholdId(household.id);
    toast('Datos de demostración creados', 'success');
    await refreshHouseholdTopbar();
    navigate('/inicio');
  });

  container.querySelector('#delete-all-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Borrar todos los datos',
      message: 'Se eliminarán permanentemente todas las viviendas, alimentos, compra, recetas y calendario. Esta acción no se puede deshacer.',
      confirmLabel: 'Borrar todo',
      danger: true,
    });
    if (!ok) return;
    await db.clearAll();
    toast('Todos los datos han sido eliminados', 'success');
    window.dispatchEvent(new CustomEvent('foodstock:data-cleared'));
  });
}
