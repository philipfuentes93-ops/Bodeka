// Service worker mínimo: permite instalar la app y avisa si se abre sin internet.
// No guarda copias de la app ni de los datos: siempre se usa la versión más reciente.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.mode !== "navigate" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(fetch(r).catch(() => new Response(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title></head>' +
    '<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#F3F8F7;color:#16252A;text-align:center;padding:24px">' +
    '<div><h1 style="margin:0 0 8px">Sin conexión</h1><p>Depósito necesita internet para mostrar el inventario actualizado.<br>Revisa tu conexión y vuelve a abrir la app.</p>' +
    '<button onclick="location.reload()" style="margin-top:12px;padding:10px 18px;border:0;border-radius:10px;background:#0E7C70;color:#fff;font-weight:700;font-size:1rem">Reintentar</button></div></body></html>',
    {headers: {"Content-Type": "text/html; charset=utf-8"}})));
});
