// stats.js — Estadísticas sencillas derivadas de los datos existentes.

import { db } from './database.js';
import { getProducts } from './products.js';
import { getEntriesForRange } from './calendar.js';
import { todayKey, addDays } from './utils.js';

export async function getStats(householdId) {
  const products = await getProducts(householdId);

  const shoppingAll = await db.getByIndex('shopping', 'householdId', householdId);
  const startOfMonth = todayKey().slice(0, 8) + '01';
  const purchasedThisMonth = shoppingAll.filter(
    (i) => i.purchased && (!i.purchasedAt || i.purchasedAt >= startOfMonth)
  ).length;

  const today = todayKey();
  const rangeStart = addDays(today, -30);
  const calendarEntries = await getEntriesForRange(householdId, rangeStart, addDays(today, 30));

  return {
    storedProducts: products.length,
    purchasedThisMonth,
    plannedMeals: calendarEntries.length,
    lowStock: products.filter((p) => p.minQuantity > 0 && p.quantity < p.minQuantity).length,
  };
}
