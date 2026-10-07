# Validación de la entrega

## Pruebas automatizadas

`npm test` ejecuta 23 escenarios contra una base SQLite independiente en memoria. Cada escenario contiene varias solicitudes y comprobaciones. Resultado de la ejecución: **21 aprobados, 0 fallidos**.

Se comprueban diez registros válidos y diez inválidos; unicidad de correos; diez accesos válidos y diez inválidos; bloqueo después de diez fallos; cinco rutas protegidas; cierre y expiración; diez ciclos completos de rutinas; el límite de diez; rechazo de operaciones sobre datos ajenos; siete días; validación de números; veinte sesiones con fechas y cargas; edición/eliminación de historial; conservación al eliminar rutina; mediciones de peso; diez cambios de perfil; cambio de contraseña y revocación de sesiones; permisos administrativos; eliminación de cuentas; Origin y tamaño de cuerpo; independencia de demostraciones; y treinta consultas de catálogo con fuente simulada y caché.

El ensayo de catálogo de la suite verifica la lógica y el uso de caché; no mide el SLA de Internet. La biblioteca se comprobó además contra la fuente externa real desde la aplicación.

## Compilación y empaquetado

`npm run check` comprueba la sintaxis del servidor. `npm run build` produce el frontend y el Worker. `node scripts/validate-artifact.mjs` importa el artefacto y comprueba su exportación fetch ESM. Los datos de runtime y las credenciales se excluyen de Git y de los archivos públicos.

## Revisión en navegador

Se recorrieron el acceso a demostración, la biblioteca externa, la creación de una rutina, selección de ejercicios, carga inicial, guardado, registro de sesión desde la interfaz móvil y aparición de la sesión en el historial. Se revisaron las pantallas y los diálogos para detectar superposiciones, recortes y desbordamiento.

La revisión de tamaños en escritorio es una comprobación de diseño adaptable; no equivale a ensayos en dispositivos físicos ni a compatibilidad certificada en los tres motores.

## Criterios que requieren un entorno de aceptación

- CA-10: ejecutar treinta consultas con las condiciones de red acordadas y medir p95 < 3 s. La aplicación tiene timeout de 2,2 s y respaldo; una prueba de lógica con fuente simulada no certifica la red.
- CA-11: monitoreo real cada cinco minutos durante siete días entre las 04:00 y las 00:00. No se simuló una semana de operación.
- CA-12: prueba cronometrada de usabilidad con cinco personas nuevas. No se reemplaza por una opinión sobre la interfaz.
- CA-13/14: pruebas en Chrome, Edge, Firefox y dispositivos Android/iOS reales. La inspección realizada usa el navegador disponible en el entorno.
- CA-15: carga de quince minutos con 500 usuarios concurrentes comparada con 50, sobre la infraestructura definitiva. No se declara aprobada sin medición.

Los requisitos funcionales están implementados y tienen verificación automatizada; los criterios operativos anteriores permanecen como validaciones de aceptación del entorno final.

## Traducción del catálogo

Se comprueban los nombres y las indicaciones de los 876 ejercicios, la conservación del nombre original como alias de búsqueda, la búsqueda en español y la presentación traducida de rutinas e historial guardados. Los identificadores, fechas, cargas y versión del estado se conservan. Los cinco movimientos sin instrucciones en la fuente reciben indicaciones propias en español.
