const version = '09';

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

self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);
    if (url.pathname == swLoc+'version.json') {
        event.respondWith(Promise.resolve(new Response(JSON.stringify({
            v: 'v'+parseInt(version),
            time: BUILD_TIME
        }), {
            headers: {
                'Content-Type': 'application/json'
            }
        })));
        return;    
    }
    event.respondWith(
        caches.open(cacheName).then(function (cache) {
            return cache.match(url.pathname == swLoc ? 'index.html' : event.request)
                .then(function (response) {
                    return response || fetch(event.request);
                });
        })
    );
});