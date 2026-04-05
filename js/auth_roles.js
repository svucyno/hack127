// ── Role-Based Access Control (RBAC) Engine ────────────────────────────────
// Loaded on /pages/*.html ONLY (not on login/signup)

var ROLES = { ADMIN: "Admin", WORKER: "Worker", CASHIER: "Cashier", USER: "User" };

var PAGE_PERMISSIONS = {
  "dashboard.html":  ["Admin", "Worker", "Cashier"],
  "inventory.html":  ["Admin", "Worker"],
  "billing.html":    ["Admin", "Cashier"],
  "alerts.html":     ["Admin", "Worker", "Cashier"],
  "offers.html":     ["Admin"],
  "reports.html":    ["Admin", "Cashier"],
  "suppliers.html":  ["Admin", "Worker"],
  "customers.html":  ["Admin"],
  "users.html":      ["Admin"],
  "landing.html":    ["User"],
  "offers_user.html":["User"],
  "cart.html":       ["User"],
  "orders.html":     ["User"]
};

var ROLE_DEFAULT_PAGE = { "Admin":"dashboard.html", "Worker":"dashboard.html", "Cashier":"dashboard.html", "User":"landing.html" };

var ROLE_NAV = {
  "Admin":   ["dashboard","inventory","billing","alerts","offers","reports","suppliers","customers","users"],
  "Worker":  ["dashboard","inventory","alerts","suppliers"],
  "Cashier": ["dashboard","billing","alerts","reports"],
  "User":    ["landing","offers_user","cart","orders"]
};

var _currentUserRole = null;
var _currentUserData = null;
var _roleReady = false;
var _roleCallbacks = [];

async function _fetchUserRole(uid) {
  // Check cache first
  try {
    var cached = localStorage.getItem("ss_role_" + uid);
    if (cached) {
      var parsed = JSON.parse(cached);
      if (parsed.role && Date.now() - parsed.ts < 300000) return parsed;
    }
  } catch(e) {}
  // Fetch from Firestore
  try {
    var doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      var data = doc.data();
      var roleData = { uid: uid, name: data.name || "", email: data.email || "", role: data.role || "User" };
      localStorage.setItem("ss_role_" + uid, JSON.stringify({ role: roleData.role, name: roleData.name, email: roleData.email, ts: Date.now() }));
      return roleData;
    }
  } catch(e) { console.error("Role fetch error:", e); }
  // No doc found — default to Admin for backward compat with old accounts
  return { uid: uid, name: "", email: "", role: "Admin" };
}

function getCurrentUserRole() {
  if (_currentUserRole) return _currentUserRole;
  try {
    var user = auth.currentUser;
    if (user) {
      var cached = localStorage.getItem("ss_role_" + user.uid);
      if (cached) { var p = JSON.parse(cached); if (p.role) return p.role; }
    }
  } catch(e) {}
  return "Admin";
}

function getCurrentUserData() { return _currentUserData; }
function isRole(role) { return getCurrentUserRole() === role; }

function hasPermission(page) {
  var allowed = PAGE_PERMISSIONS[page];
  if (!allowed) return true;
  return allowed.indexOf(getCurrentUserRole()) !== -1;
}

function getNavItemsForRole(role) {
  return ROLE_NAV[role] || ROLE_NAV["Admin"];
}

function onRoleReady(cb) {
  if (_roleReady) { try { cb(_currentUserRole); } catch(e){} return; }
  _roleCallbacks.push(cb);
}

function _notifyRoleReady() {
  _roleReady = true;
  _roleCallbacks.forEach(function(cb) { try { cb(_currentUserRole); } catch(e){} });
  _roleCallbacks = [];
}

// Override logout from firebase.js
function logout() {
  try {
    var uid = auth.currentUser ? auth.currentUser.uid : null;
    if (uid) localStorage.removeItem("ss_role_" + uid);
  } catch(e) {}
  _currentUserRole = null; _currentUserData = null; _roleReady = false;
  auth.signOut().catch(function(){});
  window.location.href = window.location.pathname.indexOf("/pages/") !== -1 ? "../index.html" : "index.html";
}

// Route guard — ONLY runs on /pages/ files
(function() {
  var path = window.location.pathname;
  if (path.indexOf("/pages/") === -1) return;
  var pageName = path.split("/").pop();

  auth.onAuthStateChanged(async function(user) {
    if (!user) { window.location.href = "../index.html"; return; }
    try {
      var userData = await _fetchUserRole(user.uid);
      _currentUserRole = userData.role;
      _currentUserData = userData;
      _notifyRoleReady();
      // Update sidebar user info
      var nameEl = document.getElementById("user-name");
      var avatarEl = document.getElementById("user-avatar");
      var roleEl = document.getElementById("user-role");
      if (nameEl) nameEl.textContent = user.displayName || userData.name || user.email || "User";
      if (avatarEl) avatarEl.textContent = (user.displayName || userData.name || "U").charAt(0).toUpperCase();
      if (roleEl) roleEl.textContent = userData.role;

      // Rebuild sidebar nav with correct role
      var sidebarNav = document.querySelector(".sidebar-nav");
      if (sidebarNav && typeof _rebuildNav === "function") {
        _rebuildNav(sidebarNav, _currentUserRole);
      }

      // Check permission
      if (!hasPermission(pageName)) {
        window.location.href = ROLE_DEFAULT_PAGE[_currentUserRole] || "landing.html";
      }
    } catch(e) {
      console.error("Guard error:", e);
      _currentUserRole = "Admin";
      _notifyRoleReady();
    }
  });
})();
