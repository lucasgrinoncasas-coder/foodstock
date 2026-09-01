// views/loginView.js — Pantalla de acceso: sesión familiar compartida.

import { login, signUp, friendlyAuthError } from '../auth.js';

export function renderSetupScreen() {
  const el = document.getElementById('auth-screen');
  el.innerHTML = `
    <div class="auth-card card">
      <div class="auth-logo">🥫</div>
      <h1 class="auth-title">Configura Firebase</h1>
      <p class="auth-subtitle">FoodStock necesita un proyecto de Firebase gratuito para sincronizar los datos entre los dispositivos de tu familia.</p>
      <ol style="font-size:13.5px;line-height:1.7;padding-left:20px;color:var(--color-text-muted);">
        <li>Crea un proyecto gratuito en <strong>console.firebase.google.com</strong></li>
        <li>Activa <strong>Firestore Database</strong> (modo producción)</li>
        <li>Activa <strong>Authentication → Email/contraseña</strong></li>
        <li>Copia la configuración de tu app web en <code>js/firebaseConfig.js</code></li>
        <li>Recarga esta página</li>
      </ol>
      <p class="text-muted mt-16" style="font-size:12.5px;">Los pasos detallados están en el README del proyecto.</p>
    </div>
  `;
}

export function renderLoginScreen({ onSuccess }) {
  const el = document.getElementById('auth-screen');
  let mode = 'login'; // 'login' | 'signup'

  function render() {
    el.innerHTML = `
      <div class="auth-card card">
        <div class="auth-logo">🥫</div>
        <h1 class="auth-title">FoodStock</h1>
        <p class="auth-subtitle">${mode === 'login'
          ? 'Inicia sesión con la cuenta de tu familia para ver y editar los mismos datos en todos los dispositivos.'
          : 'Crea la cuenta que usará toda tu familia. Hazlo una sola vez: luego cada dispositivo inicia sesión con estos mismos datos.'}</p>
        <div id="auth-error-box"></div>
        <form id="auth-form">
          <div class="form-group">
            <label class="form-label" for="auth-email">Correo</label>
            <input class="form-control" id="auth-email" type="email" required autocomplete="email" placeholder="familia@ejemplo.com" />
          </div>
          <div class="form-group">
            <label class="form-label" for="auth-password">Contraseña</label>
            <input class="form-control" id="auth-password" type="password" required minlength="6" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">${mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta familiar'}</button>
        </form>
        <div class="auth-switch">
          ${mode === 'login'
            ? '¿Primera vez? <button type="button" id="auth-switch-btn">Crea la cuenta de tu familia</button>'
            : '¿Ya tenéis cuenta? <button type="button" id="auth-switch-btn">Inicia sesión</button>'}
        </div>
      </div>
    `;

    el.querySelector('#auth-switch-btn').addEventListener('click', () => {
      mode = mode === 'login' ? 'signup' : 'login';
      render();
    });

    el.querySelector('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el.querySelector('#auth-email').value;
      const password = el.querySelector('#auth-password').value;
      const btn = el.querySelector('#auth-submit-btn');
      const errorBox = el.querySelector('#auth-error-box');
      errorBox.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'Un momento…';

      try {
        if (mode === 'login') {
          await login(email, password);
        } else {
          await signUp(email, password);
        }
        onSuccess();
      } catch (err) {
        errorBox.innerHTML = `<div class="auth-error">${friendlyAuthError(err)}</div>`;
        btn.disabled = false;
        btn.textContent = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta familiar';
      }
    });
  }

  render();
}
