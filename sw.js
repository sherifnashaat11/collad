// خدمة التشغيل بدون إنترنت للوحة الأدمن. غيّر رقم V عند تعديل الملفات لإجبار التحديث.
const V = 'admin-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
// مكتبات القراءة (cdnjs) تُحفظ تلقائياً عند أول استخدام وأنت متصل بالإنترنت.

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.allSettled(CORE.map(u => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function page(r) {
  try {
    const res = await fetch(r);
    if (res.ok) { const c = await caches.open(V); c.put(r, res.clone()); }
    return res;
  } catch {
    return (await caches.match(r, { ignoreSearch: true })) ||
           (await caches.match('./index.html')) ||
           (await caches.match('./')) || Response.error();
  }
}

async function asset(r, same) {
  const c = await caches.open(V);
  const hit = await c.match(r);
  if (hit) {
    if (same) fetch(r).then(res => { if (res.ok) c.put(r, res); }).catch(() => {});
    return hit;
  }
  try {
    const res = await fetch(r);
    if (res.ok || res.type === 'opaque') c.put(r, res.clone());
    return res;
  } catch { return Response.error(); }
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (!same && u.hostname !== 'cdnjs.cloudflare.com') return;
  e.respondWith(r.mode === 'navigate' ? page(r) : asset(r, same));
});
