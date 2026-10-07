# Administración inicial

## Puesta en marcha local

1. Instalá Node.js 22.13 o superior.
2. Opcionalmente copiá `.env.example` a `.env`, elegí el correo y una contraseña larga para la cuenta inicial. No subas `.env` al repositorio.
3. Ejecutá `npm install`, `npm run build` y `npm start`, o abrí `INICIAR-SPORTIFY.cmd`.
4. Abrí http://localhost:3000. Si no definiste ADMIN_PASSWORD, la consola muestra una contraseña aleatoria una única vez. Guardala antes de cerrar la terminal.
5. Iniciá sesión con `admin@sportify.local` (o el correo configurado). Abrí **Administración** desde el menú.

No hay una contraseña universal ni credenciales predecibles incorporadas al código. Un reinicio reutiliza la base de datos y no vuelve a crear la cuenta.

## Gestión de socios

Los socios se registran desde la pantalla de inicio. La administración permite buscar, desactivar, reactivar y eliminar cuentas. Desactivar impide el ingreso y cierra las sesiones existentes, conservando sus registros. Reactivar permite volver a ingresar con la misma contraseña. Eliminar borra permanentemente toda la información del socio, previa confirmación.

Los administradores no pueden alterar su propia cuenta desde este panel ni eliminar otras cuentas administrativas. Tampoco pueden consultar, diseñar ni asignar rutinas de los socios.

## Recuperación administrativa local

Si se pierde la contraseña inicial, detené el servidor y ejecutá:

```powershell
node scripts/reset-admin.mjs
```

El script genera una contraseña aleatoria nueva para la cuenta configurada en ADMIN_EMAIL (o admin@sportify.local), revoca sus sesiones y la muestra una sola vez. Requiere acceso al equipo y a la base de datos; no es un endpoint público. Después iniciá el servidor e ingresá con la nueva clave. No elimina usuarios ni entrenamientos.

## Copias de seguridad

Detené el servidor y copiá `data/sportify.sqlite` a un destino privado. Con el servidor detenido y cerrado correctamente, la base incorpora las escrituras pendientes de WAL. Para restaurar, detené el servidor, preservá la copia actual y reemplazá la base con la copia elegida. Respetá la ventana de mantenimiento 00:00–04:00 si la instancia ya está en servicio. Las exportaciones individuales de los socios no sustituyen una copia de seguridad de la base.

## Entorno alojado

El Worker usa D1, no el archivo local. El manifiesto `.openai/hosting.json` declara DB; las tablas se crean mediante la migración `drizzle/0000_sportify.sql`. Configurá ADMIN_EMAIL y ADMIN_PASSWORD como variables de runtime del alojamiento; la contraseña debe ser secreta. Los cambios de esas variables no reemplazan claves existentes. La cuenta administra los socios dentro de la aplicación; el acceso al sitio sigue sujeto a su privacidad en Sites.

## Validación operativa pendiente

La disponibilidad del 99% en siete días y la prueba de 500 usuarios por quince minutos deben ejecutarse sobre la infraestructura elegida. También corresponde comprobar los flujos en dispositivos Android/iOS reales y las versiones vigentes de Chrome, Edge y Firefox antes de habilitar el servicio a socios reales. Estas comprobaciones no se sustituyen con las pruebas unitarias ni con cambiar el tamaño del navegador de escritorio.
