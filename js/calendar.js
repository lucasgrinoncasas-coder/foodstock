// calendar.js — Planificación de comidas y su integración con la compra.

import { db } from './database.js';
import { uid, bus, todayKey } from './utils.js';
import { getRecipe, checkAvailability } from './recipes.js';
import { addItem as addShoppingItem } from './shopping.js';

// Entrada de calendario: { id, householdId, date, mealType, recipeId?, customName? }

export async function getEntriesForRange(householdId, startDate, endDate) {
  const all = await db.getByIndex('calendar', 'householdId', householdId);
  return all.filter((e) => e.date >= startDate && e.date <= endDate);
}

export async function getEntriesForDate(householdId, date) {
  const all = await db.getByIndex('calendar', 'householdId', householdId);
  return all.filter((e) => e.date === date);
}

export async function createEntry(data) {
  const entry = {
    id: uid(),
    householdId: data.householdId,
    date: data.date,
    mealType: data.mealType,
    recipeId: data.recipeId || null,
    customName: data.customName || null,
  };
  await db.put('calendar', entry);
  bus.emit('calendar:changed');
  return entry;
}

export async function updateEntry(id, patch) {
  const entry = await db.get('calendar', id);
  if (!entry) throw new Error('Entrada no encontrada');
  const updated = { ...entry, ...patch };
  await db.put('calendar', updated);
  bus.emit('calendar:changed');
  return updated;
}

export async function deleteEntry(id) {
  await db.delete('calendar', id);
  bus.emit('calendar:changed');
  return true;
}

export async function copyEntry(id, targetDate) {
  const entry = await db.get('calendar', id);
  if (!entry) throw new Error('Entrada no encontrada');
  return createEntry({
    householdId: entry.householdId,
    date: targetDate,
    mealType: entry.mealType,
    recipeId: entry.recipeId,
    customName: entry.customName,
  });
}

export async function repeatEntryWeekly(id, weeks = 1) {
  const entry = await db.get('calendar', id);
  if (!entry) throw new Error('Entrada no encontrada');
  const created = [];
  for (let i = 1; i <= weeks; i += 1) {
    const [y, m, d] = entry.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 7 * i);
    const dateKey = todayKey(date);
    created.push(await copyEntry(id, dateKey));
  }
  return created;
}

export async function entryLabel(entry) {
  if (entry.recipeId) {
    const recipe = await getRecipe(entry.recipeId);
    return recipe ? recipe.name : entry.customName || 'Receta eliminada';
  }
  return entry.customName || 'Sin planificar';
}

// Comprueba los ingredientes que faltan para una entrada del calendario con receta
// y opcionalmente los añade a la lista de la compra.
export async function resolveMissingIngredients(entryId, { autoAdd = false } = {}) {
  const entry = await db.get('calendar', entryId);
  if (!entry || !entry.recipeId) return { missing: [] };

  const { missing } = await checkAvailability(entry.recipeId, entry.householdId);

  if (autoAdd && missing.length) {
    await Promise.all(
      missing.map((ing) =>
        addShoppingItem({
          householdId: entry.householdId,
          name: ing.name,
          quantity: 1,
          unit: ing.unit || 'unidades',
          category: 'otros',
          linkedRecipeId: entry.recipeId,
        })
      )
    );
  }

  return { missing };
}
