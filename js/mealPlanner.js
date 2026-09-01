// mealPlanner.js — Planificación semanal automática basada en objetivos del usuario.
// No usa un LLM: puntúa las recetas ya guardadas según los objetivos elegidos
// (poco tiempo, aprovechar lo que tengo, perder peso, económico, vegetariano),
// rellena el calendario de la semana y añade a la compra lo que falte.

import { getRecipes } from './recipes.js';
import { getProducts } from './products.js';
import { getEntriesForRange, createEntry, deleteEntry } from './calendar.js';
import { addItem as addShoppingItem } from './shopping.js';
import { normalize, todayKey, addDays, startOfWeek } from './utils.js';

export const PLAN_GOALS = [
  { id: 'quick', label: '⏱️ Poco tiempo', keywords: /(poco tiempo|rapid|deprisa|prisa|agobiad)/ },
  { id: 'useWhatIHave', label: '♻️ Aprovechar lo que tengo', keywords: /(sobrant|aprovech|lo que tengo|que tengo en casa|no comprar)/ },
  { id: 'lightweight', label: '⚖️ Perder peso / ligero', keywords: /(perder peso|adelgazar|dieta|ligero|saludable|sano)/ },
  { id: 'budget', label: '💰 Económico', keywords: /(economic|barat|ahorr)/ },
  { id: 'vegetarian', label: '🥗 Vegetariano', keywords: /(vegetarian|sin carne|vegano)/ },
];

export function detectGoalsFromText(text) {
  const q = normalize(text || '');
  return PLAN_GOALS.filter((g) => g.keywords.test(q)).map((g) => g.id);
}

async function scoreRecipes(householdId, goals) {
  const recipes = await getRecipes();
  const products = await getProducts(householdId);
  const stock = new Set(products.filter((p) => p.quantity > 0).map((p) => normalize(p.name)));

  let pool = recipes;
  if (goals.includes('vegetarian')) {
    const vegetarianOnly = pool.filter((r) => r.category === 'Vegetariana');
    if (vegetarianOnly.length) pool = vegetarianOnly;
  }

  return pool
    .map((recipe) => {
      const total = recipe.ingredients.length || 1;
      const have = recipe.ingredients.filter((ing) => stock.has(normalize(ing.name)));
      const missing = recipe.ingredients.filter((ing) => !stock.has(normalize(ing.name)));
      const matchRatio = have.length / total;

      // Puntuación base pequeña y con algo de ruido aleatorio: así, si no se
      // elige "Aprovechar lo que tengo", el plan no se limita siempre a las
      // recetas que ya tienes completas (si no, casi nunca faltaría comprar
      // nada, que es justo lo contrario de lo que se espera de esta función).
      let score = matchRatio * 0.2 + Math.random() * 0.3;
      if (goals.includes('quick')) {
        score += (recipe.time && recipe.time <= 30 ? 1.5 : 0) + (recipe.category === 'Rápida' ? 0.5 : 0);
      }
      if (goals.includes('useWhatIHave')) {
        score += matchRatio * 2.5;
      }
      if (goals.includes('lightweight')) {
        score += (recipe.category === 'Saludable' ? 1.2 : 0) +
          (recipe.nutrition?.calories && recipe.nutrition.calories < 450 ? 0.8 : 0);
      }
      if (goals.includes('budget')) {
        score += (recipe.category === 'Económica' ? 1.2 : 0);
      }

      return { recipe, score, matchRatio, missing };
    })
    .sort((a, b) => b.score - a.score);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Genera la planificación de la semana actual (lunes-domingo).
// goals: subconjunto de PLAN_GOALS ids. meals: subconjunto de ['desayuno','comida','cena'].
// overwrite: si es true, sustituye las comidas ya planificadas; si no, solo rellena huecos.
export async function generateWeeklyPlan(householdId, { goals = [], meals = ['comida', 'cena'], overwrite = false } = {}) {
  const scored = await scoreRecipes(householdId, goals);
  if (!scored.length) {
    return { created: [], skipped: [], missingAdded: [], error: 'no-recipes' };
  }

  const weekStart = startOfWeek(todayKey());
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const existing = await getEntriesForRange(householdId, weekStart, weekEnd);

  const topPoolSize = Math.max(meals.length * 7, 12);
  let pool = shuffle(scored.slice(0, Math.min(scored.length, topPoolSize)));
  let poolIndex = 0;
  function nextFromPool() {
    if (poolIndex >= pool.length) {
      pool = shuffle(pool);
      poolIndex = 0;
    }
    const item = pool[poolIndex];
    poolIndex += 1;
    return item;
  }

  const created = [];
  const skipped = [];
  const missingMap = new Map();

  for (const date of days) {
    for (const mealType of meals) {
      const already = existing.find((e) => e.date === date && e.mealType === mealType);
      if (already) {
        if (!overwrite) {
          skipped.push({ date, mealType });
          continue;
        }
        await deleteEntry(already.id);
      }

      const pick = nextFromPool();
      await createEntry({ householdId, date, mealType, recipeId: pick.recipe.id });
      created.push({ date, mealType, recipe: pick.recipe });

      pick.missing.forEach((ing) => {
        const key = normalize(ing.name);
        const entry = missingMap.get(key);
        const quantity = ing.quantity != null ? ing.quantity : 1;
        if (entry) {
          entry.quantity += quantity;
        } else {
          missingMap.set(key, { name: ing.name, unit: ing.unit || 'unidades', quantity });
        }
      });
    }
  }

  const missingAdded = [];
  for (const { name, unit, quantity } of missingMap.values()) {
    const item = await addShoppingItem({ householdId, name, quantity, unit, category: 'otros' });
    missingAdded.push(item);
  }

  return { created, skipped, missingAdded, weekStart };
}
