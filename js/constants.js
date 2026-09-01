// constants.js — Catálogos y valores fijos compartidos por toda la app.

export const CATEGORIES = [
  { id: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { id: 'carne', label: 'Carne', emoji: '🥩' },
  { id: 'pescado', label: 'Pescado', emoji: '🐟' },
  { id: 'verduras', label: 'Verduras', emoji: '🥦' },
  { id: 'fruta', label: 'Fruta', emoji: '🍎' },
  { id: 'panaderia', label: 'Panadería', emoji: '🍞' },
  { id: 'cereales', label: 'Cereales', emoji: '🍚' },
  { id: 'conservas', label: 'Conservas', emoji: '🥫' },
  { id: 'condimentos', label: 'Condimentos', emoji: '🧂' },
  { id: 'huevos', label: 'Huevos', emoji: '🥚' },
  { id: 'pasta', label: 'Pasta', emoji: '🍝' },
  { id: 'congelados', label: 'Congelados', emoji: '🧊' },
  { id: 'snacks', label: 'Snacks', emoji: '🍫' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'otros', label: 'Otros', emoji: '📦' },
];

export const LOCATIONS = [
  { id: 'nevera', label: 'Nevera', emoji: '🧊' },
  { id: 'congelador', label: 'Congelador', emoji: '❄️' },
  { id: 'despensa', label: 'Despensa', emoji: '🥫' },
];

export const UNITS = ['unidades', 'g', 'kg', 'ml', 'litros', 'paquetes', 'latas', 'botellas'];

export const HOUSEHOLD_EMOJIS = ['🏠', '🏖️', '🏡', '🏢', '🏘️', '⛺', '🏚️', '🛖'];

export const HOUSEHOLD_COLORS = [
  '#4F8EF7', '#22C55E', '#F59E0B', '#EF4444',
  '#A855F7', '#EC4899', '#14B8A6', '#6366F1',
];

export const MEAL_TYPES = [
  { id: 'desayuno', label: 'Desayuno', emoji: '🥣' },
  { id: 'comida', label: 'Comida', emoji: '🍝' },
  { id: 'cena', label: 'Cena', emoji: '🥗' },
];

export const RECIPE_CATEGORIES = [
  'Rápida', 'Saludable', 'Económica', 'Vegetariana', 'Postre', 'Tradicional',
];

export const DIFFICULTIES = ['Fácil', 'Media', 'Difícil'];

export function categoryInfo(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function locationInfo(id) {
  return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
}
