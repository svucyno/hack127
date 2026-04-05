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

// ── Auth helpers ───────────────────────────────────────────────────────────
// Role-based auth is handled by js/auth_roles.js
// logout() is defined in auth_roles.js
