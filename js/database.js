// database.js — Capa de acceso a datos (Firestore). No contiene lógica de UI.
//
// Todos los datos de la familia viven en /families/{uid}/{store}/{docId},
// donde {uid} es el usuario de Firebase Auth compartido por todos los
// dispositivos de la familia. Así, cualquier cambio en un dispositivo se
// sincroniza automáticamente en los demás (Firestore usa "listeners" en
// tiempo real, ver watchStore más abajo).

import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  writeBatch, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getFirebase } from './firebase.js';
import { getCurrentUser } from './auth.js';

const STORES = {
  households: 'id',
  products: 'id',
  shopping: 'id',
  recipes: 'id',
  calendar: 'id',
  settings: 'key',
  favorites: 'id',
};

function requireFirestore() {
  const fb = getFirebase();
  const user = getCurrentUser();
  if (!fb || !user) {
    throw new Error('No hay sesión activa. Inicia sesión para acceder a tus datos.');
  }
  return { firestore: fb.firestore, uid: user.uid };
}

function storeCollection(storeName) {
  const { firestore, uid } = requireFirestore();
  return collection(firestore, 'families', uid, storeName);
}

function keyFieldFor(storeName) {
  return STORES[storeName] || 'id';
}

export const db = {
  async getAll(storeName) {
    const snap = await getDocs(storeCollection(storeName));
    return snap.docs.map((d) => d.data());
  },

  async getByIndex(storeName, indexName, value) {
    const q = query(storeCollection(storeName), where(indexName, '==', value));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  },

  async get(storeName, key) {
    const { firestore, uid } = requireFirestore();
    const ref = doc(firestore, 'families', uid, storeName, String(key));
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : undefined;
  },

  async put(storeName, value) {
    const { firestore, uid } = requireFirestore();
    const keyField = keyFieldFor(storeName);
    const key = value[keyField];
    const ref = doc(firestore, 'families', uid, storeName, String(key));
    await setDoc(ref, value);
    return value;
  },

  async putMany(storeName, values) {
    const { firestore, uid } = requireFirestore();
    const keyField = keyFieldFor(storeName);
    const chunks = [];
    for (let i = 0; i < values.length; i += 400) chunks.push(values.slice(i, i + 400));
    for (const chunk of chunks) {
      const batch = writeBatch(firestore);
      chunk.forEach((value) => {
        const ref = doc(firestore, 'families', uid, storeName, String(value[keyField]));
        batch.set(ref, value);
      });
      await batch.commit();
    }
    return values;
  },

  async delete(storeName, key) {
    const { firestore, uid } = requireFirestore();
    const ref = doc(firestore, 'families', uid, storeName, String(key));
    await deleteDoc(ref);
    return true;
  },

  async clear(storeName) {
    const { firestore } = requireFirestore();
    const snap = await getDocs(storeCollection(storeName));
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(firestore);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return true;
  },

  async clearAll() {
    for (const name of Object.keys(STORES)) {
      await this.clear(name);
    }
    return true;
  },

  async exportAll() {
    const data = {};
    for (const name of Object.keys(STORES)) {
      data[name] = await this.getAll(name);
    }
    data.__meta = { exportedAt: new Date().toISOString(), version: 'firestore-1' };
    return data;
  },

  async importAll(data) {
    for (const name of Object.keys(STORES)) {
      if (Array.isArray(data[name])) {
        await this.clear(name);
        await this.putMany(name, data[name]);
      }
    }
    return true;
  },

  // Escucha cambios en tiempo real de un store (para sincronizar entre
  // dispositivos). Devuelve una función para dejar de escuchar.
  //
  // Se ignoran los snapshots que todavía tienen escrituras locales
  // pendientes de confirmar (metadata.hasPendingWrites): esos son el "eco"
  // de un cambio hecho en este mismo dispositivo, cuya pantalla ya se ha
  // actualizado al momento por la propia acción del usuario. Repintar la
  // pantalla entera otra vez por ese eco es lo que causaba el parpadeo al
  // sumar/restar cantidades. Los cambios que vienen de verdad de otro
  // dispositivo nunca tienen escrituras pendientes en este, así que siguen
  // disparando la sincronización con normalidad.
  watchStore(storeName, callback) {
    let unsub = () => {};
    try {
      unsub = onSnapshot(storeCollection(storeName), (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        callback(snap.docs.map((d) => d.data()));
      }, (err) => console.warn(`Error escuchando "${storeName}":`, err));
    } catch (err) {
      console.warn(`No se pudo escuchar "${storeName}":`, err);
    }
    return unsub;
  },
};

export { STORES };
