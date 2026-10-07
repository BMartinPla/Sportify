# Sportify

Aplicación web de autogestión del entrenamiento, implementada a partir de los requerimientos RF-01 a RF-08 del proyecto final de Gestión de Proyectos de UTN FRSN. Interfaz en español, adaptable a celular, con una identidad deportiva en verde profundo, lima y tonos naturales.

## Inicio rápido

Requiere **Node.js 22.13 o superior**. No requiere instalar una base de datos ni obtener una clave de API.

```powershell
npm install
npm run build
npm start
```

Abrir **http://localhost:3000**. En Windows también podés ejecutar `INICIAR-SPORTIFY.cmd`. El primer arranque crea la base de datos y una cuenta administrativa; su contraseña aleatoria se muestra una única vez en la consola. Guardala en un gestor de contraseñas. Para elegir las credenciales antes de iniciar, copiá `.env.example` a `.env` y completá `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

Para desarrollar con actualización automática:

```powershell
npm run dev
```

Para probar sin registrarse, elegí **Explorar la demostración**. Cada visitante recibe un espacio independiente con dos rutinas, dieciséis entrenamientos y diez registros de peso. La sesión y sus datos sobreviven a la recarga. Podés cerrar sesión y crear una cuenta propia vacía.

## Funciones entregadas

- Registro, acceso, cierre de sesión y cambio de contraseña. Hash PBKDF2-SHA256 con sal individual; tokens de sesión almacenados mediante SHA-256 y cookie HttpOnly.
- Creación, edición, duplicación y eliminación de rutinas privadas; una principal y hasta diez rutinas por socio.
- Planificación de los siete días de la semana, orden de ejercicios, series, repeticiones o segundos y carga inicial.
- Biblioteca externa con búsqueda por nombre, filtros musculares y equipamiento, imágenes, indicaciones y selección para agregar a rutinas. Catálogo local de respaldo ante una interrupción de la fuente.
- Registro de sesiones con cargas efectivas, ejercicios completados, fecha, duración, notas y cronómetro. Edición y eliminación del historial.
- Panel calculado a partir de los datos del socio: sesiones semanales, volumen, tiempo y cumplimiento del objetivo.
- Gráficos interactivos de peso corporal y cargas por ejercicio, con filtros de período.
- Gestión de nombre, altura, peso objetivo, propósito y frecuencia semanal. El peso actual surge de la última medición cronológica.
- Exportación del historial en CSV y copia personal en JSON. Eliminación de la propia cuenta con confirmación de contraseña.
- Administración de cuentas: listar, buscar, desactivar, reactivar y eliminar socios. Los administradores no pueden consultar ni modificar rutinas ajenas.

## Datos y configuración

La base local está en `data/sportify.sqlite` y usa SQLite en modo WAL. No se almacena el progreso en localStorage. Conservá el directorio `data` al actualizar la aplicación. La base local y la base alojada son independientes.

Variables admitidas: `PORT`, `DATABASE_PATH`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Las variables administrativas se usan exclusivamente para crear la cuenta inicial si todavía no existe; cambiar `.env` no modifica la contraseña de una cuenta existente. Para una cuenta ya creada, usá **Mi cuenta → Seguridad**, o la recuperación administrativa descrita en `docs/ADMINISTRACION.md`.

## Comprobaciones

```powershell
npm test
npm run check
npm run build
node scripts/validate-artifact.mjs
```

La suite cubre 23 escenarios con múltiples casos de aceptación: altas válidas e inválidas, autenticación, límite de rutinas, privacidad, siete días, veinte sesiones de progreso, diez cambios de perfil, mediciones, permisos administrativos y eliminación de cuentas. Consultá `docs/VALIDACION.md` para el alcance y los límites de la verificación.

## Estructura

- `src/`: aplicación React y estilos adaptables.
- `server/`: API compartida, seguridad, SQLite, catálogo y datos de demostración.
- `worker/`: adaptador Cloudflare Workers para el despliegue privado en Sites.
- `drizzle/`: migración inicial del esquema alojado.
- `scripts/`: compilación, inicio y validación del artefacto.
- `tests/`: pruebas funcionales e integración de API.
- `docs/`: manual de usuario, administración, arquitectura y validación.

## Fuentes y licencias

Catálogo e imágenes de ejercicios: [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), dominio público (Unlicense). El catálogo completo incluye nombres e instrucciones en español, distribuidos con la aplicación para no depender de un servicio de traducción al consultar ejercicios. Los movimientos destacados conservan indicaciones propias. Fotografía de entrenamiento: [Unsplash](https://unsplash.com/photos/1517836357463-d25dfeac3438), servida como recurso local. Tipografías DM Sans y Barlow Condensed: Google Fonts, SIL Open Font License. Iconos: Lucide, ISC. React: MIT. Vite y esbuild: MIT. No se necesitan servicios pagos para ejecutar el proyecto localmente.

La administración de cuentas no representa un rol de entrenador. No se incluyen rutinas públicas, comunidad, aplicaciones móviles nativas, wearables ni asignación de rutinas a terceros.
