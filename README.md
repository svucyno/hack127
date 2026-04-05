# 🛒 ShopSmart

**AI-powered retail management for small businesses — zero dependencies, fully offline-capable.**

> Built by **Team Cloud Nine** — Soniya, Lasya, Dedeepya, Sameer
> **Track:** RetailTech / AI for Small Business · **Hackathon 2025**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| Auth & Database | Firebase Auth + Cloud Firestore |
| Offline Storage | IndexedDB + Service Worker |
| Charts | Chart.js |
| Barcode Scanning | html5-qrcode (camera-based) |
| Translation | MyMemory Translation API |

No npm. No build step. No framework. Just open and run.

---

## Features

### 1. Smart Inventory
- Full CRUD for products with category navigation grid (neumorphic chips with icons + counts)
- Camera-based barcode scanning — single and continuous (bulk) modes with audio feedback and manual fallback
- Supplier dropdown linking, stock level badges

### 2. Intelligent Billing (POS)
- Auto GST calculation (CGST + SGST breakdown)
- Auto offer detection at checkout
- Barcode scanning at the register
- Sequential bill numbers via Firestore counter (`BILL-00001`, `BILL-00002`, …)
- Print-ready receipts

### 3. Category-Aware Alerts
- Per-category expiry thresholds (e.g. Dairy → 3 days, Groceries → 30 days)
- Offer-aware suppression — no alerts for items already on clearance
- Auto-resolve when conditions clear; delete individual or bulk

### 4. Offers & Discounts
- Limited-quantity offers with live progress bar
- Expiry clearance suggestions with auto-calculated discount %
- "Sell Now" quick action button, reason tags for each offer

### 5. AI Demand Predictions (v2)
- Weighted moving average forecasting
- Weekly pattern detection — identifies peak and low sales days
- Confidence scoring (High / Medium / Low)
- Seasonal spike detection, stockout prediction, reorder suggestions

### 6. Reports & Export
- Daily, weekly, and monthly report views
- Visual charts (Chart.js)
- CSV export for all report data

### 7. Supplier Management
- Link products to suppliers via checkbox selection
- WhatsApp reorder messages grouped by supplier
- Direct WhatsApp chat link per supplier

### 8. Customer Loyalty
- Points-based system with automatic tier progression
- Tiers: Bronze → Silver → Gold → Platinum
- Auto-generated coupons per tier

### 9. Vernacular Support
- Full UI translation: English, Hindi, Telugu
- Dynamic product name translation via MyMemory API

### 10. Offline Mode
- Service Worker caches all 36 project files
- IndexedDB for local data persistence
- Pending writes queue with visible count display
- Manual sync button + auto-sync on reconnect

### 11. Role-Based Access Control (RBAC)
Four roles with page-level access, sidebar filtering, and route guards:

| Page | Admin | Worker | Cashier | Customer |
|------|:-----:|:------:|:-------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ | — |
| Inventory | ✅ | ✅ | — | — |
| Billing | ✅ | — | ✅ | — |
| Alerts | ✅ | ✅ | ✅ | — |
| Offers | ✅ | — | — | — |
| Reports | ✅ | — | ✅ | — |
| Suppliers | ✅ | ✅ | — | — |
| Customers | ✅ | — | — | — |
| Users | ✅ | — | — | — |
| Orders | ✅ | — | ✅ | ✅ |
| Shop | — | — | — | ✅ |
| Deals | — | — | — | ✅ |
| Notifications | — | — | — | ✅ |
| Cart | — | — | — | ✅ |

### 12. Customer Shopping Experience
- Landing page with search, category browsing, product grid, and trending items
- Deals page with countdown timers, hot badges, and limited-quantity indicators
- Cart with full GST breakdown, checkout flow with pickup time popup
- Orders page with live status tracking (progress bar) and "Order Received" confirmation

### 13. Order Management
Full lifecycle managed by Admin/Cashier:

```
Order Placed → Accepted → Packing Done (auto-bill + print) → Ready for Pickup → Customer Confirms → Completed + Loyalty Update
```

### 14. User Management
- Admin creates Worker/Cashier accounts via secondary Firebase Auth instance
- Admin session is preserved (no logout on account creation)

### 15. Notifications
- Deals, expiring offers, new arrivals, budget picks
- Deduplicated per product to avoid spam

### 16. Smart Low-Stock Thresholds
- Dynamic reorder point calculated from sales rate and supplier lead time

### 17. Mobile Responsive
- Sidebar drawer with overlay on mobile
- Touch-friendly buttons (44px minimum tap targets)
- Stacked layouts and responsive charts

### 18. User-Friendly Errors
- All Firebase error codes mapped to plain English messages

---

## Project Structure

```
ShopSmart/
├── index.html              # Login
├── signup.html             # Registration
├── sw.js                   # Service Worker
├── firestore.rules         # Firestore security rules
├── .gitignore
│
├── css/
│   ├── style.css
│   └── donut-chart-refined.css
│
├── js/
│   ├── firebase.js         # Firebase config & init
│   ├── utils.js            # Shared helpers
│   ├── auth_roles.js       # Auth + RBAC logic
│   ├── i18n.js             # Vernacular translation
│   ├── layout.js           # Sidebar, navigation
│   ├── billing.js          # Billing engine
│   ├── billing2.js         # Extended billing logic
│   ├── cart_logic.js       # Cart operations
│   ├── barcode-scanner.js  # Camera barcode scanning
│   ├── predictions.js      # AI demand forecasting
│   ├── offline.js          # IndexedDB + sync queue
│   └── donut-chart-fixed.js
│
└── pages/
    ├── dashboard.html
    ├── inventory.html
    ├── billing.html
    ├── alerts.html
    ├── offers.html
    ├── reports.html
    ├── suppliers.html
    ├── customers.html
    ├── users.html
    ├── order_mgmt.html
    ├── landing.html
    ├── offers_user.html
    ├── notifications.html
    ├── cart.html
    └── orders.html
```

**36 files total** — 12 JS, 15 pages + 2 root HTML, 2 CSS, 5 config/docs

---

## Getting Started

### 1. Firebase Setup
1. Create a project in [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Email/Password provider
3. Enable **Cloud Firestore**
4. Deploy security rules from `firestore.rules`
5. Copy your Firebase config into `js/firebase.js`

### 2. Run Locally

Any of these work — pick your favorite:

```bash
# Python
python -m http.server 5500

# Node (npx, no install needed)
npx serve .

# Or just open index.html directly in a browser
```

### 3. Default Admin Login

| Email | Password |
|-------|----------|
| `admin@gmail.com` | `Admin123` |

---

## What Makes ShopSmart Different

| # | Differentiator |
|---|---------------|
| 1 | **Zero infrastructure** — no server, no build, no dependencies |
| 2 | **Offline-first** — full functionality without internet |
| 3 | **Category-aware intelligence** — alerts tuned per product type |
| 4 | **AI demand forecasting** — confidence-scored predictions |
| 5 | **Vernacular support** — UI + dynamic product translation |
| 6 | **WhatsApp-native reordering** — grouped by supplier |
| 7 | **Complete RBAC** — 4 distinct roles with route guards |
| 8 | **Dual order flow** — in-store POS + online customer orders |
| 9 | **GST-compliant** — auto CGST/SGST on every transaction |
| 10 | **2-step order completion** — staff fulfills, customer confirms |

---

*Built with ❤️ by Team Cloud Nine — Hackathon 2026*
