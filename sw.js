/*
  File: /sw.js
  Title: Wasaya — Service Worker
  Purpose: كاش بسيط لملفات الواجهة.
*/
self.addEventListener('install', e=>{
  e.waitUntil(caches.open('wasaya-v1').then(c=>c.addAll([
    './','./index.html','./assets/styles.css','./assets/logo.svg','./js/app.js','./manifest.json'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
