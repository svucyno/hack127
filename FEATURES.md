# 📋 ShopSmart — Complete Feature Documentation

This document details every feature implemented in ShopSmart, how it works, and where the code lives.

---

## 1. 🔐 Authentication & User Management

**What it does:** Secure login and signup using Firebase Authentication with email/password.

**How it works:**
- Users sign up with name, email, and password on `signup.html`
- Firebase Auth creates the account, and a user profile is saved to Firestore (`users` collection) with role, name, and timestamps
- Login on `index.html` authenticates via `auth.signInWithEmailAndPassword()`
- Auth state is checked on every page load — unauthenticated users are redirected to login
- Logout clears the Firebase session and redirects to login

**Files:** `index.html`, `signup.html`, `js/firebase.js`

---

## 2. 📦 Smart Inventory Management

**What it does:** Full product CRUD with real-time stock tracking, expiry monitoring, barcode support, and supplier linking.

**How it works:**
- Products are stored in Firestore `products` collection with fields: name, company, category, size, costPrice, sellingPrice, quantity, maxStock, gst, expiryDate, supplierId, barcode
- Add/Edit via modal form with validation (selling price < cost price triggers a warning)
- Stock status badges: Low Stock (≤10% of max), Expiring Soon (category-based thresholds), OK
- Search by name or company, filter by category or status
- Supplier shown as a dropdown (fetched from `suppliers` collection) instead of raw ID input
- Supplier column in the inventory table shows linked dealer name
- Barcode field with camera scan button for quick product lookup

**Files:** `pages/inventory.html`

---

## 3. 📷 Barcode Scanning

**What it does:** Camera-based barcode scanning for rapid product identification in inventory and billing.

**How it works:**
- Reusable `BarcodeScanner` component built with DOM APIs and `html5-qrcode` CDN library
- Opens device rear camera (mobile) or webcam (desktop) in a modal overlay
- Supports EAN-13, EAN-8, UPC-A, CODE-128, CODE-39 formats
- Two modes:
  - **Single scan:** Scans one barcode, fires callback, closes automatically (used in inventory lookup)
  - **Continuous scan:** Stays open, fires callback for each scan with 1.5s cooldown (used in billing checkout)
- Audio beep feedback on successful scan
- Manual text input fallback if camera is unavailable or permission denied
- Escape key and overlay click to close
- All buttons use `addEventListener` (not inline onclick) to avoid CSS pseudo-element interference

**Inventory integration:**
- "Scan to Find" — scans barcode, opens edit modal if product exists, or add modal with barcode pre-filled if new
- "Bulk Scan" — continuous mode, each scan increments product quantity by 1, shows running log, batch-saves to Firestore
- Barcode field in Add/Edit product form with scan button

**Billing integration:**
- "Scan" button in billing toolbar opens continuous scanner
- Each scan looks up product by barcode and auto-adds to cart (or increments qty if already in cart)
- Toast notification for found/not-found products

**Files:** `js/barcode-scanner.js`, `pages/inventory.html`, `pages/billing.html`, `js/billing.js`

---

## 4. 🧾 Intelligent Billing System

**What it does:** POS billing with real-time cart, auto GST calculation, automatic offer detection, barcode scanning, and print-ready receipts.

**How it works:**
- Products listed on the left panel with search, click to add to cart
- Cart on the right with quantity controls (+/-), remove button, live totals
- GST auto-calculated per item: CGST + SGST split based on GST slab (0%, 5%, 12%, 18%, 28%)
- Active offers auto-detected and applied: strikethrough original price, savings displayed
- Limited quantity offers enforced: checks `soldQty < maxQty` before applying discount
- Customer name field (optional, defaults to "Walk-in")
- On bill confirmation:
  - Sale document saved to Firestore `sales` collection with all item details, GST breakdown, discount info
  - Product quantities decremented atomically via `FieldValue.increment(-qty)`
  - Offer `soldQty` incremented if limited quantity offer
  - Print-ready receipt opens in new window with shop details, GST breakdown, discount lines
- URL parameter support: `?productId=xxx` auto-adds product to cart (used by "Sell Now" from offers page)

**Files:** `js/billing.js`, `js/billing2.js`, `pages/billing.html`

---

## 5. 🎯 Offers & Discounts

**What it does:** Create and manage percentage, flat, or Buy-X-Get-Y offers with limited quantity support, expiry clearance suggestions, and quick billing.

**How it works:**
- Offers stored in Firestore `offers` collection with: productId, type, value, validUntil, maxQty, soldQty, reason, active
- **Limited quantity offers:** Set maxQty to cap how many units get the discount. Progress bar shows sold/total. Auto-deactivates when sold out.
- **Offer reasons:** Tag as "Expiry Clearance", "Festival Offer", "Clearance Sale", "Bulk Deal"
- **Expiry Clearance Suggestions section:**
  - Scans all products with expiry within category-based warning thresholds
  - Filters out products that already have an active offer (shown separately with "Covered" badge)
  - Auto-suggests discount percentage based on urgency: ≤3d → 40%, ≤7d → 30%, ≤15d → 20%, ≤30d → 10%
  - One-click "Create Offer" pre-fills modal with product, discount, maxQty=stock, validUntil=expiryDate
- **Sell Now button:** On each active offer card, redirects to `billing.html?productId=xxx` for quick sale
- Active/Inactive/Sold Out/Expired status badges
- Activate/Deactivate toggle without deleting

**Files:** `pages/offers.html`

---

## 6. 🔔 Category-Aware Smart Alerts

**What it does:** Intelligent alert system with category-specific expiry thresholds, offer-aware suppression, and individual/bulk delete.

**How it works:**
- Alert engine (`runAlertEngine` in `js/utils.js`) scans all products and generates alerts:
  - **Low stock:** quantity ≤ 10% of maxStock
  - **Expiry warning (yellow):** within category warning threshold but above urgent
  - **Expiry urgent (red):** within category urgent threshold
  - **Expired:** past expiry date
  - **Dead stock:** zero sales in 30+ days (uses `createdAt` timestamp)
- **Category-based thresholds:** Dairy (3d/7d), Beverages (5d/14d), Snacks (10d/30d), Medicines (15d/45d), Groceries (30d/60d), Electronics (30d/90d)
- **Offer-aware suppression:** Before generating expiry alerts, checks if product has an active clearance offer. If yes, skips the alert. Auto-resolves existing alerts when offer is created.
- **"Create Offer" button** on unresolved expiry alerts — redirects to offers page
- **"Offer Active" tag** — green badge on alerts where product already has an offer
- **Delete individual alerts** — 🗑️ button permanently removes from Firestore
- **"Delete Resolved" button** — bulk-deletes all resolved alerts
- **"Resolve All" button** — marks all unresolved as resolved
- KPI cards showing counts by type, filter dropdowns by type and status
- Unique keys prevent duplicate alerts for the same product/condition

**Files:** `pages/alerts.html`, `js/utils.js`

---

## 7. 📊 Dashboard & Analytics

**What it does:** Real-time KPIs, charts, top sellers, recent alerts, and AI demand predictions.

**How it works:**
- Fetches today's sales for KPIs: customers (unique bills), items sold, revenue, profit
- 30-day profit trend bar chart (Chart.js) with gradient colors and theme-aware styling
- Sales by category neumorphic donut chart with interactive legend
- Top 5 selling products leaderboard with medal badges
- Recent 5 unresolved alerts feed
- **AI Predictions card** — shows demand forecasts, stockout predictions, reorder suggestions
- Alert engine runs in background on dashboard load

**Files:** `pages/dashboard.html`, `js/donut-chart-fixed.js`, `css/donut-chart-refined.css`

---

## 8. 🤖 AI Predictive Intelligence

**What it does:** Uses sales history to forecast demand, predict stockouts, and suggest optimal reorder quantities.

**How it works:**
- `PredictionEngine` module analyzes 30-day sales data from Firestore
- **Daily sales rate:** Total units sold ÷ 30 days per product
- **Stockout prediction:** Current quantity ÷ daily rate = days until stockout
- **Reorder suggestion:** Calculates units needed for 30 days of stock minus current quantity
- **Expiry waste prediction:** Compares units that can be sold before expiry vs current stock
- **Demand trend:** Compares last 15 days vs previous 15 days — increasing 📈, stable ➡️, or decreasing 📉
- Predictions sorted by urgency (soonest stockout first)
- Displayed on dashboard with color-coded stock levels and alert cards

**Files:** `js/predictions.js`, `pages/dashboard.html`

---

## 9. 📋 Reports & Export

**What it does:** Daily, weekly, and monthly sales reports with charts and CSV export.

**How it works:**
- Period selector: Daily (today), Weekly (7 days), Monthly (30 days)
- Summary KPIs: total bills, items sold, revenue, profit, GST collected
- Revenue vs Profit trend line chart
- GST slab-wise breakdown pie chart
- Top 10 selling products table
- Daily breakdown table with date, bill count, revenue, profit
- CSV export downloads all report data for accounting

**Files:** `pages/reports.html`

---

## 10. 🏪 Supplier & Dealer Management

**What it does:** Supplier directory with product linking, WhatsApp integration, and auto reorder drafts.

**How it works:**
- Suppliers stored in Firestore `suppliers` collection with: name, phone, email, notes
- **Product linking:** Add/Edit supplier modal has searchable checkbox list of all products. Selected products get their `supplierId` updated in Firestore.
- **Quick link button:** "🔗 Products" on each supplier card opens a fast link/unlink modal
- **Product tags:** Each supplier card shows linked products with color-coded stock indicators (red ≤10%, yellow ≤30%, green)
- **Search:** Filter suppliers by name, phone, or email
- **Grouped reorder drafts:** Low-stock items (≤10%) grouped by supplier. One WhatsApp message covers all products from that supplier.
- **Direct WhatsApp chat:** "💬 Chat" opens `wa.me/91{phone}` for direct conversation
- **WhatsApp reorder:** "📦 Reorder" sends formatted message listing low-stock products with quantities needed
- **Clean deletion:** Deleting a supplier unlinks all associated products via batch update
- **Inventory integration:** Supplier dropdown in product form, supplier column in inventory table

**Files:** `pages/suppliers.html`, `pages/inventory.html`

---

## 11. 🌐 Vernacular Language Support (i18n)

**What it does:** Full UI translation in English, Hindi (हिन्दी), and Telugu (తెలుగు).

**How it works:**
- `js/i18n.js` contains a `TRANSLATIONS` object with 100+ keys, each having `en`, `hi`, `te` values
- `t(key)` function returns the translated string for the current language
- `setLanguage(lang)` saves to localStorage and reloads the page
- Language switcher dropdown in the topbar (persists across sessions)
- **Translated elements:** Sidebar navigation, page titles, KPI labels, card titles, button text, form labels, table headers, filter dropdowns, alert types/actions, offer fields, billing cart/summary, report periods, supplier form fields, prediction labels, offline messages
- **Not translated:** User-created content (product names, supplier names, notes) — these are data, not UI
- **Extensible:** Add a new language by adding entries to each key in `TRANSLATIONS`

**Files:** `js/i18n.js`, `js/layout.js`, all page files

---

## 12. 📡 Offline Mode

**What it does:** Service Worker + IndexedDB layer so the app works without internet and syncs when connectivity returns.

**How it works:**
- **Service Worker (`sw.js`):**
  - Caches entire app shell (HTML, CSS, JS) on install
  - Network-first strategy for app files (try network, fall back to cache)
  - Cache-first for CDN resources (Firebase SDK, Chart.js, html5-qrcode)
  - Cleans old caches on activate
  - Listens for `sync` events to trigger data sync
- **IndexedDB (`js/offline.js`):**
  - `OfflineManager` module with IndexedDB stores: products, suppliers, offers, pendingWrites
  - `cacheFirestoreData()` — periodically caches Firestore data locally when online
  - `queueWrite(operation)` — queues Firestore writes (set/update/delete) when offline
  - `syncPendingWrites()` — replays queued writes to Firestore when back online
  - `getCachedData(store)` — reads cached data for offline viewing
- **Online/Offline detection:**
  - Listens to `window.online` and `window.offline` events
  - Shows translated offline banner when disconnected
  - Auto-syncs pending writes and re-caches data when reconnected
  - Toast notification showing how many changes were synced
- **Service Worker registration:** All 10 HTML pages (8 in pages/ + index.html + signup.html) register the SW with correct relative path

**Files:** `sw.js`, `js/offline.js`, all HTML pages

---

## 13. 🎨 UI/UX Design System

**What it does:** Neumorphic design with light/dark theme support, responsive layout, and accessible components.

**How it works:**
- **Color system:** Mint green (#3ab87d) + Cyan (#00a3b8) primary, accent orange (#e8634f)
- **Neumorphic style:** Soft shadows, inset effects, tactile depth on cards, buttons, inputs
- **Light theme:** Warm beige background (#e8e3dc) with soft shadows
- **Dark theme:** Deep navy (#0b0d12) with high-contrast accents, toggled via topbar button
- **Theme persistence:** Saved to localStorage, applied on page load
- **Layout:** Fixed sidebar (240px) with collapsible mobile support (<900px), sticky topbar
- **Components:** KPI cards with colored left borders, badges (green/yellow/red/blue/grey/orange), modals with backdrop blur, toast notifications, empty states
- **Typography:** Inter font family, 14px base
- **Responsive:** Sidebar collapses, grids stack, forms go single-column on mobile

**Files:** `css/style.css`, `css/donut-chart-refined.css`, `js/layout.js`

---

## 14. 🧮 GST Engine

**What it does:** Calculates Indian GST (CGST + SGST) per item and per bill.

**How it works:**
- `calcGST(price, qty, gstPct)` — returns subtotal, gstAmt, cgst, sgst, total for a single item
- `calcBillGST(items)` — aggregates across all cart items, returns subtotal, totalGST, totalCGST, totalSGST, grandTotal, slabMap
- Supports 5 GST slabs: 0%, 5%, 12%, 18%, 28%
- CGST and SGST are always equal (gstAmt / 2 each)
- Used in billing, reports, and bill printing

**Files:** `js/utils.js`

---

## 15. 👥 Customer Loyalty & Rewards (Soniya Branch)

**What it does:** Customer database with loyalty points, tier system, coupons, and billing integration.

**How it works:**
- Customers stored in Firestore `customers` collection with: name, phone, email, totalSpent, totalVisits, loyaltyPoints, lifetimePoints, tier, coupons, lastVisit
- **Points system:** Earn 1 point per ₹10 spent, redeem at 1 point = ₹1
- **Tier system:** Bronze (0), Silver (500), Gold (2000), Platinum (5000 lifetime points)
- **Auto coupons:** Generated when customer reaches a new tier (Silver: 5% off, Gold: 10%, Platinum: 15%)
- **Billing integration:** Customer lookup by phone, points display, coupon application, points redemption
- **Customer page:** Full CRUD, search, tier badges, purchase history, coupon management
- **Sidebar navigation:** Customers link added to sidebar with people icon

**Files:** `pages/customers.html`, `js/billing.js`, `js/billing2.js`, `js/utils.js`, `js/firebase.js`

---

## 16. 🗂️ Category Navigation Grid

**What it does:** Horizontal category chip selector at the top of Inventory and Billing pages for fast product filtering.

**How it works:**
- `buildCatNav()` in `js/utils.js` generates a scrollable row of neumorphic category chips
- Each chip shows: category emoji icon (`CAT_ICONS` map), category name, product count badge
- 11 categories: All, Groceries 🌾, Dairy 🥛, Beverages 🥤, Personal Care 🧴, Stationery ✏️, Electronics 🔌, Snacks 🍿, Medicines 💊, Cleaning 🧹, Other 📦
- Clicking a chip filters the content below (table in inventory, product list in billing)
- Active chip gets cyan highlight with inset shadow and gradient accent bar
- "All" chip shows all products (no filter)
- **Inventory:** Category nav sits above search bar, replaces the old category dropdown
- **Billing:** Category nav sits above the product list panel for quick narrowing during checkout
- Follows existing neumorphic design — same shadows, border radius, theme support

**Files:** `js/utils.js` (buildCatNav, CAT_ICONS), `pages/inventory.html` (renderCatNav, selectInvCat), `js/billing.js` (renderBillCatNav, selectBillCat), `js/billing2.js` (bill-cat-nav container), `css/style.css` (.cat-nav, .cat-chip styles)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Database | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (Email/Password) |
| Charts | Chart.js 4.4 |
| Barcode | html5-qrcode (CDN) |
| i18n | Custom translation engine (EN, HI, TE) |
| Offline | Service Worker + IndexedDB |
| AI/ML | Custom prediction engine (sales-based) |

**Zero dependencies. No npm. No build step. No framework.**

---

## 📁 File Summary

| Area | Count | Files |
|------|-------|-------|
| Root | 4 | index.html, signup.html, sw.js, .gitignore |
| JS | 10 | firebase, utils, i18n, layout, billing, billing2, barcode-scanner, predictions, offline, donut-chart-fixed |
| Pages | 8 | dashboard, inventory, billing, alerts, offers, reports, suppliers, customers |
| CSS | 2 | style.css, donut-chart-refined.css |
| Docs | 2 | README.md, FEATURES.md |


---

## 17. 🔐 Role-Based Access Control (RBAC)

**What it does:** Multi-role system where Admin, Worker, Cashier, and User each see only their permitted pages and data.

**How it works:**
- `js/auth_roles.js` loaded on every `/pages/` file, runs route guard via `auth.onAuthStateChanged`
- Fetches user role from Firestore `users` collection, caches in localStorage for 5 minutes
- Page permission matrix enforces access:
  - **Admin:** All pages (dashboard, inventory, billing, alerts, offers, reports, suppliers, customers)
  - **Worker:** Dashboard, inventory, alerts, suppliers
  - **Cashier:** Dashboard, billing, alerts, reports
  - **User (Customer):** Landing, deals, cart, orders
- Sidebar nav dynamically filtered — each role only sees their allowed links
- Unauthorized URL access redirects to role's default page
- Signup page has role selector (Customer, Cashier, Worker, Admin)
- Login redirects based on role: User → landing.html, others → dashboard.html
- Old accounts without role doc default to Admin for backward compatibility

**Files:** `js/auth_roles.js`, `js/layout.js`, `index.html`, `signup.html`

---

## 18. 🛍️ Customer Shopping Experience

**What it does:** Full customer-facing shopping flow with product browsing, cart, checkout, pre-orders, and order tracking.

**Pages:**
- `landing.html` — Hero search (debounced 300ms), category grid, product cards with offers/stock badges, trending section
- `offers_user.html` — Read-only deals with countdown timers, hot sale badges, limited qty progress bars, savings display
- `cart.html` — Full cart with qty controls, GST breakdown (CGST/SGST), checkout + pre-order
- `orders.html` — Order history with live status badges (Not Started/Packing/Ready), Buy Again, auto-refresh every 30s

**Cart System (`js/cart_logic.js`):**
- localStorage-based, persists across reloads
- Corrupt cart recovery (validates each item has required fields)
- Add/remove/update qty with stock validation
- Auto GST calculation
- Checkout creates sale in Firestore with atomic stock decrement
- Pre-order system with estimated arrival time (10 min default)
- Offline queue via IndexedDB when no internet

**Files:** `js/cart_logic.js`, `pages/landing.html`, `pages/offers_user.html`, `pages/cart.html`, `pages/orders.html`

---

## 19. 🔒 Firestore Security Rules

**What it does:** Server-side RBAC enforcement so no client-side bypass is possible.

**Rules (`firestore.rules`):**
- Products: read all authenticated, write Admin/Worker only
- Sales: create any authenticated, read all authenticated, update Admin/Cashier, delete Admin
- Users: read self or Admin, create self, update self or Admin, delete Admin
- Offers: read all, write Admin only
- Alerts: read/write all authenticated
- Suppliers: read all, write Admin/Worker
- Customers: read all, write Admin

---

## 20. ⚙️ Error Handling & Stability

**What it does:** Crash prevention across the entire app.

**How it works:**
- Global `window.onerror` and `unhandledrejection` handlers in `firebase.js`
- All async Firestore calls wrapped in try/catch
- Safety guards: `typeof fn === 'function'` checks before calling external functions
- `getCurrentUserRole()` checks localStorage cache before async fetch completes
- Cart validates item structure on read (corrupt data recovery)
- Predictions engine returns empty array on error instead of crashing
- Offline manager checks `db` and `COL` exist before caching
- Auth persistence enabled (`LOCAL`) to prevent session loss
- Firestore offline persistence enabled with multi-tab support

---

## 21. 📡 Offline Support (Updated)

**Service Worker (`sw.js`):**
- Caches all 26 app files (12 JS, 12 HTML, 2 CSS)
- Network-first for app files, cache fallback
- Cache version `v3` — auto-cleans old caches

**IndexedDB (`js/offline.js`):**
- Stores: products, suppliers, offers, pendingWrites
- Queues writes when offline, syncs on reconnect
- Offline banner with translated messages
- Auto-caches Firestore data 3 seconds after page load

---

## 📁 Updated File Summary

| Area | Count | Files |
|------|-------|-------|
| Root | 5 | index.html, signup.html, sw.js, firestore.rules, .gitignore |
| JS | 11 | firebase, utils, auth_roles, i18n, layout, billing, billing2, cart_logic, barcode-scanner, predictions, offline |
| Pages | 12 | dashboard, inventory, billing, alerts, offers, reports, suppliers, customers, landing, offers_user, cart, orders |
| CSS | 2 | style.css, donut-chart-refined.css |
| Docs | 2 | README.md, FEATURES.md |
| **Total** | **32** | |
