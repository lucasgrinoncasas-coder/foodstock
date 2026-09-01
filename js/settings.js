// settings.js — Configuración global de la aplicación.

import { db } from './database.js';
import { bus } from './utils.js';

const DEFAULTS = {
  theme: 'system', // 'light' | 'dark' | 'system'
  lowStockAlerts: true,
  expiryAlerts: true,
  autoAddMissingIngredients: false,
  notificationsEnabled: false,
  demoDataDismissed: false,
};

export async function getSettings() {
  const entries = await db.getAll('settings');
  const map = { ...DEFAULTS };
  entries.forEach((e) => {
    if (e.key in DEFAULTS || e.key === 'demoDataDismissed') {
      map[e.key] = e.value;
    }
  });
  return map;
}

export async function getSetting(key) {
  const entry = await db.get('settings', key);
  return entry ? entry.value : DEFAULTS[key];
}

export async function setSetting(key, value) {
  await db.put('settings', { key, value });
  bus.emit('settings:changed', { key, value });
  return value;
}

export { DEFAULTS as SETTINGS_DEFAULTS };
