// recipes.js — Recetas y su cruce con el inventario disponible.

import { db } from './database.js';
import { uid, nowISO, bus, normalize } from './utils.js';
import { getProducts } from './products.js';

export async function getRecipes() {
  const list = await db.getAll('recipes');
  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getRecipe(id) {
  return db.get('recipes', id);
}

// Añade recetas de un catálogo evitando duplicar las que ya existan por nombre.
export async function importRecipeCatalog(catalog) {
  const existing = await getRecipes();
  const existingNames = new Set(existing.map((r) => normalize(r.name)));

  const toAdd = catalog.filter((r) => !existingNames.has(normalize(r.name)));
  const created = [];
  for (const entry of toAdd) {
    created.push(await createRecipe(entry));
  }
  return created;
}

export async function createRecipe(data) {
  const recipe = {
    id: uid(),
    name: data.name.trim(),
    photo: data.photo || null,
    ingredients: data.ingredients || [], // [{ name, quantity, unit }]
    steps: data.steps || [],
    time: data.time || null, // minutos
    difficulty: data.difficulty || 'Fácil',
    category: data.category || 'Rápida',
    favorite: !!data.favorite,
    nutrition: data.nutrition || null, // { calories, protein, carbs, fat }
    createdAt: nowISO(),
  };
  await db.put('recipes', recipe);
  bus.emit('recipes:changed');
  return recipe;
}

export async function updateRecipe(id, patch) {
  const recipe = await db.get('recipes', id);
  if (!recipe) throw new Error('Receta no encontrada');
  const updated = { ...recipe, ...patch };
  await db.put('recipes', updated);
  bus.emit('recipes:changed');
  return updated;
}

export async function deleteRecipe(id) {
  await db.delete('recipes', id);
  bus.emit('recipes:changed');
  return true;
}

export async function toggleFavoriteRecipe(id) {
  const recipe = await db.get('recipes', id);
  if (!recipe) throw new Error('Receta no encontrada');
  return updateRecipe(id, { favorite: !recipe.favorite });
}

// Compara los ingredientes de una receta contra el inventario de la vivienda.
// Devuelve { available: [...], missing: [...] }
export async function checkAvailability(recipeId, householdId) {
  const recipe = await getRecipe(recipeId);
  if (!recipe) throw new Error('Receta no encontrada');
  const products = await getProducts(householdId);

  const available = [];
  const missing = [];

  recipe.ingredients.forEach((ingredient) => {
    const match = products.find(
      (p) => normalize(p.name) === normalize(ingredient.name) && p.quantity > 0
    );
    if (match) {
      available.push({ ...ingredient, productId: match.id, stock: match.quantity });
    } else {
      missing.push(ingredient);
    }
  });

  return { recipe, available, missing };
}

// Sugiere recetas que se pueden preparar (total o parcialmente) con el inventario actual.
export async function suggestRecipes(householdId, { onlyFullyAvailable = false } = {}) {
  const recipes = await getRecipes();
  const products = await getProducts(householdId);
  const productNames = new Set(products.filter((p) => p.quantity > 0).map((p) => normalize(p.name)));

  const scored = recipes.map((recipe) => {
    const total = recipe.ingredients.length || 1;
    const have = recipe.ingredients.filter((ing) => productNames.has(normalize(ing.name))).length;
    return { recipe, matchRatio: have / total, have, total };
  });

  const filtered = onlyFullyAvailable
    ? scored.filter((s) => s.matchRatio === 1)
    : scored.filter((s) => s.matchRatio > 0);

  return filtered.sort((a, b) => b.matchRatio - a.matchRatio);
}
