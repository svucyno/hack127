// ── Role-Based Access Control (RBAC) Engine ────────────────────────────────
// Roles: Admin, Worker, Cashier, User
// This file is loaded on /pages/*.html ONLY (not on login/signup)

var ROLES = {
  ADMIN: "Admin",
  WORKER: "Worker",
  CASHIER: "Cashier",
  USER: "User"
};

var PAGE_PERMISSIONS = {
  "dashboard.html":  ["Admin", "Worker", "Cashier"],
  "inventory.html":  ["Admin", "Worker"],
  "billing.html":    ["Admin", "Cashier"],
  "alerts.html":     ["Admin", "Worker", "Cashier"],
  "offers.html":     ["Admin"],
  "reports.html":    ["Admin", "Cashier"],
  "suppliers.html":  ["Admin", "Worker"],
  "customers.html":  ["Admin"],
  "landing.html":    ["User", "Admin"],
  "offers_user.html":["User", "Admin"],
  "cart.html":       ["User", "Admin"],
  "orders.html":     ["User", "Admin"]
};

var ROLE_DEFAULT_PAGE = {
  "Admin": "dashboard.html",
  "Worker": "dashboard.html",
  "Cashier": "dashboard.html",
  "User": "landing.html"
};

var ROLE_NAV = {
  "Admin":   ["dashboard","inventory","billing","alerts","offers","reports","suppliers","customers"],
  "Worker":  ["dashboard","inventory","alerts","suppliers"],
  "Cashier": ["dashboard","billing","alerts","reports"],
  "User":    ["landing","offers_user","cart","orders"]
};

var _currentUserRole = null;
var _currentUserData = null;
var _roleReady = false;
var _roleCallbacks = [];

async function _fetchUserRole(uid) {
  var cached = localStorage.getItem("ss_role_" + uid);
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (parsed.role && Date.now() - parsed.ts < 300000) return parsed;
    } catch(e) {}
  }
  try {
    var doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      var data = doc.data();
      var roleData = { uid: uid, name: data.name || "", email: data.email || "", role: data.role || "User" };
      localStorage.setItem("ss_role_" + uid, JSON.stringify({ role: roleData.role, name: roleData.name, email: roleData.email, ts: Date.now() }));
      return roleData;
    }
  } catch(e) { console.warn("Role fetch error:", e); }
  return { uid: uid, name: "", email: "", role: "User" };
}

function getCurrentUserRole() {
  if (_currentUserRole) return _currentUserRole;
  // Try to get from cache for immediate use before async fetch completes
  try {
    var user = auth.currentUser;
    if (user) {
      var cached = localStorage.getItem("ss_role_" + user.uid);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed.role) return parsed.role;
      }
    }
  } catch(e) {}
  return "Admin"; // Default for existing users without role doc
}
function getCurrentUserData() { return _currentUserData; }
function isRole(role) { return _currentUserRole === role; }

function hasPermission(page) {
  var allowed = PAGE_PERMISSIONS[page];
  if (!allowed) return true;
  return allowed.indexOf(_currentUserRole) !== -1;
}

function getNavItemsForRole(role) {
  return ROLE_NAV[role] || ROLE_NAV["Admin"];
}

function onRoleReady(cb) {
  if (_roleReady) { cb(_currentUserRole); return; }
  _roleCallbacks.push(cb);
}

function _notifyRoleReady() {
  _roleReady = true;
  _roleCallbacks.forEach(function(cb) { try { cb(_currentUserRole); } catch(e){} });
  _roleCallbacks = [];
}

function logout() {
  var uid = auth.currentUser ? auth.currentUser.uid : null;
  if (uid) localStorage.removeItem("ss_role_" + uid);
  _currentUserRole = null;
  _currentUserData = null;
  _roleReady = false;
  auth.signOut().catch(function(){});
  window.location.href = window.location.pathname.indexOf("/pages/") !== -1
    ? "../index.html" : "index.html";
}

// Guard — only runs on /pages/ files, NOT on login/signup
(function() {
  var path = window.location.pathname;
  var isInPages = path.indexOf("/pages/") !== -1;
  if (!isInPages) return; // Don't guard login/signup pages

  var pageName = path.split("/").pop();

  auth.onAuthStateChanged(async function(user) {
    if (!user) {
      window.location.href = "../index.html";
      return;
    }
    var userData = await _fetchUserRole(user.uid);
    _currentUserRole = userData.role;
    _currentUserData = userData;
    _notifyRoleReady();

    if (!hasPermission(pageName)) {
      var dest = ROLE_DEFAULT_PAGE[_currentUserRole] || "landing.html";
      window.location.href = dest;
    }
  });
})();
