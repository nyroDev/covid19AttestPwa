const version = '01';

const files = [
    'index.html',
    'main.js'
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
        }).then(function() {
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
    const url = new URL(event.request.url);
    if (url.pathname == swLoc) {
        event.respondWith(caches.match('index.html'));
        return;
    }
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});