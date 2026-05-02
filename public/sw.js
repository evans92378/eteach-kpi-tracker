const CACHE_NAME = "eteach-kpi-tracker-v4";
const appUrl = (path) => new URL(path, self.registration.scope).toString();
const APP_SHELL = [appUrl("./"), appUrl("./index.html"), appUrl("./manifest.webmanifest"), appUrl("./favicon.svg")];
const IS_LOCAL_DEV = ["localhost", "127.0.0.1", "::1"].includes(self.location.hostname);

if (IS_LOCAL_DEV) {
  self.addEventListener("install", () => {
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll())
        .then((clients) => clients.forEach((client) => client.navigate(client.url))),
    );
  });
} else {

  self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(appUrl("./index.html")))),
    );
  });
}
