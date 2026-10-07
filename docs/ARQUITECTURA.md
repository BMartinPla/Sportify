# Arquitectura técnica

## Componentes

La aplicación separa una interfaz React 19, una API de negocio basada en Request/Response y un adaptador de persistencia SQL. El mismo módulo `server/api.mjs` atiende los entornos local y alojado. Los estilos son CSS propio; los gráficos son SVG con valores derivados de los registros. Vite produce recursos estáticos optimizados y esbuild integra la API y los recursos en un Worker ESM.

En local, `server/index.mjs` usa HTTP de Node y `node:sqlite`. En desarrollo conecta Vite como middleware; en producción sirve `dist/client`. El servidor escucha únicamente en la interfaz local `127.0.0.1`. Para exponerlo en una infraestructura propia debe configurarse conscientemente un proxy HTTPS y una interfaz de escucha adecuada.

En Sites, `worker/index.js` sirve la misma interfaz y atiende la API mediante la base D1 vinculada como `DB`. Sites mantiene el sitio privado para su propietario; además, las cuentas de Sportify aplican su autenticación y separación de datos. La barrera de acceso del alojamiento no sustituye los permisos del sistema de socios. La migración inicial se incluye desde `drizzle/` y no se ejecuta DDL en las solicitudes.

## Modelo de datos

`users`: identificador UUID, correo único sin distinción entre mayúsculas, nombre, hash de contraseña, rol member/admin, estado activo y fecha de creación.

`sessions`: hash SHA-256 del token, referencia al usuario y vencimiento absoluto. Relación muchos a uno con users. Los tokens de 256 bits se generan con Web Crypto. La cookie dura siete días; el servidor comprueba su vencimiento y el estado de la cuenta en cada consulta protegida.

`user_state`: una fila por usuario, versión y documento JSON con perfil, rutinas, sesiones de entrenamiento y mediciones de peso. Esta estructura mantiene toda la información individual bajo la clave del usuario autenticado. Los identificadores de rutina y registro se buscan únicamente dentro de ese documento, sin permitir seleccionar otro propietario en la solicitud.

`login_attempts`: clave por correo, cantidad de intentos fallidos y vencimiento; bloquea luego de diez fallos durante quince minutos. No se almacena la contraseña intentada.

El perfil contiene altura, peso actual, objetivo de peso, propósito y frecuencia semanal. Una rutina contiene nombre, descripción, color, condición de principal, fecha y ejercicios. Cada ejercicio tiene identificador de catálogo, identificador de entrada, nombre, músculo, equipamiento, día 0–6, series, repeticiones y carga. Un entrenamiento conserva nombre y referencia de la rutina, fecha, duración, notas y valores efectivos de cada ejercicio. Una medición de peso contiene identificador, fecha y valor.

La eliminación de rutina conserva el historial. La eliminación de cuenta borra sesiones, estado y usuario en un lote transaccional. SQLite usa WAL y timeout de escritura. Los cambios del documento se hacen con actualización condicional de versión: operaciones simultáneas sobre una versión detectada en el servidor devuelven 409. Esto no equivale a resolver automáticamente ediciones antiguas mantenidas abiertas en distintas pestañas; conviene recargar antes de editar el mismo dato desde otro dispositivo.

El documento JSON simplifica una primera versión individual. Para historiales de muchos años o cargas mayores, corresponde normalizar entrenamientos y mediciones en tablas paginadas; el límite actual de 100 ejercicios por rutina y por sesión mantiene acotada cada operación de escritura, pero el historial crece con el uso.

## Seguridad

Las contraseñas se procesan con PBKDF2-SHA256, 100.000 iteraciones y sal aleatoria individual de 256 bits, compatible con Web Crypto de Workers. El factor se guarda en el formato del hash. No se guardan contraseñas recuperables en la base, en exportaciones ni en respuestas. Antes de una operación de gran escala conviene revisar el factor de trabajo y los límites de CPU del proveedor.

Los tokens solo llegan al navegador en cookies HttpOnly, SameSite=Lax, Path=/ y Secure en HTTPS; la base solo conserva su hash. El cierre elimina el token. Cambiar contraseña revoca otras sesiones y desactivar una cuenta revoca todas las suyas.

Las mutaciones verifican Origin cuando está presente, validan tipos y rangos, limitan el cuerpo a 100 KB y usan parámetros SQL. React escapa el texto de los usuarios. No se aceptan roles ni identificadores de propietario desde el cliente. Las cuentas administrativas solo acceden a metadatos de cuentas; los hashes nunca forman parte de las respuestas públicas.

El administrador inicial se crea exclusivamente si no existe. En local recibe credenciales de variables de entorno o una clave aleatoria mostrada una sola vez. En el alojamiento, ADMIN_EMAIL y ADMIN_PASSWORD se configuran como variables de runtime, con la contraseña marcada como secreta.

## Integración del catálogo

Fuente: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json, conjunto público sin clave API. El backend normaliza sus campos e incorpora etiquetas musculares y equipamiento en español. Los 876 ejercicios de la fuente incluyen traducciones de nombres e instrucciones en `server/exercises.es.json`; los movimientos destacados conservan indicaciones propias. Las traducciones se resuelven por el identificador estable, sin solicitudes a servicios de traducción durante el uso. El nombre original se conserva como alias de búsqueda. Los nuevos movimientos de la fuente se incorporan cuando cuentan con traducción. La lectura del estado aplica los nombres en español a rutinas e historial guardados sin cambiar identificadores, cargas, fechas ni la versión del documento.

La primera consulta dispone de 2,2 segundos para acceder a la fuente; las siguientes reutilizan una caché en memoria de una hora. Consultas concurrentes comparten la actualización pendiente. Si la fuente falla, se mantiene una caché anterior o se ofrece el catálogo curado de 24 movimientos. La respuesta informa live/cached/fallback. Las imágenes se sirven desde los recursos originales del catálogo; ante un error, aparece una ilustración CSS de respaldo. Las imágenes no están incluidas en el timeout de consulta JSON y dependen de la conexión del navegador.

## API principal

- `POST /api/auth/register`, `/login`, `/demo`, `/logout`; `GET /api/auth/me`.
- `GET /api/state`, `/api/exercises` y `/api/health`.
- `POST /api/routines`; `PUT/DELETE /api/routines/:id`; `POST /api/routines/:id/duplicate` y `/primary`.
- `POST /api/logs`; `PUT/DELETE /api/logs/:id`.
- `POST /api/weights`; `DELETE /api/weights/:id`.
- `PUT/DELETE /api/account`; `PUT /api/account/password`.
- `GET /api/admin/users`; `PATCH/DELETE /api/admin/users/:id`.

## Operación

La aplicación no programa cortes de servicio. Las tareas que requieran interrupción deben realizarse entre las 00:00 y las 04:00, según el proyecto. El cumplimiento de disponibilidad y 500 usuarios concurrentes exige medir la infraestructura final. La entrega incluye las funciones y pruebas automatizadas, sin afirmar una certificación de infraestructura que no fue ejecutada.
