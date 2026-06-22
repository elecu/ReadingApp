# BookQuest

BookQuest es una Progressive Web App (PWA) para registrar sesiones de lectura y convertir los datos en estadisticas, graficos y elementos de gamificacion (niveles, XP, rachas, logros y "misiones" de lectura).

## Que hace

- Registro de sesiones de lectura (paginas leidas, minutos, libro activo).
- Calculo de metricas: paginas/minuto, ETA de finalizacion de libro, rachas diarias, XP y niveles.
- Dashboard con graficos (barras dibujadas en `<canvas>`, sin librerias externas) por rango de fechas (7 dias, 30 dias, 3 meses, 6 meses, 1 anio, todo el tiempo).
- Generacion de "misiones" (quest objects) ligadas al progreso de lectura, con un generador heuristico y un modo opcional de IA on-device (WebLLM / Transformers.js) que corre en el navegador, sin servidor.
- Exportacion de resumenes visuales (PNG) de progreso, citas y finalizacion de libros.
- Multilenguaje (ingles/espanol) mediante un sistema de i18n propio.
- Persistencia local (localStorage) con respaldo opcional en Google Drive (carpeta de datos de la app), usando OAuth.

## Como esta hecho

- **Frontend**: HTML, CSS y JavaScript vanilla (sin frameworks ni bundler). Toda la logica de la app vive en [app.js](app.js), la estructura en [index.html](index.html) y los estilos en [style.css](style.css).
- **Datos**: el estado de la app (libros, sesiones, logros, configuracion) se guarda como JSON en `localStorage` y, si el usuario lo activa, se sincroniza con un archivo JSON en la carpeta de datos de su Google Drive.
- **Backend minimo**: un Cloudflare Worker ([backend/worker.js](backend/worker.js)) que maneja el flujo OAuth de Google (codigo de autorizacion) y guarda los refresh tokens en Cloudflare KV, para que el frontend pueda renovar el acceso sin depender de cookies de terceros.
- **IA on-device (opcional)**: integracion con WebLLM y Transformers.js para generar contenido de las misiones directamente en el navegador del usuario, sin enviar datos a un servidor.
- **PWA**: instalable mediante [manifest.json](manifest.json), con icono y soporte offline basico.
- **Pruebas**: pruebas unitarias en Node (`tests/`) sobre la logica de calculo de tiempo/progreso.

## Estructura del proyecto

```
index.html        Marcado y layout de la app
app.js            Logica de la aplicacion (estado, calculos, graficos, IA, Drive)
style.css         Estilos
i18n.es.js        Traducciones al espanol
config.js         Configuracion del cliente OAuth y URL del backend
manifest.json     Manifest de la PWA
backend/          Cloudflare Worker para el OAuth de Google Drive
tests/            Pruebas unitarias (Node)
```

## Ejecutar localmente

No requiere instalacion de dependencias. Basta con servir los archivos estaticos, por ejemplo:

```
npx serve .
```

y abrir `index.html` en el navegador. La sincronizacion con Google Drive es opcional y requiere configurar `config.js` y desplegar el worker (ver [backend/README.md](backend/README.md)).
