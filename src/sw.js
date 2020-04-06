const version = '01';

const files = [
    'index.html',
    'main.js',
    'certificate.pdf'
];

const cachePrefix = 'attest-';

const cacheName = cachePrefix + version;

let tmp = self.location.pathname.split('/');
delete tmp[tmp.length - 1];
const swLoc = tmp.join('/');

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(files);
        }).then(function () {
            self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cn) {
                    return cn.startsWith(cachePrefix) && cn != cacheName;
                }).map(function (cn) {
                    return caches.delete(cn);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.open(cacheName).then(function (cache) {
            const url = new URL(event.request.url);
            return cache.match(url.pathname == swLoc ? 'index.html' : event.request)
                .then(function (response) {
                    return response || fetch(event.request);
                });
        })
    );
});