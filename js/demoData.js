// demoData.js — Vivienda y contenido de demostración para el primer arranque.

import { createHousehold } from './households.js';
import { createProduct } from './products.js';
import { createRecipe, importRecipeCatalog } from './recipes.js';
import { createEntry } from './calendar.js';
import { addItem } from './shopping.js';
import { todayKey, addDays } from './utils.js';
import { allPackRecipes } from './recipePacks.js';

const DEMO_PRODUCTS = [
  { name: 'Leche', quantity: 2, unit: 'litros', category: 'lacteos', location: 'nevera', minQuantity: 1 },
  { name: 'Huevos', quantity: 6, unit: 'unidades', category: 'huevos', location: 'nevera', minQuantity: 6 },
  { name: 'Queso', quantity: 1, unit: 'paquetes', category: 'lacteos', location: 'nevera', minQuantity: 0 },
  { name: 'Yogures', quantity: 4, unit: 'unidades', category: 'lacteos', location: 'nevera', minQuantity: 2 },
  { name: 'Pasta', quantity: 500, unit: 'g', category: 'pasta', location: 'despensa', minQuantity: 200 },
  { name: 'Arroz', quantity: 1, unit: 'kg', category: 'cereales', location: 'despensa', minQuantity: 0.5 },
  { name: 'Tomate', quantity: 3, unit: 'unidades', category: 'verduras', location: 'despensa', minQuantity: 0 },
  { name: 'Aceite', quantity: 1, unit: 'litros', category: 'condimentos', location: 'despensa', minQuantity: 1 },
  { name: 'Cebolla', quantity: 2, unit: 'unidades', category: 'verduras', location: 'despensa', minQuantity: 1 },
  { name: 'Pollo', quantity: 1, unit: 'kg', category: 'carne', location: 'congelador', minQuantity: 0 },
  { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes', category: 'congelados', location: 'congelador', minQuantity: 1 },
  { name: 'Carne picada', quantity: 300, unit: 'g', category: 'carne', location: 'congelador', minQuantity: 0 },
];

const DEMO_RECIPES = [
  {
    name: 'Pasta boloñesa',
    ingredients: [
      { name: 'Pasta', quantity: 200, unit: 'g' },
      { name: 'Carne picada', quantity: 300, unit: 'g' },
      { name: 'Tomate', quantity: 400, unit: 'g' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
    ],
    steps: ['Sofríe la cebolla', 'Añade la carne y dórala', 'Incorpora el tomate y cuece 20 min', 'Cuece la pasta y mezcla'],
    time: 35,
    difficulty: 'Fácil',
    category: 'Rápida',
    nutrition: { calories: 620, protein: 34, carbs: 68, fat: 22 },
  },
  {
    name: 'Tortilla de patata',
    ingredients: [
      { name: 'Huevos', quantity: 4, unit: 'unidades' },
      { name: 'Patatas', quantity: 3, unit: 'unidades' },
      { name: 'Cebolla', quantity: 1, unit: 'unidades' },
      { name: 'Aceite', quantity: 100, unit: 'ml' },
    ],
    steps: ['Pela y corta las patatas', 'Fríe patatas y cebolla', 'Bate los huevos y mezcla', 'Cuaja la tortilla en la sartén'],
    time: 30,
    difficulty: 'Media',
    category: 'Tradicional',
    nutrition: { calories: 450, protein: 18, carbs: 32, fat: 26 },
  },
  {
    name: 'Pollo al horno con verduras',
    ingredients: [
      { name: 'Pollo', quantity: 1, unit: 'kg' },
      { name: 'Verduras congeladas', quantity: 1, unit: 'paquetes' },
      { name: 'Aceite', quantity: 50, unit: 'ml' },
    ],
    steps: ['Precalienta el horno a 200°C', 'Coloca el pollo y las verduras en la bandeja', 'Hornea 45 minutos'],
    time: 55,
    difficulty: 'Fácil',
    category: 'Saludable',
    nutrition: { calories: 520, protein: 45, carbs: 12, fat: 30 },
  },
];

export async function seedDemoData() {
  const household = await createHousehold({ name: 'Casa', emoji: '🏠', color: '#4F8EF7' });

  await Promise.all(
    DEMO_PRODUCTS.map((p) => createProduct({ ...p, householdId: household.id }))
  );

  const createdRecipes = [];
  for (const recipe of DEMO_RECIPES) {
    createdRecipes.push(await createRecipe(recipe));
  }
  await importRecipeCatalog(allPackRecipes());

  const today = todayKey();
  await createEntry({ householdId: household.id, date: today, mealType: 'comida', recipeId: createdRecipes[0].id });
  await createEntry({ householdId: household.id, date: addDays(today, 1), mealType: 'cena', recipeId: createdRecipes[2].id });
  await createEntry({ householdId: household.id, date: addDays(today, 2), mealType: 'comida', recipeId: createdRecipes[1].id });

  await addItem({ householdId: household.id, name: 'Pan', quantity: 1, unit: 'unidades', category: 'panaderia' });
  await addItem({ householdId: household.id, name: 'Manzanas', quantity: 6, unit: 'unidades', category: 'fruta' });

  return household;
}
