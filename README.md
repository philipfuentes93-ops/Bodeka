# Depósito · Picking & Inventarios

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

## Mapa 3D de bodega (Tránsito Piso 11)

En **Por bodega → Tránsito Piso 11** hay una vista **Mapa 3D** con la bodega dibujada y sus zonas:

- **Reposición** (azul): packs cerrados. **Picking** (naranja): unidades abiertas para cargar el cooler.
- Tocar una zona muestra sus productos, su mínimo y su estado. **Contar zona** guarda el conteo de una vez y deja un movimiento de ajuste por cada producto que cambió.
- Los productos se asignan a zonas (`zonas` y `zmin` en cada producto). El stock de la bodega sigue siendo el de siempre; lo que no está en una zona aparece en **Sin zona** para asignarlo.
- **Tomar inventario** (en esa misma pantalla): cuentas zona por zona, ves las diferencias antes de guardar y al confirmar se actualiza el stock de la bodega. Cada producto con diferencia deja un movimiento de ajuste.
- Para cargar el inventario por primera vez: en cada zona se busca el producto (Enter lo agrega), se escribe la cantidad (Enter pasa al siguiente) y **Guardar esta zona** deja esa zona guardada sin esperar a terminar todas.
- **Mínimo y máximo por ubicación** (`zmin` y `zmax`): el mínimo avisa cuándo reponer y el máximo dice hasta dónde. Se fijan al contar una zona o al tomar inventario.
- **Reponer**: lista las ubicaciones bajo su mínimo. En Picking se pueden pasar packs desde las zonas de Reposición de la misma bodega, y lo que no alcanza se trae de Reposición con un traspaso interno ya armado. Las zonas por reponer también aparecen marcadas en rojo en el mapa.
- Solo existe para el Piso 11. El Piso 14 tiene otra distribución y se configura después.

## Modo simple (celular de una mano)

En **Picking** hay un botón **Modo simple para operarios** (y **Copiar enlace**, que termina en `#simple`, para abrirlo en otro equipo). En ese modo desaparece el menú y la persona ve solo:

- **Hacer un pedido**: una pregunta por pantalla. A dónde lo llevas (un botón grande por cooler o tránsito) → qué llevas (tarjetas con foto y nombre, **+ Agregar** y botones **+** / **−** de a un pack) → revisar → **Confirmar pedido**. Registra el mismo picking (a un cooler) o traspaso interno (a un tránsito) de la pantalla normal, y descuenta el stock igual. Sin imprimir, vaciar ni datos técnicos. De dónde saca se elige solo (el tránsito del mismo piso, o Reposición); se puede cambiar.
- **Para llevar**: los pedidos confirmados, uno por destino. Cada tarjeta trae **solo foto, nombre y cantidad solicitada**; se toca cuando ya está y **Terminé** lo deja entregado para todos.
- **Ya entregados hoy**: para ver el detalle de lo que ya se llevó.
- Se sale con **Salir del modo simple** (abajo del inicio). Las fotos de los productos se cargan en Productos; sin foto se muestra la categoría.
- El pedido a "Todos los coolers" (General) sigue haciéndose en la pantalla normal.

## Actualizaciones

La app se actualiza sola: cada vez que se abre carga la última versión publicada. Si está abierta cuando se publica un cambio, aparece arriba un aviso grande **Actualización disponible · Toca aquí para actualizar** (se revisa cada 2 minutos y cuando la app vuelve a primer plano). Al tocarlo se recarga y queda al día; los datos no se tocan.

Hay también un botón **Actualizar la app** siempre visible (menú lateral, **Más** del celular, pie del modo simple y pantalla de ingreso) que busca una versión nueva y recarga si la hay, y un número de **versión** en el menú para comprobar qué versión tiene cada equipo. `APP_VERSION` está en `index.html`: se sube en cada publicación.

## Instalarla como aplicación
Abre el link en Chrome (computador o Android) y elige **Instalar app** en el menú.
En iPhone: Safari > Compartir > **Agregar a pantalla de inicio**.

En la app hay un botón **Descargar la app** (en el menú lateral, en **Más** del celular y en la pantalla de ingreso). Si el navegador permite instalar, la instala con un toque; si no, muestra los pasos para Chrome, Edge, Android o iPhone y deja copiar el enlace. Se oculta solo cuando la app ya está instalada. `sw.js` es un service worker mínimo (no guarda copias): permite instalarla y avisa si se abre sin internet.
