// views/home.js — Pantalla de inicio: resumen de la vivienda.

import { getCurrentHouseholdId } from '../households.js';
import { countByLocation, getLowStock, getExpiringSoon } from '../products.js';
import { getPendingItems } from '../shopping.js';
import { getEntriesForDate, entryLabel } from '../calendar.js';
import { getRecommendation } from '../aiService.js';
import { navigate } from '../ui.js';
import { escapeHTML, todayKey, addDays } from '../utils.js';
import { openAddProductModal } from './inventory.js';
import { openQuickCookModal } from './ai.js';
import { openAddCalendarEntryModal } from './calendarView.js';
import { openAddShoppingItemModal } from './shoppingView.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 13) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export async function render(container) {
  const householdId = await getCurrentHouseholdId();
  if (!householdId) {
    container.innerHTML = `<div class="empty-state"><span class="emoji">🏠</span><p>No hay ninguna vivienda creada todavía.</p></div>`;
    return;
  }

  const [counts, pending, lowStock, expiring] = await Promise.all([
    countByLocation(householdId),
    getPendingItems(householdId),
    getLowStock(householdId),
    getExpiringSoon(householdId, 3),
  ]);

  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const [todayEntries, tomorrowEntries] = await Promise.all([
    getEntriesForDate(householdId, today),
    getEntriesForDate(householdId, tomorrow),
  ]);

  container.innerHTML = `
    <h1 class="greeting">${greeting()} 👋</h1>
    <p class="greeting-sub">Esto es lo que tienes en casa</p>

    <div class="grid-3">
      <div class="stat-card" data-nav="/alimentos?location=nevera">
        <span class="stat-emoji">🧊</span>
        <div class="stat-value">${counts.nevera}</div>
        <div class="stat-label">Nevera</div>
      </div>
      <div class="stat-card" data-nav="/alimentos?location=congelador">
        <span class="stat-emoji">❄️</span>
        <div class="stat-value">${counts.congelador}</div>
        <div class="stat-label">Congelador</div>
      </div>
      <div class="stat-card" data-nav="/alimentos?location=despensa">
        <span class="stat-emoji">🥫</span>
        <div class="stat-value">${counts.despensa}</div>
        <div class="stat-label">Despensa</div>
      </div>
    </div>

    <div class="quick-actions">
      <button class="quick-action" id="qa-add-food"><span class="qa-emoji">➕</span> Añadir alimento</button>
      <button class="quick-action" id="qa-add-shopping"><span class="qa-emoji">🛒</span> Añadir a compra</button>
      <button class="quick-action" id="qa-cook"><span class="qa-emoji">🍳</span> ¿Qué cocino?</button>
      <button class="quick-action" id="qa-plan"><span class="qa-emoji">📅</span> Planificar comida</button>
    </div>

    <div class="stack mt-16">
      <section class="card">
        <div class="section-title">
          <span>🛒 Lista de compra</span>
          <span class="link" data-nav="/compra">Ver todo</span>
        </div>
        ${pending.length
          ? `<p class="text-muted mt-8">${pending.length} producto${pending.length === 1 ? '' : 's'} pendiente${pending.length === 1 ? '' : 's'}</p>
             <ul class="mt-8">${pending.slice(0, 5).map((i) => `<li>• ${escapeHTML(i.name)}</li>`).join('')}</ul>
             <button class="btn btn-secondary btn-block mt-16" data-nav="/compra">Ver lista de compra</button>`
          : `<p class="text-muted mt-8">No tienes nada pendiente por comprar 🎉</p>`
        }
      </section>

      ${(lowStock.length || expiring.length) ? `
      <section class="card">
        <div class="section-title"><span>⚠️ Productos que se están acabando</span></div>
        <ul class="stack" style="gap:8px;">
          ${lowStock.map((p) => `<li class="row"><span>${escapeHTML(p.name)}</span><button class="btn btn-sm btn-secondary" data-action="add-to-shopping-from-home" data-id="${p.id}" data-name="${escapeHTML(p.name)}">Añadir a compra</button></li>`).join('')}
          ${expiring.filter(e => !lowStock.some(l => l.id === e.id)).map((p) => `<li class="row"><span>${p.daysLeft < 0 ? '🔴' : '🟡'} ${escapeHTML(p.name)}</span><span class="text-muted" style="font-size:12px;">${p.daysLeft < 0 ? 'Caducado' : `Caduca en ${p.daysLeft}d`}</span></li>`).join('')}
        </ul>
      </section>` : ''}

      <section class="card">
        <div class="section-title">
          <span>📅 Próximas comidas</span>
          <span class="link" data-nav="/calendario">Ver calendario</span>
        </div>
        ${await renderUpcoming(today, todayEntries, tomorrow, tomorrowEntries)}
      </section>

      <section class="card" id="ai-recommendation-card">
        <div class="section-title"><span>🤖 Recomendación</span></div>
        <p class="text-muted mt-8" id="ai-rec-text">Pensando en algo rico para ti…</p>
        <button class="btn btn-primary btn-block mt-16" data-nav="/ia">Ver recomendaciones</button>
      </section>
    </div>
  `;

  wireEvents(container, householdId);
  loadRecommendation(householdId);
}

async function renderUpcoming(today, todayEntries, tomorrow, tomorrowEntries) {
  const blocks = [];
  for (const [label, dateKey, entries] of [['Hoy', today, todayEntries], ['Mañana', tomorrow, tomorrowEntries]]) {
    if (!entries.length) continue;
    const labels = await Promise.all(entries.map(entryLabel));
    blocks.push(`
      <div class="mt-8">
        <strong style="font-size:13px;">${label}</strong>
        <div class="text-muted" style="font-size:13.5px;">${labels.join(' · ')}</div>
      </div>`);
  }
  if (!blocks.length) {
    return `<p class="text-muted mt-8">No tienes comidas planificadas próximamente.</p>`;
  }
  return blocks.join('');
}

async function loadRecommendation(householdId) {
  try {
    const { text } = await getRecommendation(householdId);
    const el = document.getElementById('ai-rec-text');
    if (el) el.textContent = text;
  } catch (err) {
    const el = document.getElementById('ai-rec-text');
    if (el) el.textContent = 'No he podido generar una recomendación ahora mismo.';
  }
}

function wireEvents(container, householdId) {
  container.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  container.querySelector('#qa-add-food')?.addEventListener('click', () => openAddProductModal(householdId));
  container.querySelector('#qa-add-shopping')?.addEventListener('click', () => openAddShoppingItemModal(householdId));
  container.querySelector('#qa-cook')?.addEventListener('click', () => openQuickCookModal(householdId));
  container.querySelector('#qa-plan')?.addEventListener('click', () => openAddCalendarEntryModal(householdId, todayKey()));

  container.querySelectorAll('[data-action="add-to-shopping-from-home"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { addItem } = await import('../shopping.js');
      const { toast } = await import('../utils.js');
      await addItem({ householdId, name: btn.dataset.name, quantity: 1, unit: 'unidades', category: 'otros', linkedProductId: btn.dataset.id });
      toast(`${btn.dataset.name} añadido a la compra`, 'success');
      btn.closest('li').remove();
    });
  });
}
