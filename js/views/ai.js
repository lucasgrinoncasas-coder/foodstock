// views/ai.js — FoodStock IA: chat, recomendaciones y "¿qué puedo cocinar?".

import { getCurrentHouseholdId } from '../households.js';
import { chatWithAI, whatCanICook, isRemoteAIConfigured } from '../aiService.js';
import { suggestRecipes } from '../recipes.js';
import { openModal, closeModal, navigate } from '../ui.js';
import { escapeHTML } from '../utils.js';
import { recipeCardMini } from '../components.js';
import { openRecipeDetailModal } from './recipesView.js';
import { openPlanWeekModal } from './planWeekModal.js';

const SUGGESTIONS = [
  '¿Qué puedo cocinar con lo que tengo?',
  '¿Qué ceno hoy?',
  'Dame una idea rápida',
  'Algo saludable para hoy',
];

let chatHistory = [];

export async function render(container) {
  const householdId = await getCurrentHouseholdId();

  container.innerHTML = `
    <h1 class="greeting">🤖 FoodStock IA</h1>
    <p class="greeting-sub">${isRemoteAIConfigured() ? 'Conectado a tu asistente de IA' : 'Funcionando en modo local, sin conexión externa'}</p>

    <section class="card" style="background:var(--color-primary-soft);border:none;">
      <div class="section-title"><span>📅 Planificación semanal con IA</span></div>
      <p class="text-muted">Dime si tienes poco tiempo, quieres aprovechar lo que ya tienes, perder peso o ahorrar, y te relleno el calendario de la semana con tus recetas. Lo que te falte va directo a la compra.</p>
      <button class="btn btn-primary btn-block mt-16" id="plan-week-btn">📅 Planificar mi semana</button>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>💬 Pregúntale algo</span></div>
      <div id="chat-window" class="chat-window mt-8"></div>
      <div class="chip-row mt-8" id="suggestion-chips">
        ${SUGGESTIONS.map((s) => `<button class="chip ai-suggestion-chip" data-suggestion="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join('')}
      </div>
      <form id="chat-form" class="chat-input-row mt-16">
        <input class="form-control" id="chat-input" placeholder="Escribe tu pregunta..." autocomplete="off" />
        <button type="submit" class="btn btn-primary">Enviar</button>
      </form>
    </section>

    <section class="card mt-16">
      <div class="section-title"><span>🍽️ Recetas que puedes preparar</span></div>
      <div id="ai-recipe-suggestions" class="stack mt-8" style="gap:8px;"></div>
      <button class="btn btn-secondary btn-block mt-16" data-nav="/recetas">Ver todas mis recetas</button>
    </section>
  `;

  container.querySelector('[data-nav]').addEventListener('click', () => navigate('/recetas'));
  container.querySelector('#plan-week-btn').addEventListener('click', () => openPlanWeekModal(householdId));

  renderChatHistory(householdId);
  wireChat(householdId);
  loadSuggestions(householdId);
}

function renderChatHistory(householdId) {
  const win = document.getElementById('chat-window');
  if (!win) return;
  if (!chatHistory.length) {
    win.innerHTML = `<div class="chat-bubble ai">¡Hola! Soy FoodStock IA. Pregúntame qué puedes cocinar con lo que tienes en casa o qué cenar hoy.</div>`;
    return;
  }
  win.innerHTML = chatHistory.map((m) => `
    <div class="chat-bubble ${m.role}">${escapeHTML(m.text)}</div>
    ${m.recipes?.length ? `<div class="stack" style="gap:6px;max-width:82%;">${m.recipes.map((r) => recipeCardMini(r)).join('')}</div>` : ''}
  `).join('');
  win.scrollTop = win.scrollHeight;
  win.querySelectorAll('[data-action="open-recipe"]').forEach((card) => {
    card.addEventListener('click', () => openRecipeDetailModal(card.dataset.recipeId, householdId));
  });
}

function wireChat(householdId) {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  async function send(message) {
    if (!message.trim()) return;
    chatHistory.push({ role: 'user', text: message });
    renderChatHistory(householdId);
    input.value = '';

    const win = document.getElementById('chat-window');
    const thinking = document.createElement('div');
    thinking.className = 'chat-bubble ai';
    thinking.textContent = 'Pensando…';
    win.appendChild(thinking);
    win.scrollTop = win.scrollHeight;

    try {
      const { text, recipes } = await chatWithAI(message, householdId);
      chatHistory.push({ role: 'ai', text, recipes });
    } catch (err) {
      chatHistory.push({ role: 'ai', text: 'No he podido responder ahora mismo. Inténtalo de nuevo.' });
    }
    renderChatHistory(householdId);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });

  document.querySelectorAll('#suggestion-chips [data-suggestion]').forEach((btn) => {
    btn.addEventListener('click', () => send(btn.dataset.suggestion));
  });
}

async function loadSuggestions(householdId) {
  const el = document.getElementById('ai-recipe-suggestions');
  if (!el) return;
  const suggestions = await suggestRecipes(householdId, {});
  if (!suggestions.length) {
    el.innerHTML = `<p class="text-muted">Añade recetas para recibir sugerencias basadas en tu inventario.</p>`;
    return;
  }
  el.innerHTML = suggestions.slice(0, 5).map((s) => recipeCardMini(s.recipe, s.matchRatio)).join('');
  el.querySelectorAll('[data-action="open-recipe"]').forEach((card) => {
    card.addEventListener('click', () => openRecipeDetailModal(card.dataset.recipeId, householdId));
  });
}

export function openQuickCookModal(householdId) {
  openModal(`
    <div class="modal-header"><h3 class="modal-title">🍳 ¿Qué cocino?</h3></div>
    <div id="quick-cook-content" class="stack" style="gap:10px;">
      <div class="spinner"></div>
    </div>
    <button class="btn btn-secondary btn-block mt-16" id="close-quick-cook">Cerrar</button>
  `, {
    onMount: async (overlay) => {
      overlay.querySelector('#close-quick-cook').addEventListener('click', closeModal);
      const { text, recipes } = await whatCanICook(householdId);
      const content = overlay.querySelector('#quick-cook-content');
      content.innerHTML = `
        <p>${escapeHTML(text)}</p>
        ${recipes.map((r) => recipeCardMini(r)).join('')}
      `;
      content.querySelectorAll('[data-action="open-recipe"]').forEach((card) => {
        card.addEventListener('click', () => {
          closeModal();
          openRecipeDetailModal(card.dataset.recipeId, householdId);
        });
      });
    },
  });
}
