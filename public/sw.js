const CACHE_VERSION = "notes-pwa-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "/",
  "/settings",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/fonts/Cairo-ExtraLight.ttf",
  "/fonts/Cairo-Light.ttf",
  "/fonts/Cairo-Regular.ttf",
  "/fonts/Cairo-Medium.ttf",
  "/fonts/Cairo-SemiBold.ttf",
  "/fonts/Cairo-Bold.ttf",
  "/fonts/Cairo-ExtraBold.ttf",
  "/fonts/Cairo-Black.ttf",
  "/fonts/AmiriQuran-Regular.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

function fetchWithTimeout(request, timeout = 1800) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("network-timeout")), timeout);
    })
  ]);
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetchWithTimeout(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || caches.match("/offline.html");
  }
}

async function appShellFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetchWithTimeout(request, 1200);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedPage = await cache.match(request);
    const appShell = await caches.match("/");
    const offlinePage = await caches.match("/offline.html");
    return cachedPage || appShell || offlinePage;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(appShellFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
