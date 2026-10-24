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

- **Reposición** (azul): sobre todo packs cerrados. **Picking** (naranja): sobre todo unidades abiertas para cargar el cooler.
- **Contar en packs y en unidades**: en cualquier zona cada producto que viene en pack se cuenta con dos casillas, **packs** y **sueltas** (por ejemplo 8 packs + 3 sueltas); si no viene en pack, una sola casilla de **unidades**. Una casilla en blanco no cambia (se conserva lo que dice el sistema). La diferencia y la revisión se muestran en packs + unidades. El mínimo y el máximo siguen en la unidad de la zona (packs en Reposición, unidades en Picking).
- Tocar una zona muestra sus productos, su mínimo y su estado. **Contar zona** guarda el conteo de una vez y deja un movimiento de ajuste por cada producto que cambió.
- Los productos se asignan a zonas (`zonas` y `zmin` en cada producto). El stock de la bodega sigue siendo el de siempre; lo que no está en una zona aparece en **Sin zona** para asignarlo.
- **Tomar inventario** (en esa misma pantalla): cuentas zona por zona, ves las diferencias antes de guardar y al confirmar se actualiza el stock de la bodega. Cada producto con diferencia deja un movimiento de ajuste.
- Para cargar el inventario por primera vez: en cada zona se busca el producto (Enter lo agrega), se escribe la cantidad (Enter pasa al siguiente) y **Guardar esta zona** deja esa zona guardada sin esperar a terminar todas.
- **Tomar inventario, dos formas de verlo** (botones *Por zona* / *Por producto*): *Por zona* agrupa las zonas por cara (**Izquierda**, **Fondo**, Piso) con chips de color y un acceso rápido «Ir a»; *Por producto* muestra una tarjeta por producto con todo lo que tiene en cada ubicación (Izquierda, Fondo, Sin zona), para contarlo junto y guardarlo con **Guardar este producto**. Desde la tarjeta también se agrega el producto a otra zona, y el buscador encuentra productos que aún no tienen zona.
- **Quitar un producto de una zona**: en Tomar inventario (Por zona y Por producto) cada producto tiene **Quitar de esta zona** / **Quitar**. Si la zona tenía stock, pide confirmar y esas unidades pasan a **Sin zona** (el stock de la bodega no cambia). Se borran también su mínimo y máximo de esa zona y lo que estuviera escrito sin guardar. En el mapa, al *Contar zona*, sigue la **×**.
- **Mover de una zona a otra** (p. ej. llenar Picking con producto de Reposición): en Tomar inventario → *Por producto*, cada tarjeta tiene **Mover de una zona a otra**: eliges *Desde* (una zona con stock o *Sin zona*), *Hacia*, escribes packs y/o unidades y tocas **Mover**. El stock de la bodega no cambia; queda un movimiento de traspaso. Desde *Por zona*, el enlace **Mover a otra zona** abre el producto. Para traer stock de Reposición Piso -3 al Piso 11 se usa **Traspaso interno** (o *Hacer un pedido* en modo simple); lo que llega queda en *Sin zona* y de ahí se mueve a su zona. En la pestaña **Reponer**, **Pasar a picking** hace lo mismo automáticamente cuando una zona de Picking baja de su mínimo.
- **El mismo producto en varias zonas**: cada zona tiene su propia cantidad (agrega el producto a cada zona y cuenta lo que hay en ese lugar). Al contar, cada fila avisa *También está en…* con lo que hay en las otras zonas y en **Sin zona**, así no se cuenta dos veces. Lo que aparece en una zona sale primero de **Sin zona** (ya estaba en el stock de la bodega); solo si se cuenta más de lo que había sin zona, el stock de la bodega sube. Bajar una zona no toca las otras.
- **Mínimo y máximo por ubicación** (`zmin` y `zmax`): el mínimo avisa cuándo reponer y el máximo dice hasta dónde. Se fijan al contar una zona o al tomar inventario.
- **Reponer**: lista las ubicaciones bajo su mínimo. En Picking se pueden pasar packs desde las zonas de Reposición de la misma bodega, y lo que no alcanza se trae de Reposición con un traspaso interno ya armado. Las zonas por reponer también aparecen marcadas en rojo en el mapa.
- Solo existe para el Piso 11. El Piso 14 tiene otra distribución y se configura después.

## Modo simple (celular de una mano)

En **Picking** hay un botón **Modo simple para operarios** (y **Copiar enlace**, que termina en `#simple`, para abrirlo en otro equipo). En ese modo desaparece el menú y la persona ve solo:

- **Hacer un pedido**: una pregunta por pantalla, siempre con **← Volver** arriba y abajo. Paso 1: **de qué bodega sacas** (Reposición Piso -3 o un tránsito). Paso 2: **a dónde lo llevas** (cooler o tránsito). Paso 3: **qué llevas**: la lista es el inventario de la bodega elegida ("Hay 10 packs"), con foto, un selector **Packs | Unidades** (solo si el producto viene en pack), **+ Agregar** y **+** / **−** de a un pack o de a una unidad según el selector, y debajo el total en unidades, y arriba siempre la ruta *Sacas de → Llevas a*. Luego se revisa y **Confirmar pedido**, que **descuenta el stock de la bodega de origen** (lo dicen el resumen y la pantalla final). Registra el mismo picking (a un cooler) o traspaso interno (de Reposición a un tránsito) de la pantalla normal. Sin imprimir, vaciar ni datos técnicos.
- **Al confirmar, el pedido queda terminado** (ya no hay que marcar producto por producto ni apretar "Terminé"). La app pasa sola a **Mis pedidos** y deja arriba, fijo, lo que se pidió: la ruta *Sacas de → Llevas a* y las tarjetas con foto, nombre y cantidad. Más abajo está el listado de pickings con **Hoy / Semana / Rango** (en Rango se eligen las fechas *Desde* y *Hasta*); cada pedido muestra folio, hora, ruta y cantidad de productos, y al tocarlo se ve su detalle. También se entra desde el botón **Mis pedidos** del inicio. Incluye los pickings y traspasos hechos en la pantalla normal.
- **Rellenar picking** (botón naranja del inicio, con un número rojo): pasa producto de las zonas de **Reposición** a las de **Picking** del Tránsito Piso 11, sin cambiar el stock de la bodega (deja un movimiento *Rellenar picking*). Solo muestra productos de zonas de Picking que están **bajo su mínimo** y tienen reserva en Reposición; la cantidad sugerida llega hasta el máximo (o el mínimo) y se ajusta con + y −. Tiene tres vistas: **Lista** (lo más urgente primero, un botón *Ya lo pasé* por producto), **Estante** (se toca el nivel dibujado y se confirma el traspaso de ese nivel) y **Una a una** (una misión por pantalla). Si no hay reserva, la tarjeta ofrece *Hacer un pedido* a Reposición Piso -3.
- **Avisos de inventario** (botón rojo del inicio, con el número de alertas): muestra en cuatro pestañas lo **Sin stock**, **Crítico** (bajo el mínimo del producto o de una bodega), **Por vencer** (incluye vencidos) y **Mis avisos**, con el stock en cada bodega. En cada producto, **Pedir reposición** envía un aviso y **Avisar al coordinador** lo eleva para que se pida el producto; también se puede avisar de cualquier otro producto con el buscador. Cada aviso muestra su estado (enviado, coordinador avisado, atendido).
- Se sale con **Salir del modo simple** (abajo del inicio). Las fotos de los productos se cargan en Productos; sin foto se muestra la categoría.
- El pedido a "Todos los coolers" (General) sigue haciéndose en la pantalla normal.

## Actualizaciones

La app se actualiza sola: cada vez que se abre carga la última versión publicada. Si está abierta cuando se publica un cambio, aparece arriba un aviso grande **Actualización disponible · Toca aquí para actualizar** (se revisa cada 2 minutos y cuando la app vuelve a primer plano). Al tocarlo se recarga y queda al día; los datos no se tocan.

Hay también un botón **Actualizar la app** siempre visible (menú lateral, **Más** del celular, pie del modo simple y pantalla de ingreso) que busca una versión nueva y recarga si la hay, y un número de **versión** en el menú para comprobar qué versión tiene cada equipo. `APP_VERSION` está en `index.html`: se sube en cada publicación.

## Instalarla como aplicación
Abre el link en Chrome (computador o Android) y elige **Instalar app** en el menú.
En iPhone: Safari > Compartir > **Agregar a pantalla de inicio**.

En la app hay un botón **Descargar la app** (en el menú lateral, en **Más** del celular y en la pantalla de ingreso). Si el navegador permite instalar, la instala con un toque; si no, muestra los pasos para Chrome, Edge, Android o iPhone y deja copiar el enlace. Se oculta solo cuando la app ya está instalada. `sw.js` es un service worker mínimo (no guarda copias): permite instalarla y avisa si se abre sin internet.

## Avisos de reposición (plataforma)
Los avisos del operario se guardan como documentos `tipo:"aviso"` y llegan en vivo a la plataforma: aparece **Avisos** en el menú con un contador, un cartel en **Resumen** y la pantalla **Avisos de reposición**, con *Elevados al coordinador* (primero), *Pedidos de reposición* y *Atendidos recientes*. Cada aviso se puede **elevar al coordinador** o **marcar como atendido**, y **Copiar lista para pedir** deja en el portapapeles lo elevado para pegarlo en un correo o chat.

## Reposición Piso -3: máximo y cuánto falta
En **Por bodega → Reposición Piso -3** (y en cualquier bodega sin mapa) cada producto tiene **Mínimo** y **Máximo** en packs. Arriba aparece el panel **Para reponer…**: cuántos packs faltan en total para llegar al máximo, cuántos productos ya están OK y la lista de lo que hay que **pedir** (máximo − lo que hay), primero lo que está bajo el mínimo. **Copiar lista para pedir** deja esa lista en el portapapeles. En la tabla, la columna *Falta para el máximo* muestra **Falta N** (rojo si está bajo el mínimo, naranja si solo está bajo el máximo) u **OK**. Si un producto no tiene máximo se usa el mínimo como meta. El máximo no puede ser menor que el mínimo. Exportar Excel incluye el máximo y lo que falta.

## Si un equipo no ve lo que cambió otro
Cada cambio se guarda en la nube (Firestore) y llega a los demás equipos en vivo. El estado se ve abajo del menú (**Sincronizado · 14:32**), en el pie del panel del operario (**Datos: …**) y, si falla, en un **cartel rojo arriba**: *Sin conexión con el servidor* (lo que ves puede estar desactualizado; los cambios quedan en cola y se suben al volver la conexión) o *Modo local* (el equipo no cargó Firebase, por ejemplo porque la red bloquea los servicios de Google, y sus datos no se comparten). **Actualizar datos** (menú, o pie del modo simple) y **Reintentar** reconectan y traen los datos del servidor.

## Detalle del producto: stock por bodega en packs o en unidades
Al abrir un producto en **Productos**, cada bodega tiene dos casillas, **Packs** y **Unidades**. Si cambias las unidades, manda ese total (por ejemplo 102 → 105 queda 17 packs y 3 sueltas); si cambias los packs, se conservan las unidades sueltas que ya había. Cada cambio queda como ajuste manual en Movimientos.

## Modo local y bloqueo de la red
Las librerías de Firebase (10.12.2) van dentro de la app (`vendor/firebase/`) en vez de cargarse desde www.gstatic.com, para que las redes de empresa que bloquean ese sitio no dejen al equipo en *modo local* (sin compartir datos). Para actualizar la versión: bajar `firebase-app-compat.js`, `firebase-auth-compat.js` y `firebase-firestore-compat.js` de la misma versión del paquete `firebase` y reemplazarlos ahí.

## Cambios que quedaron solo en un equipo
Si un equipo trabajó sin conexión a la nube (modo local, sin sesión o sin internet), guarda una copia aparte de lo que tenía. Al conectarse y traer los datos de la nube, la app compara: si esa copia tiene stock **más nuevo** que la nube, muestra *Cambios guardados solo en este equipo* con cada producto (nube → este equipo) para **subir lo seleccionado**, **descargar un respaldo** o **descartar**. Se puede abrir cuando se quiera con **Cambios de este equipo** (abajo del menú). *Reparar* descarga un respaldo antes de borrar la copia local.

## Conexión alternativa (cuando la red corta la conexión continua)
Firestore trabaja con una conexión continua que algunas redes de empresa cortan: el cartel *Sin conexión con el servidor* aparecía a cada rato. Si en 20 segundos el servidor no responde (o al tocar **Actualizar datos** sin éxito), la app cambia sola a la **conexión alternativa**: lee todo y guarda cada cambio con peticiones HTTPS normales (API REST de Firestore, con la misma sesión y las mismas reglas de seguridad) y actualiza cada 12 segundos y después de cada cambio. El menú dice *Sincronizado (conexión alternativa) · hora*. Si la conexión continua vuelve, la app regresa sola a ella.

## Avisos que se cierran solos
Cuando el producto ya se repuso (por ejemplo al registrar una recepción), su aviso **Sin stock** o **Crítico** se marca como *repuesto* y pasa a *Atendidos recientes*; **Por vencer** se cierra si cambia el vencimiento o se acaba el stock. El stock que se muestra en cada aviso es el actual, no el de cuando se creó.

## Stock que no se pisa entre equipos
Recepciones, despachos, pickings, traspasos y entradas/salidas rápidas ya no envían el "stock final" del producto sino **solo lo que suma o resta en cada bodega** (incremento atómico de Firestore). Así, si un celular tiene datos atrasados o dos equipos mueven stock a la vez, no se borran los cambios entre sí (antes el último en guardar pisaba todo el producto). Los **conteos físicos y ajustes** siguen guardando el valor contado.

## Usuarios, roles y quién hizo qué
- Cada **movimiento, documento (recepción, despacho, picking, traspaso, pedido), aviso y producto modificado** guarda quién lo hizo (campo `por`, más `cuenta` con el correo). Se ve en la columna *Por* de Movimientos, *Registró* en Recepciones/Despachos, en el detalle de cada pedido y en los avisos.
- En el **modo simple**, la primera vez se pregunta «¿Cómo te llamas?» (queda en ese celular; se cambia al pie de la pantalla). Sirve cuando varias personas comparten una cuenta.
- **Roles** (colección `usuarios`, se asignan en *Bodegas → Usuarios y roles*, solo administrador): *Operario* (solo modo simple, sin opción de salir), *Coordinador* (toda la app menos la administración) y *Administrador* (los correos de `ADMINS`). Quien no tiene rol es Coordinador. Los roles ocultan funciones en la app; el permiso real del servidor sigue siendo la lista de correos de `firestore.rules`.
