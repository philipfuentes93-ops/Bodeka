# Bodeka · Inventario de bodegas

App web para controlar el stock de las bodegas de bebidas, aseo y snack/lácteos/colaciones,
con módulos de Inventario, Recepción y Despacho. Los datos se guardan en Firebase (Firestore),
se comparten en tiempo real entre usuarios y la app sigue funcionando sin conexión.

Todo se configura desde el navegador; no necesitas instalar nada.

## 1. Crear el proyecto en Firebase
1. Entra a https://console.firebase.google.com y crea un proyecto (por ejemplo `inventario-bodegas`).
   Anota el **ID del proyecto** (aparece bajo el nombre).
2. **Firestore Database** > Crear base de datos > modo producción > región `southamerica-east1`.
3. **Authentication** > Comenzar > Método de acceso > habilita **Google**.
4. **Configuración del proyecto** (engranaje) > General > Tus apps > ícono `</>` (web).
   Regístrala y copia el objeto `firebaseConfig`.

## 2. Configurar los archivos
- `config.js`: pega los valores de `firebaseConfig`.
- `.firebaserc`: ya tiene el ID `inventario-de-bodegas`.
- `firestore.rules`: ya incluye `philip.fuentes93@gmail.com`; agrega los demás correos separados por coma.

## 3. Publicar las reglas de seguridad
En Firebase > Firestore Database > **Reglas**, pega el contenido de `firestore.rules` y presiona **Publicar**.
Cada vez que agregues a alguien, edita la lista de correos y vuelve a publicar.

## 4. Subir a GitHub
1. En https://github.com/new crea un repositorio (puede ser privado), por ejemplo `inventario-bodegas`.
2. En el repositorio: **Add file > Upload files** y arrastra todos los archivos de esta carpeta.
3. La carpeta `.github` a veces no se sube al arrastrar porque está oculta. Si no aparece, usa
   **Add file > Create new file**, escribe como nombre `.github/workflows/deploy.yml` y pega el contenido de ese archivo.

## 5. Publicación automática en Firebase Hosting
1. En Firebase > Configuración del proyecto > **Cuentas de servicio** > **Generar nueva clave privada**.
   Se descarga un archivo `.json`. Guárdalo en un lugar seguro y no lo subas al repositorio.
2. En GitHub > tu repositorio > **Settings > Secrets and variables > Actions > New repository secret**, crea:
   - `FIREBASE_SERVICE_ACCOUNT`: pega el contenido completo del archivo `.json`.
   - `FIREBASE_PROJECT_ID`: el ID del proyecto.
3. En la pestaña **Actions**, abre "Publicar en Firebase Hosting" y presiona **Run workflow**.
4. Cuando termine (círculo verde), la app queda en `https://inventario-de-bodegas.web.app`.

Desde ahí, cada cambio que subas a la rama `main` se publica solo.

## Instalarla como aplicación
Abre el link en Chrome (computador o Android) y elige **Instalar app** en el menú.
En iPhone: Safari > Compartir > **Agregar a pantalla de inicio**.
