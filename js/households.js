// households.js — Gestión de viviendas.

import { db } from './database.js';
import { uid, nowISO, bus } from './utils.js';

const SETTINGS_KEY_CURRENT = 'currentHouseholdId';

export async function getHouseholds() {
  const list = await db.getAll('households');
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getHousehold(id) {
  return db.get('households', id);
}

export async function createHousehold({ name, emoji, color }) {
  const household = {
    id: uid(),
    name: name.trim(),
    emoji: emoji || '🏠',
    color: color || '#4F8EF7',
    createdAt: nowISO(),
  };
  await db.put('households', household);
  bus.emit('households:changed');
  return household;
}

export async function updateHousehold(id, patch) {
  const household = await db.get('households', id);
  if (!household) throw new Error('Vivienda no encontrada');
  const updated = { ...household, ...patch };
  await db.put('households', updated);
  bus.emit('households:changed');
  return updated;
}

export async function deleteHousehold(id) {
  const households = await getHouseholds();
  if (households.length <= 1) {
    throw new Error('Debe existir al menos una vivienda');
  }
  await db.delete('households', id);

  // Elimina en cascada los datos asociados a esta vivienda
  const [products, shopping, calendar] = await Promise.all([
    db.getByIndex('products', 'householdId', id),
    db.getByIndex('shopping', 'householdId', id),
    db.getByIndex('calendar', 'householdId', id),
  ]);
  await Promise.all([
    ...products.map((p) => db.delete('products', p.id)),
    ...shopping.map((s) => db.delete('shopping', s.id)),
    ...calendar.map((c) => db.delete('calendar', c.id)),
  ]);

  const remaining = await getHouseholds();
  const current = await getCurrentHouseholdId();
  if (current === id) {
    await setCurrentHouseholdId(remaining[0].id);
  }
  bus.emit('households:changed');
  return true;
}

export async function getCurrentHouseholdId() {
  const setting = await db.get('settings', SETTINGS_KEY_CURRENT);
  if (setting && setting.value) {
    const exists = await db.get('households', setting.value);
    if (exists) return setting.value;
  }
  const households = await getHouseholds();
  if (households.length) {
    await setCurrentHouseholdId(households[0].id);
    return households[0].id;
  }
  return null;
}

export async function setCurrentHouseholdId(id) {
  await db.put('settings', { key: SETTINGS_KEY_CURRENT, value: id });
  bus.emit('households:switched', id);
  return id;
}
