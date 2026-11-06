/* fullview service worker: shows a notification when a chat message arrives while the app is closed */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  const title = String(d.title || 'New message').slice(0, 80);
  const body = String(d.body || 'You have a new message').slice(0, 160);
  const sender = typeof d.sender === 'string' ? d.sender.slice(0, 40) : null;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.visibilityState === 'visible')) return;   // app is open: the chat already shows it
    await self.registration.showNotification(title, {
      body, tag: 'chat-' + (sender || 'x'), renotify: true, data: { sender }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const sender = event.notification.data && event.notification.data.sender;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.length) {
      await wins[0].focus();
      if (sender) wins[0].postMessage({ type: 'open-chat', userId: sender });
      return;
    }
    await self.clients.openWindow(sender ? './?chat=' + encodeURIComponent(sender) : './');
  })());
});
