// recipePacks.js — Registro de "packs" de recetas predeterminadas.
//
// Este es el apartado pensado para ampliar el catálogo en el futuro: para
// añadir más recetas más adelante, basta con crear un nuevo archivo
// js/recipeCatalogXxx.js que exporte un array de recetas (mismo formato
// que los existentes) y añadir aquí una entrada que lo referencie. No hace
// falta tocar la vista de Ajustes ni el arranque: se listan y se cargan
// automáticamente.

import { RECIPE_CATALOG } from './recipeCatalog.js';
import { RECIPE_CATALOG_MEDITERRANEO } from './recipeCatalogMediterraneo.js';
import { RECIPE_CATALOG_ITALIANA } from './recipeCatalogItaliana.js';

export const RECIPE_PACKS = [
  {
    id: 'popular',
    title: 'Recetas populares',
    description: 'Platos rápidos, saludables, económicos, vegetarianos y postres de siempre.',
    icon: '📖',
    catalog: RECIPE_CATALOG,
  },
  {
    id: 'mediterraneo',
    title: 'Dieta mediterránea y cocina española',
    description: 'Arroces, guisos, pescados, tapas y postres tradicionales de toda España.',
    icon: '🇪🇸',
    catalog: RECIPE_CATALOG_MEDITERRANEO,
  },
  {
    id: 'italiana',
    title: 'Cocina italiana',
    description: 'Antipasti, pastas, risottos, pizzas, segundos platos y dolci.',
    icon: '🇮🇹',
    catalog: RECIPE_CATALOG_ITALIANA,
  },
  // 👉 Para añadir un futuro pack nuevo:
  // 1. Crea js/recipeCatalogNombre.js exportando un array de recetas.
  // 2. Impórtalo aquí arriba.
  // 3. Añade un objeto { id, title, description, icon, catalog } a este array.
];

export function allPackRecipes() {
  return RECIPE_PACKS.flatMap((pack) => pack.catalog);
}
