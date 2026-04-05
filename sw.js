var CACHE_NAME = "shopsmart-v3";
var APP_SHELL = ["/", "/index.html", "/signup.html", "/css/style.css", "/css/donut-chart-refined.css",
  "/js/firebase.js", "/js/utils.js", "/js/auth_roles.js", "/js/i18n.js", "/js/layout.js",
  "/js/billing.js", "/js/billing2.js", "/js/cart_logic.js",
  "/js/barcode-scanner.js", "/js/predictions.js", "/js/donut-chart-fixed.js", "/js/offline.js",
  "/pages/dashboard.html", "/pages/inventory.html", "/pages/billing.html", "/pages/alerts.html",
  "/pages/offers.html", "/pages/reports.html", "/pages/suppliers.html", "/pages/customers.html",
  "/pages/landing.html", "/pages/offers_user.html", "/pages/cart.html", "/pages/orders.html"];

self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(APP_SHELL).catch(function(){}); }));
  self.skipWaiting();
});
self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(n) { return Promise.all(n.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);})); }));
  self.clients.claim();
});
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.hostname.includes("firebase") || url.hostname.includes("googleapis") || url.hostname.includes("gstatic")) return;
  e.respondWith(fetch(e.request).then(function(r) {
    if (r && r.status === 200) { var c = r.clone(); caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,c);}); }
    return r;
  }).catch(function() { return caches.match(e.request); }));
});
