/* Rocketeerio PWA service worker */

const CACHE_NAME = "rocketeerio-app-shell-v1";
const APP_SHELL_URLS = [
  "/",
  "/dashboard/josh-for-sales",
  "/manifest.json",
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn("[sw] App shell pre-cache failed", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/dashboard/josh-for-sales") || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { messagePreview: event.data.text() };
    }
  }

  const leadName = data.leadName || "Hot lead";
  const messagePreview = data.messagePreview || "A lead just messaged Josh for Sales.";
  const badgeLabel = data.badge || (data.isHot ? "HOT" : data.qualificationStatus === "qualified" ? "QUALIFIED" : "NEW");
  const title = `${badgeLabel}: ${leadName}`;
  const inboxUrl = data.pageId
    ? `/dashboard/josh-for-sales?pageId=${encodeURIComponent(data.pageId)}`
    : "/dashboard/josh-for-sales";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: messagePreview,
      tag: data.conversationId || data.threadId || `rocketeerio-${Date.now()}`,
      renotify: true,
      icon: "/icon-192.png",
      badge: "/favicon-32x32.png",
      image: data.imageUrl,
      data: {
        url: inboxUrl,
        pageId: data.pageId || null,
        conversationId: data.conversationId || data.threadId || null
      },
      actions: [
        {
          action: "open-inbox",
          title: "Open inbox"
        }
      ]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/dashboard/josh-for-sales";
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          client.navigate(absoluteTargetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTargetUrl);
      }

      return undefined;
    })
  );
});
