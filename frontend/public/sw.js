/* PeopleOS service worker
 * Strategy:
 *  - Precache the app shell on install
 *  - Network-first for navigation requests (so deploys are picked up)
 *  - Cache-first for static assets (JS/CSS/fonts/images)
 *  - Never cache API requests (/api/*)
 */
const CACHE_NAME = 'peopleos-v1'
const APP_SHELL = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API or auth traffic
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) return

  // Navigation: network-first, fall back to cache, then offline app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then((m) => m || caches.match('/')))
    )
    return
  }

  // Static assets: cache-first
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {})
          return res
        }).catch(() => cached)
      })
    )
  }
})
