!function(e){var t={};function n(r){if(t[r])return t[r].exports;var i=t[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(r,i,function(t){return e[t]}.bind(null,i));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=95)}({95:function(e,t){const n=["index.html","main.js","certificate.pdf"];let r=self.location.pathname.split("/");delete r[r.length-1];const i=r.join("/");self.addEventListener("install",(function(e){e.waitUntil(caches.open("attest-06").then((function(e){return e.addAll(n)})))})),self.addEventListener("activate",(function(e){e.waitUntil(caches.keys().then((function(e){return Promise.all(e.filter((function(e){return e.startsWith("attest-")&&"attest-06"!=e})).map((function(e){return caches.delete(e)})))})))})),self.addEventListener("message",(function(e){"skipWaiting"===e.data.action&&self.skipWaiting()})),self.addEventListener("fetch",(function(e){const t=new URL(e.request.url);t.pathname!=i+"version.json"?e.respondWith(caches.open("attest-06").then((function(n){return n.match(t.pathname==i?"index.html":e.request).then((function(t){return t||fetch(e.request)}))}))):e.respondWith(Promise.resolve(new Response(JSON.stringify({v:"v"+parseInt("06"),time:1586192752492}),{headers:{"Content-Type":"application/json"}})))}))}});