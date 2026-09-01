// components.js — Fragmentos HTML reutilizables entre vistas.

import { categoryInfo, locationInfo } from './constants.js';
import { escapeHTML, daysUntil } from './utils.js';

export function productListItem(product) {
  const cat = categoryInfo(product.category);
  const loc = locationInfo(product.location);
  const isLow = product.minQuantity > 0 && product.quantity < product.minQuantity;

  let expiryBadge = '';
  if (product.expiryDate) {
    const days = daysUntil(product.expiryDate);
    if (days < 0) expiryBadge = `<span class="badge badge-danger">🔴 Caducado</span>`;
    else if (days <= 3) expiryBadge = `<span class="badge badge-warning">🟡 Caduca pronto</span>`;
  }

  return `
    <div class="list-item" data-product-id="${product.id}">
      <div class="item-emoji">${cat.emoji}</div>
      <div class="item-info">
        <div class="item-name">
          ${escapeHTML(product.name)}
          <button class="star-btn" data-action="toggle-fav-product" data-id="${product.id}" aria-label="Favorito">${product.favorite ? '⭐' : '☆'}</button>
        </div>
        <div class="item-meta">
          <span>${loc.emoji} ${loc.label}</span>
          ${isLow ? '<span class="badge badge-warning">⚠️ Poco stock</span>' : ''}
          ${expiryBadge}
        </div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" data-action="qty-dec" data-id="${product.id}" aria-label="Quitar uno">−</button>
        <span class="qty-value">${formatQty(product.quantity)}</span>
        <button class="qty-btn" data-action="qty-inc" data-id="${product.id}" aria-label="Añadir uno">+</button>
      </div>
    </div>`;
}

export function formatQty(quantity) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

export function shoppingListItem(item) {
  const cat = categoryInfo(item.category);
  return `
    <div class="list-item" data-item-id="${item.id}">
      <button class="item-emoji" data-action="toggle-purchased" data-id="${item.id}" style="border:none;cursor:pointer;">
        ${item.purchased ? '✅' : cat.emoji}
      </button>
      <div class="item-info">
        <div class="item-name" style="${item.purchased ? 'text-decoration:line-through;color:var(--color-text-faint);' : ''}">
          ${escapeHTML(item.name)}
        </div>
        <div class="item-meta"><span>${formatQty(item.quantity)} ${item.unit}</span></div>
      </div>
      <button class="icon-btn" data-action="delete-shopping-item" data-id="${item.id}" aria-label="Eliminar">🗑️</button>
    </div>`;
}

export function emptyState(emoji, text, ctaHTML = '') {
  return `
    <div class="empty-state">
      <span class="emoji">${emoji}</span>
      <p>${text}</p>
      ${ctaHTML}
    </div>`;
}

export function chip(label, { active = false, action, id } = {}) {
  return `<button class="chip ${active ? 'active' : ''}" data-action="${action || ''}" data-id="${id || ''}">${label}</button>`;
}

export function recipeCardMini(recipe, matchRatio = null) {
  const photo = recipe.photo
    ? `<img src="${recipe.photo}" alt="">`
    : '🍽️';
  const matchHTML = matchRatio != null
    ? `<div class="match-bar"><div class="match-bar-fill" style="width:${Math.round(matchRatio * 100)}%"></div></div>`
    : '';
  return `
    <div class="list-item recipe-card" data-recipe-id="${recipe.id}" data-action="open-recipe">
      <div class="recipe-photo">${photo}</div>
      <div class="item-info">
        <div class="item-name">${escapeHTML(recipe.name)} ${recipe.favorite ? '⭐' : ''}</div>
        <div class="recipe-meta">${recipe.time ? `⏱️ ${recipe.time} min · ` : ''}${recipe.difficulty} · ${recipe.category}</div>
        ${matchHTML}
      </div>
    </div>`;
}
