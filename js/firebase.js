// firebase.js — Inicialización de Firebase (Auth + Firestore) con
// persistencia offline. Se carga por CDN como módulos ES nativos, sin build
// step, para que siga funcionando en GitHub Pages tal cual.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

let instance = null;

export function getFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (instance) return instance;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Si el navegador bloquea el almacenamiento local, se seguirá funcionando
    // pero habrá que iniciar sesión en cada visita.
  });

  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
  });

  instance = { app, auth, firestore };
  return instance;
}

export { isFirebaseConfigured };
