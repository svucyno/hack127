// ── Role-Based Access Control (RBAC) Engine ────────────────────────────────
// Roles: Admin, Worker, Cashier, User
// Loaded BEFORE layout.js on every page

var ROLES = {
  ADMIN: "Admin",
  WORKER: "Worker",
  CASHIER: "Cashier",
  USER: "User"
};

// Page permission matrix
var PAGE_PERMISSIONS = {
  "dashboard.html":  [ROLES.ADMIN, ROLES.WORKER, ROLES.CASHIER],
  "inventory.html":  [ROLES.ADMIN, ROLES.WORKER],
  "billing.html":    [ROLES.ADMIN, ROLES.CASHIER],
  "alerts.html":     [ROLES.ADMIN, ROLES.WORKER, ROLES.CASHIER],
  "offers.html":     [ROLES.ADMIN],
  "reports.html":    [ROLES.ADMIN, ROLES.CASHIER],
  "suppliers.html":  [ROLES.ADMIN, ROLES.WORKER],
  "customers.html":  [ROLES.ADMIN],
  "landing.html":    [ROLES.USER, ROLES.ADMIN],
  "offers_user.html":[ROLES.USER, ROLES.ADMIN],
  "cart.html":       [ROLES.USER, ROLES.ADMIN],
  "orders.html":     [ROLES.USER, ROLES.ADMIN]
};

// Default landing page per role
var ROLE_DEFAULT_PAGE = {};
ROLE_DEFAULT_PAGE[ROLES.ADMIN]   = "dashboard.html";
ROLE_DEFAULT_PAGE[ROLES.WORKER]  = "dashboard.html";
ROLE_DEFAULT_PAGE[ROLES.CASHIER] = "dashboard.html";
ROLE_DEFAULT_PAGE[ROLES.USER]    = "landing.html";

// Nav items per role
var ROLE_NAV = {};
ROLE_NAV[ROLES.ADMIN] = ["dashboard","inventory","billing","alerts","offers","reports","suppliers","customers"];
ROLE_NAV[ROLES.WORKER] = ["dashboard","inventory","alerts","suppliers"];
ROLE_NAV[ROLES.CASHIER] = ["dashboard","billing","alerts","reports"];
ROLE_NAV[ROLES.USER] = ["landing","offers_user","cart","orders"];

// Global state
var _currentUserRole = null;
var _currentUserData = null;
var _roleReady = false;
var _roleCallbacks = [];

// Fetch and cache user role
async function _fetchUserRole(uid) {
  // Check localStorage cache first
  var cached = localStorage.getItem("ss_role_" + uid);
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (parsed.role && Date.now() - parsed.ts < 300000) { // 5 min cache
        return parsed;
      }
    } catch(e) {}
  }
  // Fetch from Firestore
  try {
    var doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      var data = doc.data();
      var roleData = { uid: uid, name: data.name, email: data.email, role: data.role || ROLES.USER };
      localStorage.setItem("ss_role_" + uid, JSON.stringify({ role: roleData.role, name: roleData.name, email: roleData.email, ts: Date.now() }));
      return roleData;
    }
  } catch(e) {
    console.warn("Role fetch error:", e);
  }
  // Fallback to User role
  return { uid: uid, name: "", email: "", role: ROLES.USER };
}

function getCurrentUserRole() {
  return _currentUserRole || ROLES.USER;
}

function getCurrentUserData() {
  return _currentUserData;
}

function isRole(role) {
  return _currentUserRole === role;
}

function hasPermission(page) {
  var allowed = PAGE_PERMISSIONS[page];
  if (!allowed) return true; // unknown page = allow
  return allowed.indexOf(_currentUserRole) !== -1;
}

function getNavItemsForRole(role) {
  return ROLE_NAV[role] || ROLE_NAV[ROLES.USER];
}

// Wait for role to be ready
function onRoleReady(cb) {
  if (_roleReady) { cb(_currentUserRole); return; }
  _roleCallbacks.push(cb);
}

function _notifyRoleReady() {
  _roleReady = true;
  _roleCallbacks.forEach(function(cb) { cb(_currentUserRole); });
  _roleCallbacks = [];
}

// Route guard — call on every page load
function guardPage() {
  var pageName = window.location.pathname.split("/").pop() || "index.html";
  var isLoginPage = pageName === "index.html" || pageName === "signup.html";
  var isInPages = window.location.pathname.indexOf("/pages/") !== -1;
  var basePath = isInPages ? "../" : "";

  auth.onAuthStateChanged(async function(user) {
    if (!user) {
      // Not logged in
      if (!isLoginPage) {
        window.location.href = basePath + "index.html";
      }
      return;
    }

    // Logged in — fetch role
    var userData = await _fetchUserRole(user.uid);
    _currentUserRole = userData.role;
    _currentUserData = userData;
    _notifyRoleReady();

    // If on login/signup page, redirect to default
    if (isLoginPage) {
      var defaultPage = ROLE_DEFAULT_PAGE[_currentUserRole] || "landing.html";
      window.location.href = "pages/" + defaultPage;
      return;
    }

    // Check page permission
    if (isInPages && !hasPermission(pageName)) {
      var defaultPage2 = ROLE_DEFAULT_PAGE[_currentUserRole] || "landing.html";
      window.location.href = basePath + "pages/" + defaultPage2;
      return;
    }
  });
}

// Clear role cache on logout
var _origLogout = typeof logout === "function" ? logout : null;
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

// Auto-guard on load
guardPage();
