// SquirrelNote service worker.
//
// This has to live at the top level (registered by index.html) rather than
// inside the app itself: the app renders in a srcdoc iframe (see index.html)
// so its notes stay same-origin in localStorage, but a srcdoc document has
// no stable URL and can't register a service worker of its own. This worker
// only has one job — receive a push from push-cron (the Supabase Edge
// Function) and show it, even with no SquirrelNote tab open anywhere.
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%90%BF%EF%B8%8F%3C/text%3E%3C/svg%3E";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || "SquirrelNote";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag || "sn-notification",
      icon: ICON,
      badge: ICON,
      vibrate: [120, 60, 120],
    })
  );
});

// Bring an existing tab to the front, or open a new one, when the
// notification itself (not its actions) is tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) if ("focus" in client) return client.focus();
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
