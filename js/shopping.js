// shopping.js — Lista de la compra.

import { db } from './database.js';
import { uid, nowISO, bus, normalize } from './utils.js';

export async function getShoppingList(householdId) {
  const list = await db.getByIndex('shopping', 'householdId', householdId);
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPendingItems(householdId) {
  const list = await getShoppingList(householdId);
  return list.filter((i) => !i.purchased);
}

// Añade un producto a la compra. Si ya existe uno pendiente con el mismo nombre,
// suma cantidades en lugar de duplicar la fila.
export async function addItem(data) {
  const list = await getShoppingList(data.householdId);
  const existing = list.find(
    (i) => !i.purchased && normalize(i.name) === normalize(data.name)
  );

  if (existing) {
    const updated = { ...existing, quantity: (Number(existing.quantity) || 0) + (Number(data.quantity) || 1) };
    await db.put('shopping', updated);
    bus.emit('shopping:changed');
    return updated;
  }

  const item = {
    id: uid(),
    householdId: data.householdId,
    name: data.name.trim(),
    quantity: data.quantity != null ? Number(data.quantity) : 1,
    unit: data.unit || 'unidades',
    category: data.category || 'otros',
    purchased: false,
    linkedProductId: data.linkedProductId || null,
    linkedRecipeId: data.linkedRecipeId || null,
    createdAt: nowISO(),
  };
  await db.put('shopping', item);
  bus.emit('shopping:changed');
  return item;
}

export async function updateItem(id, patch) {
  const item = await db.get('shopping', id);
  if (!item) throw new Error('Elemento no encontrado');
  const updated = { ...item, ...patch };
  await db.put('shopping', updated);
  bus.emit('shopping:changed');
  return updated;
}

export async function deleteItem(id) {
  await db.delete('shopping', id);
  bus.emit('shopping:changed');
  return true;
}

export async function setPurchased(id, purchased) {
  return updateItem(id, { purchased, purchasedAt: purchased ? nowISO() : null });
}

export async function clearPurchased(householdId) {
  const list = await getShoppingList(householdId);
  const purchased = list.filter((i) => i.purchased);
  await Promise.all(purchased.map((i) => db.delete('shopping', i.id)));
  bus.emit('shopping:changed');
  return purchased;
}

export function groupByCategory(items) {
  const groups = {};
  items.forEach((item) => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  return groups;
}
