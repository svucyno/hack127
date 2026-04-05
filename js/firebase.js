// ── Firebase Configuration ─────────────────────────────────────────────────
var firebaseConfig = {
  apiKey: "AIzaSyCA8UxrzFVh7LF4d5ZG8PNrEx8f3VdpwX0",
  authDomain: "shopsmart-0001.firebaseapp.com",
  projectId: "shopsmart-0001",
  storageBucket: "shopsmart-0001.firebasestorage.app",
  messagingSenderId: "539744292760",
  appId: "1:539744292760:web:4c8dc1c7993c9cbb63e5ed",
  measurementId: "G-NCQSK4LGHP"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var db   = firebase.firestore();

// Enable auth persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(e) {
  console.warn("Auth persistence error:", e);
});

// Enable Firestore offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch(function(e) {
  if (e.code === "failed-precondition") console.warn("Firestore persistence: multiple tabs open");
  else if (e.code === "unimplemented") console.warn("Firestore persistence: not supported");
});

// ── Collections ────────────────────────────────────────────────────────────
var COL = {
  products  : "products",
  sales     : "sales",
  alerts    : "alerts",
  offers    : "offers",
  suppliers : "suppliers",
  customers : "customers",
  users     : "users",
};

// ── Fallback logout (overridden by auth_roles.js on /pages/) ───────────────
function logout() {
  auth.signOut().catch(function(){});
  window.location.href = window.location.pathname.indexOf("/pages/") !== -1
    ? "../index.html" : "index.html";
}

// ── Global Error Handlers ──────────────────────────────────────────────────
window.onerror = function(msg, url, line, col, error) {
  console.error("Global error:", msg, "at", url, ":", line);
  return false;
};
window.addEventListener("unhandledrejection", function(event) {
  console.error("Unhandled promise rejection:", event.reason);
});
