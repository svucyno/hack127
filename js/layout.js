// SVG icon set — Lucide-style, 20×20 viewBox, 1.6 stroke
const NAV_ICONS = {
  Dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
  Inventory: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  Billing:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  Alerts:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  Offers:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  Reports:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  Suppliers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  Customers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  Landing:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  Shop:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  Cart:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  Orders:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
};

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark' 
      ? '☀️'  // Sun icon for switching to light
      : '🌙'; // Moon icon for switching to dark
  }
}

// Injects sidebar + topbar into any page
function buildLayout(pageTitle) {
  // All possible nav items
  var allNav = [
    { href: "../pages/dashboard.html",   key: "Dashboard",   navKey: "dashboard",   label: typeof t === 'function' ? t("nav.dashboard") : "Dashboard" },
    { href: "../pages/inventory.html",   key: "Inventory",   navKey: "inventory",   label: typeof t === 'function' ? t("nav.inventory") : "Inventory" },
    { href: "../pages/billing.html",     key: "Billing",     navKey: "billing",     label: typeof t === 'function' ? t("nav.billing") : "Billing" },
    { href: "../pages/alerts.html",      key: "Alerts",      navKey: "alerts",      label: typeof t === 'function' ? t("nav.alerts") : "Alerts" },
    { href: "../pages/offers.html",      key: "Offers",      navKey: "offers",      label: typeof t === 'function' ? t("nav.offers") : "Offers" },
    { href: "../pages/reports.html",     key: "Reports",     navKey: "reports",     label: typeof t === 'function' ? t("nav.reports") : "Reports" },
    { href: "../pages/suppliers.html",   key: "Suppliers",   navKey: "suppliers",   label: typeof t === 'function' ? t("nav.suppliers") : "Suppliers" },
    { href: "../pages/customers.html",   key: "Customers",   navKey: "customers",   label: typeof t === 'function' ? t("nav.customers") : "Customers" },
    { href: "../pages/users.html",       key: "Customers",   navKey: "users",       label: "Users" },
    { href: "../pages/order_mgmt.html",  key: "Orders",      navKey: "order_mgmt",  label: "Orders" },
    { href: "../pages/landing.html",     key: "Landing",     navKey: "landing",     label: typeof t === 'function' ? t("nav.dashboard") : "Shop" },
    { href: "../pages/offers_user.html", key: "Shop",        navKey: "offers_user", label: typeof t === 'function' ? t("nav.offers") : "Deals" },
    { href: "../pages/notifications.html",key: "Alerts",      navKey: "notifications",label: "Notifications" },
    { href: "../pages/cart.html",        key: "Cart",        navKey: "cart",        label: "Cart" },
    { href: "../pages/orders.html",      key: "Orders",      navKey: "orders",      label: "Orders" },
  ];

  // Filter nav by role
  var role = typeof getCurrentUserRole === 'function' ? getCurrentUserRole() : 'User';
  var allowedKeys = typeof getNavItemsForRole === 'function' ? getNavItemsForRole(role) : allNav.map(function(n){return n.navKey;});
  var nav = allNav.filter(function(n) { return allowedKeys.indexOf(n.navKey) !== -1; });
  var roleLabel = role || "Store Owner";

  const navHTML = nav.map(n =>
    `<a href="${n.href}" class="nav-link" data-label="${n.label}">
      <span class="nav-icon">${NAV_ICONS[n.key] || ''}</span>
      <span class="nav-label">${n.label}</span>
    </a>`
  ).join("");

  const container = document.getElementById("app");
  if (!container) return;

  var langSwitcher = typeof getLangSwitcherHTML === 'function' ? getLangSwitcherHTML() : '';

  container.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <div class="logo-text">
            <span class="logo-name">ShopSmart</span>
            <span class="logo-sub">Cloud Nine Team</span>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
          <button class="btn-logout" onclick="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            ${typeof t === 'function' ? t("layout.signout") : "Sign Out"}
          </button>
        </div>
      </aside>
      <div class="main-area">
        <header class="topbar">
          <button class="btn-icon" id="sidebar-toggle" style="display:none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2>${pageTitle}</h2>
          <div class="topbar-actions" id="topbar-actions">
            <span id="lang-switch-wrap">${langSwitcher}</span>
            <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌙</button>
          </div>
        </header>
        <main class="page-content" id="page-content"></main>
      </div>
    </div>`;

  setActiveNav();

  // Initialize theme
  const currentTheme = initTheme();
  updateThemeIcon(currentTheme);

  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth <= 900) toggle.style.display = "flex";

  // Create overlay for mobile sidebar
  var overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.id = "sidebar-overlay";
  document.body.appendChild(overlay);

  toggle?.addEventListener("click", function() {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show", sidebar.classList.contains("open"));
  });

  // Close sidebar on overlay click
  overlay.addEventListener("click", function() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  // Close sidebar on window resize to desktop
  window.addEventListener("resize", function() {
    if (window.innerWidth > 900) {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      toggle.style.display = "none";
    } else {
      toggle.style.display = "flex";
    }
  });

  // Set user info if logged in
  auth.onAuthStateChanged(user => {
    if (user) {
      const nameEl   = document.getElementById("user-name");
      const avatarEl = document.getElementById("user-avatar");
      const displayName = user.displayName || user.email || "Owner";
      if (nameEl)   nameEl.textContent   = displayName;
      if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
  });
}

// Called by auth_roles.js after role is confirmed — rebuilds sidebar nav
function _rebuildNav(sidebarNavEl, role) {
  var allNav = [
    { href: "../pages/dashboard.html",   key: "Dashboard",   navKey: "dashboard",   label: typeof t === 'function' ? t("nav.dashboard") : "Dashboard" },
    { href: "../pages/inventory.html",   key: "Inventory",   navKey: "inventory",   label: typeof t === 'function' ? t("nav.inventory") : "Inventory" },
    { href: "../pages/billing.html",     key: "Billing",     navKey: "billing",     label: typeof t === 'function' ? t("nav.billing") : "Billing" },
    { href: "../pages/alerts.html",      key: "Alerts",      navKey: "alerts",      label: typeof t === 'function' ? t("nav.alerts") : "Alerts" },
    { href: "../pages/offers.html",      key: "Offers",      navKey: "offers",      label: typeof t === 'function' ? t("nav.offers") : "Offers" },
    { href: "../pages/reports.html",     key: "Reports",     navKey: "reports",     label: typeof t === 'function' ? t("nav.reports") : "Reports" },
    { href: "../pages/suppliers.html",   key: "Suppliers",   navKey: "suppliers",   label: typeof t === 'function' ? t("nav.suppliers") : "Suppliers" },
    { href: "../pages/customers.html",   key: "Customers",   navKey: "customers",   label: typeof t === 'function' ? t("nav.customers") : "Customers" },
    { href: "../pages/users.html",       key: "Customers",   navKey: "users",       label: "Users" },
    { href: "../pages/order_mgmt.html",  key: "Orders",      navKey: "order_mgmt",  label: "Orders" },
    { href: "../pages/landing.html",     key: "Landing",     navKey: "landing",     label: "Shop" },
    { href: "../pages/offers_user.html", key: "Shop",        navKey: "offers_user", label: "Deals" },
    { href: "../pages/notifications.html",key: "Alerts",      navKey: "notifications",label: "Notifications" },
    { href: "../pages/cart.html",        key: "Cart",        navKey: "cart",        label: "Cart" },
    { href: "../pages/orders.html",      key: "Orders",      navKey: "orders",      label: "Orders" },
  ];
  var allowedKeys = typeof getNavItemsForRole === 'function' ? getNavItemsForRole(role) : [];
  var nav = allNav.filter(function(n) { return allowedKeys.indexOf(n.navKey) !== -1; });
  sidebarNavEl.innerHTML = nav.map(function(n) {
    return '<a href="' + n.href + '" class="nav-link" data-label="' + n.label + '">' +
      '<span class="nav-icon">' + (NAV_ICONS[n.key] || '') + '</span>' +
      '<span class="nav-label">' + n.label + '</span>' +
    '</a>';
  }).join("");
  setActiveNav();
}
