// aiService.js — Capa de IA. Sin claves privadas en el frontend.
//
// Si en el futuro se despliega un backend/proxy propio, basta con rellenar
// `aiConfig.endpoint` (por ejemplo mediante configuración en Ajustes o una
// variable de entorno inyectada en build). Mientras no haya endpoint,
// FoodStock usa un motor de recomendaciones 100% local basado en reglas
// sobre el inventario, las recetas y el calendario guardados, sin salir
// del dispositivo. No es un modelo de lenguaje generativo: reconoce un
// conjunto de intenciones (qué cocinar, qué caduca, qué falta, nutrición,
// recetas rápidas/saludables/económicas/vegetarianas, plan de la semana...)
// y responde con datos reales, variando la redacción y la receta elegida
// para no repetir siempre la misma respuesta.

import { getProducts, getExpiringSoon, getLowStock } from './products.js';
import { suggestRecipes } from './recipes.js';
import { getEntriesForRange, entryLabel } from './calendar.js';
import { normalize, todayKey, addDays, formatDateLabel } from './utils.js';

export const aiConfig = {
  // URL de un proxy propio que reenvíe a un proveedor de IA sin exponer claves.
  // Ejemplo futuro: 'https://tu-proxy.tudominio.com/api/ai'
  endpoint: null,
};

export function isRemoteAIConfigured() {
  return typeof aiConfig.endpoint === 'string' && aiConfig.endpoint.length > 0;
}

async function callRemoteAI(payload) {
  const response = await fetch(aiConfig.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Error al conectar con el servicio de IA');
  return response.json();
}

// --- Utilidades del motor local ---

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTemplate(templates, ...args) {
  return pick(templates)(...args);
}

// --- Respuestas del motor local (fallback sin conexión / sin backend) ---

async function localWhatCanICook(householdId, { onlyFullyAvailable = false } = {}) {
  const suggestions = await suggestRecipes(householdId, {});
  if (!suggestions.length) {
    return {
      text: 'Todavía no tienes recetas guardadas. Añade alguna en la sección de Recetas para que pueda recomendarte qué cocinar con lo que tienes en casa.',
      recipes: [],
    };
  }

  const full = suggestions.filter((s) => s.matchRatio === 1);

  if (full.length) {
    const chosen = pick(full);
    const others = full.filter((s) => s.recipe.id !== chosen.recipe.id).slice(0, 2);
    const templates = [
      (name) => `Con lo que tienes en casa puedes preparar "${name}". ¡Tienes todos los ingredientes!`,
      (name) => `Te propongo "${name}": tienes todo lo necesario en tu inventario.`,
      (name) => `¿Qué tal "${name}"? Lo tienes todo listo para prepararla.`,
    ];
    let text = pickTemplate(templates, chosen.recipe.name);
    if (others.length) {
      text += ` También podrías hacer ${others.map((s) => `"${s.recipe.name}"`).join(' o ')}.`;
    }
    return { text, recipes: [chosen.recipe, ...others.map((s) => s.recipe)] };
  }

  if (onlyFullyAvailable) {
    return {
      text: 'Ahora mismo no tienes todos los ingredientes completos para ninguna receta guardada. Échale un vistazo a lo que te falta en cada una desde Recetas.',
      recipes: [],
    };
  }

  const best = suggestions[0];
  return {
    text: `La receta que más se acerca a lo que tienes es "${best.recipe.name}" (te faltan ${best.total - best.have} de ${best.total} ingredientes).`,
    recipes: [best.recipe],
  };
}

async function localCookFiltered(householdId, filterFn, { introOk, introNone }) {
  const suggestions = await suggestRecipes(householdId, {});
  const matching = suggestions.filter((s) => filterFn(s.recipe));
  const full = matching.filter((s) => s.matchRatio === 1);

  if (full.length) {
    const chosen = pick(full);
    return { text: `${introOk} "${chosen.recipe.name}".`, recipes: [chosen.recipe] };
  }
  if (matching.length) {
    const best = matching[0];
    return {
      text: `"${best.recipe.name}" encaja con lo que buscas, pero te faltan ${best.total - best.have} de ${best.total} ingredientes.`,
      recipes: [best.recipe],
    };
  }
  return { text: introNone, recipes: [] };
}

async function localWhatToEatToday(householdId) {
  const date = todayKey();
  const entries = await getEntriesForRange(householdId, date, date);
  if (entries.length) {
    const labels = await Promise.all(entries.map(entryLabel));
    return { text: `Hoy ya tienes planificado: ${labels.join(' · ')}.`, recipes: [] };
  }
  const result = await localWhatCanICook(householdId);
  return { ...result, text: `No tienes nada planificado para hoy. ${result.text}` };
}

async function localWeekPlan(householdId) {
  const start = todayKey();
  const end = addDays(start, 6);
  const entries = await getEntriesForRange(householdId, start, end);
  if (!entries.length) {
    return { text: 'No tienes ninguna comida planificada en los próximos 7 días. ¿Quieres que te sugiera algo?', recipes: [] };
  }
  const byDate = {};
  entries.forEach((e) => { (byDate[e.date] ||= []).push(e); });
  const parts = await Promise.all(
    Object.keys(byDate).sort().slice(0, 4).map(async (date) => {
      const labels = await Promise.all(byDate[date].map(entryLabel));
      return `${formatDateLabel(date)}: ${labels.join(', ')}`;
    })
  );
  return { text: `Esto es lo que tienes planificado: ${parts.join(' · ')}.`, recipes: [] };
}

async function localExpiringSoon(householdId) {
  const expiring = await getExpiringSoon(householdId, 3);
  if (!expiring.length) {
    return { text: 'No tienes productos a punto de caducar. ¡Todo en orden! 👍', recipes: [] };
  }
  const names = expiring.map((p) => p.name).join(', ');
  const suggestions = await suggestRecipes(householdId, {});
  const withExpiring = suggestions.find((s) =>
    s.recipe.ingredients.some((ing) => expiring.some((p) => normalize(p.name) === normalize(ing.name)))
  );
  let text = `Tienes productos que caducan pronto: ${names}. Te recomiendo usarlos primero.`;
  if (withExpiring) text += ` Podrías aprovecharlos en "${withExpiring.recipe.name}".`;
  return { text, recipes: withExpiring ? [withExpiring.recipe] : [] };
}

async function localLowStock(householdId) {
  const lowStock = await getLowStock(householdId);
  if (!lowStock.length) {
    return { text: 'No te falta ningún producto de los que controlas con cantidad mínima. Todo bajo control.', recipes: [] };
  }
  const names = lowStock.map((p) => p.name).join(', ');
  return {
    text: `Se te está acabando: ${names}. Puedes añadirlos a la compra desde la sección 📦 Alimentos o 🛒 Compra.`,
    recipes: [],
  };
}

async function localNutrition(householdId) {
  const suggestions = await suggestRecipes(householdId, {});
  const withNutrition = suggestions.find((s) => s.recipe.nutrition);
  if (!withNutrition) {
    return {
      text: 'Añade información nutricional a tus recetas (calorías, proteínas, carbohidratos, grasas) para que pueda orientarte. Recuerda que es información orientativa, no consejo médico.',
      recipes: [],
    };
  }
  const n = withNutrition.recipe.nutrition;
  return {
    text: `"${withNutrition.recipe.name}" tiene aprox. ${n.calories ?? '–'} kcal, ${n.protein ?? '–'}g de proteína, ${n.carbs ?? '–'}g de carbohidratos y ${n.fat ?? '–'}g de grasas. Es orientativo, no un consejo médico.`,
    recipes: [withNutrition.recipe],
  };
}

async function localGeneralRecommendation(householdId) {
  const products = await getProducts(householdId);
  if (!products.length) {
    return { text: 'Aún no has añadido alimentos. Empieza registrando lo que tienes en casa desde 📦 Alimentos.', recipes: [] };
  }

  // Alterna entre varios tipos de recomendación para no repetir siempre lo mismo.
  const lowStock = await getLowStock(householdId);
  const expiring = await getExpiringSoon(householdId, 3);
  const modes = ['cook'];
  if (lowStock.length) modes.push('lowstock');
  if (expiring.length) modes.push('expiring');
  const mode = pick(modes);

  if (mode === 'lowstock') return localLowStock(householdId);
  if (mode === 'expiring') return localExpiringSoon(householdId);

  const suggestions = await suggestRecipes(householdId, {});
  if (suggestions.length) {
    const pool = suggestions.filter((s) => s.matchRatio === 1);
    const chosen = pick(pool.length ? pool : suggestions.slice(0, 3));
    const templates = [
      (name) => `Con los alimentos que tienes en casa puedes preparar "${name}". ¿Quieres planificarla?`,
      (name) => `Te sugiero "${name}" para hoy. ¿La añado a tu calendario?`,
      (name) => `¿Has pensado en "${name}"? Encaja bien con lo que tienes en la despensa.`,
    ];
    return { text: pickTemplate(templates, chosen.recipe.name), recipes: [chosen.recipe] };
  }
  const sample = products.slice(0, 4).map((p) => p.name).join(', ');
  return {
    text: `Tienes ${products.length} productos en casa, entre ellos ${sample}. Añade recetas para recibir sugerencias de cocina.`,
    recipes: [],
  };
}

const GREETINGS = [
  '¡Hola! 👋 Pregúntame qué puedes cocinar, qué caduca pronto, qué te falta o qué tienes planificado.',
  '¡Hola! Estoy para ayudarte con tu despensa y tus comidas. ¿Qué necesitas?',
];

const THANKS = [
  '¡De nada! Aquí estoy si necesitas otra idea. 😊',
  'Un placer ayudarte. ¡Buen provecho! 🍽️',
];

const UNCLEAR = [
  'No estoy seguro de haber entendido bien. Puedes preguntarme, por ejemplo: "¿qué puedo cocinar?", "¿qué ceno hoy?", "¿qué se me está caducando?" o "dame una receta rápida".',
  'Todavía soy un asistente sencillo basado en reglas. Prueba con algo como "¿qué tengo planificado esta semana?" o "recomiéndame algo saludable".',
];

function matchIntent(message) {
  const q = normalize(message);
  if (/^(hola|buenas|hey|ey|holaa*|buenos dias|buenas tardes|buenas noches)\b/.test(q)) return 'greeting';
  if (/gracias/.test(q)) return 'thanks';
  if (/(planific|calendario|que toca|esta semana)/.test(q)) return 'planned';
  if (/caduc|vencid/.test(q)) return 'expiring';
  if (/(falta|agotand|queda poco|pocos|bajo de stock|se me acaba|se esta acabando)/.test(q)) return 'lowstock';
  if (/(calori|proteina|nutric|grasa|carbohidrat)/.test(q)) return 'nutrition';
  if (/(rapid|poco tiempo|deprisa)/.test(q)) return 'quick';
  if (/(saludable|sano|dieta|perder peso|adelgazar|ligero)/.test(q)) return 'healthy';
  if (/(economic|barat|ahorr)/.test(q)) return 'cheap';
  if (/(vegetarian|sin carne|vegano)/.test(q)) return 'vegetarian';
  if (/(cen|comer|comid|desayun).*(hoy|esta noche|ahora)|(hoy|esta noche|ahora).*(cen|comer|comid|desayun)/.test(q)) return 'today';
  if (/(cocinar|preparar|hacer|receta|comer|comida|cenar|desayun|plato)/.test(q)) return 'cook';
  return 'unclear';
}

async function routeIntent(intent, message, householdId) {
  switch (intent) {
    case 'greeting':
      return { text: pick(GREETINGS), recipes: [] };
    case 'thanks':
      return { text: pick(THANKS), recipes: [] };
    case 'planned':
      return localWeekPlan(householdId);
    case 'expiring':
      return localExpiringSoon(householdId);
    case 'lowstock':
      return localLowStock(householdId);
    case 'nutrition':
      return localNutrition(householdId);
    case 'quick':
      return localCookFiltered(householdId, (r) => (r.time && r.time <= 30) || r.category === 'Rápida', {
        introOk: 'Algo rápido que puedes preparar es',
        introNone: 'No tengo ninguna receta marcada como rápida (≤30 min). Añade el tiempo de preparación a tus recetas para que pueda sugerirte mejor.',
      });
    case 'healthy':
      return localCookFiltered(householdId, (r) => r.category === 'Saludable', {
        introOk: 'Para algo saludable te propongo',
        introNone: 'No tengo ninguna receta marcada como "Saludable" todavía. Puedes asignarle esa categoría desde Recetas.',
      });
    case 'cheap':
      return localCookFiltered(householdId, (r) => r.category === 'Económica', {
        introOk: 'Una opción económica es',
        introNone: 'No tengo ninguna receta marcada como "Económica" todavía. Puedes asignarle esa categoría desde Recetas.',
      });
    case 'vegetarian':
      return localCookFiltered(householdId, (r) => r.category === 'Vegetariana', {
        introOk: 'Una opción vegetariana es',
        introNone: 'No tengo ninguna receta marcada como "Vegetariana" todavía. Puedes asignarle esa categoría desde Recetas.',
      });
    case 'today':
      return localWhatToEatToday(householdId);
    case 'cook':
      return localWhatCanICook(householdId);
    case 'unclear':
    default:
      return { text: pick(UNCLEAR), recipes: [] };
  }
}

export async function chatWithAI(message, householdId) {
  if (isRemoteAIConfigured()) {
    try {
      return await callRemoteAI({ type: 'chat', message, householdId });
    } catch (err) {
      console.warn('Fallo la IA remota, usando motor local:', err);
    }
  }
  return routeIntent(matchIntent(message), message, householdId);
}

export async function getRecommendation(householdId) {
  if (isRemoteAIConfigured()) {
    try {
      return await callRemoteAI({ type: 'recommendation', householdId });
    } catch (err) {
      console.warn('Fallo la IA remota, usando motor local:', err);
    }
  }
  return localGeneralRecommendation(householdId);
}

export async function whatCanICook(householdId) {
  if (isRemoteAIConfigured()) {
    try {
      return await callRemoteAI({ type: 'whatCanICook', householdId });
    } catch (err) {
      console.warn('Fallo la IA remota, usando motor local:', err);
    }
  }
  return localWhatCanICook(householdId, { onlyFullyAvailable: false });
}
