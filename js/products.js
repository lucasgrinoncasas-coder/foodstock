// products.js — Gestión de alimentos (nevera, congelador, despensa).

import { db } from './database.js';
import { uid, nowISO, bus, normalize, daysUntil } from './utils.js';
import * as shopping from './shopping.js';

export async function getProducts(householdId) {
  const list = await db.getByIndex('products', 'householdId', householdId);
  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getProduct(id) {
  return db.get('products', id);
}

export async function createProduct(data) {
  const product = {
    id: uid(),
    householdId: data.householdId,
    name: data.name.trim(),
    quantity: Number(data.quantity) || 0,
    unit: data.unit || 'unidades',
    category: data.category || 'otros',
    location: data.location || 'nevera',
    expiryDate: data.expiryDate || null,
    minQuantity: data.minQuantity != null ? Number(data.minQuantity) : 0,
    favorite: !!data.favorite,
    notes: data.notes || '',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  await db.put('products', product);
  bus.emit('products:changed');
  return product;
}

export async function updateProduct(id, patch) {
  const product = await db.get('products', id);
  if (!product) throw new Error('Producto no encontrado');
  const updated = { ...product, ...patch, updatedAt: nowISO() };
  await db.put('products', updated);
  bus.emit('products:changed');
  return updated;
}

export async function deleteProduct(id) {
  await db.delete('products', id);
  bus.emit('products:changed');
  return true;
}

// Devuelve true si tras la operación conviene preguntar por añadir a la compra
export async function changeQuantity(id, delta) {
  const product = await db.get('products', id);
  if (!product) throw new Error('Producto no encontrado');
  const newQuantity = Math.max(0, roundQty(product.quantity + delta));
  const updated = await updateProduct(id, { quantity: newQuantity });
  return {
    product: updated,
    reachedZero: newQuantity === 0 && delta < 0,
    isLow: updated.minQuantity > 0 && newQuantity < updated.minQuantity,
  };
}

function roundQty(n) {
  return Math.round(n * 100) / 100;
}

export async function toggleFavorite(id) {
  const product = await db.get('products', id);
  if (!product) throw new Error('Producto no encontrado');
  return updateProduct(id, { favorite: !product.favorite });
}

export async function getLowStock(householdId) {
  const products = await getProducts(householdId);
  return products.filter((p) => p.minQuantity > 0 && p.quantity < p.minQuantity);
}

export async function getExpiringSoon(householdId, withinDays = 3) {
  const products = await getProducts(householdId);
  return products
    .filter((p) => p.expiryDate)
    .map((p) => ({ ...p, daysLeft: daysUntil(p.expiryDate) }))
    .filter((p) => p.daysLeft <= withinDays)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function getFavorites(householdId) {
  const products = await getProducts(householdId);
  return products.filter((p) => p.favorite);
}

export async function searchProducts(householdId, query, filters = {}) {
  const products = await getProducts(householdId);
  const q = normalize(query || '');
  return products.filter((p) => {
    if (q && !normalize(p.name).includes(q)) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.location && p.location !== filters.location) return false;
    if (filters.favoritesOnly && !p.favorite) return false;
    if (filters.lowOnly && !(p.minQuantity > 0 && p.quantity < p.minQuantity)) return false;
    return true;
  });
}

export async function countByLocation(householdId) {
  const products = await getProducts(householdId);
  const counts = { nevera: 0, congelador: 0, despensa: 0 };
  products.forEach((p) => {
    if (counts[p.location] != null) counts[p.location] += 1;
  });
  return counts;
}

export async function addLowStockToShoppingList(householdId) {
  const lowStock = await getLowStock(householdId);
  const added = [];
  for (const product of lowStock) {
    const item = await shopping.addItem({
      householdId,
      name: product.name,
      quantity: Math.max(1, product.minQuantity - product.quantity),
      unit: product.unit,
      category: product.category,
      linkedProductId: product.id,
    });
    added.push(item);
  }
  return added;
}
