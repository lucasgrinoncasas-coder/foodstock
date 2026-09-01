// auth.js — Sesión compartida de la familia (un único usuario para todos
// los dispositivos). Envuelve Firebase Auth con una interfaz sencilla.

import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirebase } from './firebase.js';

let currentUser = null;
let authReadyResolve;
const authReady = new Promise((resolve) => { authReadyResolve = resolve; });
const listeners = new Set();

export function initAuthListener() {
  const fb = getFirebase();
  if (!fb) {
    authReadyResolve(null);
    return;
  }
  onAuthStateChanged(fb.auth, (user) => {
    currentUser = user;
    listeners.forEach((cb) => cb(user));
    authReadyResolve(user);
  });
}

export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getCurrentUser() {
  return currentUser;
}

export function waitForAuthReady() {
  return authReady;
}

export async function login(email, password) {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase no está configurado');
  const cred = await signInWithEmailAndPassword(fb.auth, email.trim(), password);
  return cred.user;
}

export async function signUp(email, password) {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase no está configurado');
  const cred = await createUserWithEmailAndPassword(fb.auth, email.trim(), password);
  return cred.user;
}

export async function logout() {
  const fb = getFirebase();
  if (!fb) return;
  await signOut(fb.auth);
}

export function friendlyAuthError(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No existe ninguna cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña no es correcta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta familiar con ese correo. Inicia sesión en vez de crear una nueva.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
    'auth/network-request-failed': 'No hay conexión a internet.',
  };
  return map[code] || 'Ha ocurrido un error. Inténtalo de nuevo.';
}
