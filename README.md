# 🥫 FoodStock

FoodStock es una aplicación web/PWA para gestionar todos los alimentos de una vivienda —nevera, congelador y despensa—, planificar comidas en un calendario, mantener la lista de la compra sincronizada con el inventario y recibir recomendaciones de cocina mediante IA.

Está construida con **HTML, CSS y JavaScript estándar** (sin frameworks, sin build step), pensada para funcionar perfectamente en iPhone, Android y ordenador, y para desplegarse gratis en GitHub Pages.

Los datos se guardan en **Firebase (Firestore)** con una única cuenta compartida por toda la familia: cualquier cambio hecho en un dispositivo (añadir leche, tachar algo de la compra, planificar una cena) aparece al instante en los demás. Necesitas crear tu propio proyecto de Firebase gratuito antes de usar la app — ver el [paso 3](#3-configurar-firebase-obligatorio).

## 1. Qué incluye

- **Sincronización en tiempo real entre dispositivos**: toda la familia inicia sesión con la misma cuenta y ve/edita los mismos datos al instante.
- Gestión de varias **viviendas** (Casa, Apartamento, Casa del pueblo…), cada una con sus propios alimentos.
- Inventario de alimentos con cantidad, unidad, categoría, ubicación, caducidad opcional, cantidad mínima, favoritos y notas.
- **Lista de la compra** agrupada por categorías, con paso automático "comprado → añadido a la despensa".
- **Calendario semanal** de desayuno/comida/cena, con copiar, repetir y planificar recetas.
- **Recetas** (más de 300 predeterminadas, repartidas en catálogos: populares, dieta mediterránea/española e italiana) con ingredientes, pasos, tiempo, dificultad e información nutricional orientativa.
- **Planificación semanal con IA**: dile si tienes poco tiempo, quieres aprovechar lo que ya tienes, perder peso o ahorrar, y te rellena el calendario con tus recetas y añade lo que falte a la compra.
- Cruce automático entre **receta planificada ↔ inventario ↔ lista de la compra**.
- **FoodStock IA**: chat y recomendaciones, con motor local (sin claves ni backend externo) y arquitectura lista para conectar una IA real mediante un proxy propio.
- Buscador global, favoritos, estadísticas básicas, tema claro/oscuro, exportar/importar copia de seguridad.
- Funciona **offline** una vez cargada (Firestore cachea localmente y sincroniza al recuperar conexión) y es instalable como app en el móvil.

## 2. Ejecutarlo en local

No necesita Node.js, build ni dependencias. Basta con servir la carpeta con cualquier servidor estático (los módulos ES y el Service Worker requieren HTTP, no `file://`):

```bash
cd foodstock
python -m http.server 8080
```

Abre `http://localhost:8080` en el navegador.

## 3. Configurar Firebase (obligatorio)

FoodStock necesita un proyecto de Firebase propio y gratuito para sincronizar los datos entre los dispositivos de tu familia. Sin este paso, la app se queda en la pantalla de "Configura Firebase" y no deja entrar.

**3.1. Crea el proyecto**

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) e inicia sesión con tu cuenta de Google.
2. **Añadir proyecto** → ponle un nombre (p. ej. `foodstock-familia`) → puedes desactivar Google Analytics, no hace falta → **Crear proyecto**.

**3.2. Activa Firestore Database**

1. En el menú lateral, ve a **Compilación → Firestore Database**.
2. **Crear base de datos** → elige una ubicación cercana (p. ej. `eur3 (europe-west)`) → modo **producción** → **Habilitar**.
3. Ve a la pestaña **Reglas** y sustituye el contenido por esto (solo permite a cada familia leer/escribir sus propios datos):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /families/{familyId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == familyId;
       }
     }
   }
   ```

4. Pulsa **Publicar**.

**3.3. Activa el inicio de sesión**

1. Ve a **Compilación → Authentication** → **Comenzar**.
2. En la pestaña **Sign-in method**, activa el proveedor **Correo electrónico/contraseña**.

**3.4. Copia la configuración a la app**

1. Ve a **⚙️ Configuración del proyecto** (el icono de engranaje, arriba a la izquierda).
2. En la pestaña **General**, baja hasta "Tus apps" → pulsa el icono **`</>`** (Web) → ponle un nombre (p. ej. `foodstock-web`) → **Registrar app**. No hace falta Firebase Hosting.
3. Copia el objeto `firebaseConfig` que te muestra.
4. Pégalo en [`js/firebaseConfig.js`](js/firebaseConfig.js), sustituyendo los valores de ejemplo:

   ```js
   export const firebaseConfig = {
     apiKey: 'AIzaSy...',
     authDomain: 'foodstock-familia.firebaseapp.com',
     projectId: 'foodstock-familia',
     storageBucket: 'foodstock-familia.appspot.com',
     messagingSenderId: '...',
     appId: '...',
   };
   ```

Esta configuración **no es secreta** — es normal que esté en el repositorio de GitHub. La seguridad la dan las reglas de Firestore del paso 3.2, no ocultar esta configuración.

**3.5. Crea la cuenta de tu familia**

La primera vez que abras la app (en local o ya desplegada), verás la pantalla de acceso. Pulsa **"Crea la cuenta de tu familia"**, pon un correo y una contraseña (pueden ser inventados si no quieres usar un correo real, Firebase no lo verifica) y listo: todos los dispositivos que inicien sesión con ese mismo correo y contraseña verán y editarán los mismos datos.

## 4. Subirlo a GitHub

```bash
git init
git add .
git commit -m "FoodStock: primera versión"
git branch -M main
git remote add origin https://github.com/TUUSUARIO/foodstock.git
git push -u origin main
```

Si el contenido de `foodstock/` ya está en la raíz del repositorio, omite la carpeta al hacer `add`; si está anidado, puedes desplegar directamente esa subcarpeta configurando GitHub Pages con esa ruta o moviendo su contenido a la raíz del repo.

⚠️ Configura Firebase (paso 3) **antes** de subirlo, o edita `js/firebaseConfig.js` y haz otro commit después.

## 5. Activar GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En "Build and deployment", elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)` (o `/docs` si has movido ahí los archivos).
4. Guarda. Al cabo de uno o dos minutos, la app estará disponible en:

   ```
   https://TUUSUARIO.github.io/foodstock/
   ```

Todas las rutas del proyecto usan enlaces relativos, así que funciona igual en la raíz de un dominio o en un subpath como `/foodstock/`.

## 6. Instalarlo en iPhone

1. Abre la URL de la app en **Safari**.
2. Pulsa el botón compartir (el cuadrado con la flecha hacia arriba).
3. Elige **"Añadir a pantalla de inicio"**.
4. Confirma el nombre y pulsa **Añadir**.

La app se abrirá a pantalla completa, sin barra de Safari, con su propio icono.

## 7. Instalarlo en Android

1. Abre la URL en **Chrome**.
2. Toca el menú (⋮) y elige **"Instalar app"** o **"Añadir a pantalla de inicio"**.
3. Confirma la instalación.

## 8. Cómo funciona el almacenamiento

Todos los datos viven en **Firebase Firestore**, bajo `families/{uid}/...`, donde `{uid}` es el usuario de la cuenta familiar compartida (ver paso 3). Todos los dispositivos que inician sesión con esa misma cuenta leen y escriben la misma base de datos en la nube, con sincronización en tiempo real.

- La capa de acceso a datos vive en [`js/database.js`](js/database.js) y expone operaciones genéricas (`getAll`, `put`, `delete`, `exportAll`, `importAll`, `watchStore`…) sobre las colecciones: `households`, `products`, `shopping`, `recipes`, `calendar`, `settings`, `favorites`.
- Los módulos de dominio (`households.js`, `products.js`, `shopping.js`, `recipes.js`, `calendar.js`, `settings.js`, `stats.js`) construyen la lógica de negocio sobre esa capa, sin conocer nada de la interfaz ni de Firebase.
- `js/app.js` se suscribe con `watchStore` a cada colección y vuelve a pintar la pantalla actual en cuanto detecta un cambio remoto — así es como se ve al instante en un móvil lo que se cambió en otro.
- Firestore cachea los datos localmente (`persistentLocalCache`), así que la app sigue funcionando sin conexión y sincroniza en cuanto vuelve la red.
- Aun así, usa regularmente **Ajustes → Exportar datos** para tener una copia de seguridad en JSON adicional.

## 9. Cómo conectar la IA más adelante

Por diseño, **no hay ninguna clave de API de IA en el frontend** (GitHub Pages es un hosting estático público; cualquier clave incluida en el JavaScript quedaría expuesta). Esto es distinto de la configuración de Firebase del paso 3, que no es secreta.

`js/aiService.js` centraliza toda la lógica de IA:

- `aiConfig.endpoint` está vacío por defecto. Mientras tanto, la app usa un motor de recomendaciones **100% local**, basado en reglas sobre tu inventario, tus recetas y tu calendario.
- Para conectar una IA real (OpenAI, Anthropic, etc.) sin exponer claves:
  1. Despliega un backend/proxy propio (una función serverless, un pequeño servidor) que reciba la petición del cliente y añada la clave de API en el servidor.
  2. Define `aiConfig.endpoint = 'https://tu-proxy.tudominio.com/api/ai'` en `js/aiService.js` (o cárgalo desde configuración).
  3. `chatWithAI`, `getRecommendation` y `whatCanICook` intentarán usar ese endpoint automáticamente y solo caerán al motor local si falla o no está configurado.

## 10. Limitaciones actuales

- El motor de IA sin backend es local y basado en reglas: da buenas recomendaciones a partir de tu inventario y recetas, pero no es un modelo de lenguaje generativo.
- El inicio de sesión es una única cuenta compartida por toda la familia (sin perfiles individuales ni permisos distintos por persona).
- La app necesita cargarse con conexión al menos una vez por dispositivo (para descargar el SDK de Firebase); después funciona offline con caché de Firestore.
- Las notificaciones push están preparadas en la interfaz de Ajustes pero no implementadas (requieren permisos del sistema y configuración adicional en Firebase Cloud Messaging).
- La información nutricional es orientativa y no constituye consejo médico.

---

Hecho con HTML, CSS y JavaScript estándar. Sin frameworks, sin build. Backend gestionado (Firebase) solo para la sincronización de datos entre dispositivos.
