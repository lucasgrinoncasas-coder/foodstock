// firebaseConfig.js — Configuración de tu proyecto Firebase.
//
// Rellena estos valores con los de TU proyecto:
// Firebase Console → ⚙️ Configuración del proyecto → Tus apps → SDK setup and configuration → "Config"
//
// Esta configuración NO es secreta (es normal que viaje en el frontend y esté
// en el repositorio público de GitHub): la seguridad real la dan las reglas
// de seguridad de Firestore, no ocultar estos valores.

export const firebaseConfig = {
  apiKey: 'AIzaSyAWs0xqeuZcSqYS6mpNqIlm1NoJUnm4XCg',
  authDomain: 'foodstock-58ff8.firebaseapp.com',
  projectId: 'foodstock-58ff8',
  storageBucket: 'foodstock-58ff8.firebasestorage.app',
  messagingSenderId: '797102784724',
  appId: '1:797102784724:web:de93500cc490ea78e17b41',
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey) && firebaseConfig.apiKey !== 'TU_API_KEY';
}
