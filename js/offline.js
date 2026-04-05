// ── Offline Mode — IndexedDB + Service Worker ──────────────────────────────
var OfflineManager = (function() {
  var DB_NAME = "shopsmart_offline", DB_VERSION = 1, idbInstance = null;
  function openDB() {
    return new Promise(function(resolve, reject) {
      if (idbInstance) { resolve(idbInstance); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains("products")) db.createObjectStore("products", { keyPath: "id" });
        if (!db.objectStoreNames.contains("suppliers")) db.createObjectStore("suppliers", { keyPath: "id" });
        if (!db.objectStoreNames.contains("offers")) db.createObjectStore("offers", { keyPath: "id" });
        if (!db.objectStoreNames.contains("pendingWrites")) db.createObjectStore("pendingWrites", { keyPath: "id", autoIncrement: true });
      };
      req.onsuccess = function(e) { idbInstance = e.target.result; resolve(idbInstance); };
      req.onerror = function(e) { reject(e.target.error); };
    });
  }
  function cacheData(storeName, items) {
    return openDB().then(function(db) {
      var tx = db.transaction(storeName, "readwrite"); var store = tx.objectStore(storeName);
      store.clear(); items.forEach(function(item) { store.put(item); });
      return new Promise(function(resolve) { tx.oncomplete = resolve; });
    });
  }
  function getCachedData(storeName) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(storeName, "readonly");
        var req = tx.objectStore(storeName).getAll();
        req.onsuccess = function() { resolve(req.result || []); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }
  function queueWrite(op) {
    op.timestamp = Date.now();
    op.id = "pw_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    return openDB().then(function(db) {
      var tx = db.transaction("pendingWrites", "readwrite");
      tx.objectStore("pendingWrites").put(op);
      return new Promise(function(resolve) { tx.oncomplete = resolve; });
    });
  }
  async function syncPendingWrites() {
    var db2 = await openDB();
    var pending = await new Promise(function(resolve) {
      var tx = db2.transaction("pendingWrites", "readonly");
      var req = tx.objectStore("pendingWrites").getAll();
      req.onsuccess = function() { resolve(req.result || []); };
    });
    if (!pending.length) return { synced: 0, failed: 0 };
    var synced = 0, failed = 0;
    for (var i = 0; i < pending.length; i++) {
      var op = pending[i];
      try {
        var ref = op.docId ? db.collection(op.collection).doc(op.docId) : db.collection(op.collection).doc();
        if (op.type === "set") await ref.set(op.data);
        else if (op.type === "update") await ref.update(op.data);
        else if (op.type === "delete") await ref.delete();
        var dtx = db2.transaction("pendingWrites", "readwrite");
        dtx.objectStore("pendingWrites").delete(op.id);
        synced++;
      } catch(e) { failed++; }
    }
    return { synced: synced, failed: failed };
  }
  async function cacheFirestoreData() {
    if (typeof db === "undefined" || typeof COL === "undefined") return;
    try {
      var results = await Promise.all([
        db.collection(COL.products).get(),
        db.collection(COL.suppliers).get(),
        db.collection(COL.offers).where("active", "==", true).get()
      ]);
      await Promise.all([
        cacheData("products", results[0].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); })),
        cacheData("suppliers", results[1].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); })),
        cacheData("offers", results[2].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }))
      ]);
    } catch(e) { console.warn("Cache failed:", e); }
  }
  return { openDB: openDB, cacheData: cacheData, getCachedData: getCachedData,
    queueWrite: queueWrite, syncPendingWrites: syncPendingWrites, cacheFirestoreData: cacheFirestoreData };
})();

// Register SW & online/offline handlers
(function() {
  if ("serviceWorker" in navigator) {
    var swPath = window.location.pathname.indexOf("/pages/") !== -1 ? "../sw.js" : "sw.js";
    navigator.serviceWorker.register(swPath).catch(function() {});
  }
  function showOfflineBanner() {
    if (document.getElementById("offline-banner")) return;
    var b = document.createElement("div"); b.id = "offline-banner"; b.className = "offline-banner";
    b.innerHTML = '<span>📡 ' + (typeof t === "function" ? t("offline.banner") : "You're offline.") + '</span>';
    document.body.appendChild(b);
    setTimeout(function() { b.classList.add("show"); }, 10);
  }
  function hideOfflineBanner() {
    var b = document.getElementById("offline-banner");
    if (b) { b.classList.remove("show"); setTimeout(function() { b.remove(); }, 400); }
    OfflineManager.syncPendingWrites().then(function(r) {
      if (r.synced > 0 && typeof showToast === "function") showToast("Back online! " + r.synced + " changes synced.");
    });
    OfflineManager.cacheFirestoreData();
  }
  window.addEventListener("offline", showOfflineBanner);
  window.addEventListener("online", hideOfflineBanner);
  if (!navigator.onLine) document.addEventListener("DOMContentLoaded", showOfflineBanner);
  document.addEventListener("DOMContentLoaded", function() {
    if (navigator.onLine) setTimeout(function() { OfflineManager.cacheFirestoreData(); }, 3000);
  });
})();
