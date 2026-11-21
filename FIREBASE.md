# Conectar las partidas compartidas (Firebase)

Solo hay que hacerlo una vez. Es gratis para un grupo de juego.

1. Entra en https://console.firebase.google.com con tu cuenta de Google y pulsa **Crear un proyecto**. Nombre: `senda-del-errante`. Puedes desactivar Google Analytics.
2. Menú **Compilación → Authentication → Comenzar**. En *Método de acceso*, activa **Google** y elige tu correo de asistencia.
3. En **Authentication → Configuración → Dominios autorizados**, pulsa *Agregar dominio* y añade `jdevgpt.github.io`.
4. Menú **Compilación → Firestore Database → Crear base de datos**. Ubicación: `eur3 (europe-west)`. Modo: **producción**.
5. En Firestore, pestaña **Reglas**: borra lo que haya, pega el contenido de [`firestore.rules`](firestore.rules) y pulsa **Publicar**.
6. Pulsa el engranaje **Configuración del proyecto → Tus apps → icono web `</>`**. Ponle de nombre `Senda` (sin Hosting) y copia el bloque `firebaseConfig`.
7. Pega ese bloque en [`js/firebase-config.js`](js/firebase-config.js) (o pásaselo a Claude). Estos datos no son secretos: la seguridad la ponen las reglas del paso 5.

## Cuando cambian las reglas
Si la app añade funciones nuevas que guardan datos (por ejemplo, las **aventuras del DM**), hay que volver a copiar [`firestore.rules`](firestore.rules) en **Firestore → Reglas** y pulsar **Publicar**. Hasta entonces, esas cosas se guardan solo en el dispositivo.

## Cómo se usa
- **DM**: Partidas → Entrar con Google → *Crear partida*. Comparte el código de 6 letras.
- **Jugadores**: Partidas → Entrar con Google → *Unirme con código*, y después unen su personaje a la partida.
- Cada jugador solo puede modificar sus hojas. El DM las ve todas en vivo, pero no puede editarlas.
