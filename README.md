# 🛒 ShopSmart — AI-Powered Retail Intelligence Platform

**Team Cloud Nine** | Soniya · Lasya · Dedeepya · Sameer  
**Track:** RetailTech / AI for Small Business · Hackathon 2025

---

## 🎯 Problem Statement

Small retail shop owners in India struggle with manual inventory tracking, missed expiry dates leading to losses, no visibility into profit margins, and zero data-driven decision making. Most existing POS systems are either too expensive or too complex for a kirana store owner.

## 💡 Our Solution

**ShopSmart** is a lightweight, cloud-based retail management platform built entirely with vanilla HTML/CSS/JS and Firebase. No frameworks, no build tools, no server — just open and run. It gives small shop owners the power of enterprise retail analytics at zero cost.

---

## ✨ Key Features

### 📦 Smart Inventory Management
- Add products with company name, category, size, cost/selling price, GST slab, expiry date
- Real-time stock tracking with low stock and expiry status badges
- Search and filter by name, company, category, or status
- **Barcode scanning** — scan product barcodes via device camera to quickly find or add products
- **Bulk scan mode** — continuously scan multiple products to update stock quantities in batch
- **Supplier column** — see which supplier/dealer is linked to each product directly in the table
- **Supplier dropdown** — select supplier from a proper dropdown instead of typing IDs manually

### 🧾 Intelligent Billing System
- Click-to-add product billing with real-time cart
- **Auto GST calculation** — CGST + SGST split per item based on GST slab
- **Automatic offer/discount detection** — active offers are applied at billing time with strikethrough pricing and savings display
- **Barcode scanning at checkout** — continuous scan mode for rapid billing, items auto-add to cart
- **Limited quantity offer enforcement** — offers with max quantity limits are tracked and auto-deactivated when sold out
- Stock auto-deduction on bill confirmation
- Print-ready bill receipt with shop details, GST breakdown, and discount info
- **Quick bill from offers** — "Sell Now" button on offers redirects to billing with product pre-added

### 🎯 Offers & Discounts
- Create percentage, flat, or Buy-X-Get-Y offers linked to specific products
- **Limited quantity offers** — set a max quantity for offers (e.g., only 20 units at discount), with progress bar showing sold/total
- **Offer reason tracking** — tag offers as "Expiry Clearance", "Festival Offer", "Clearance Sale", "Bulk Deal"
- **Smart expiry clearance suggestions** — products approaching expiry without an active offer are highlighted with auto-suggested discount percentages:
  - ≤ 3 days left → 40% off suggested
  - ≤ 7 days left → 30% off suggested
  - ≤ 15 days left → 20% off suggested
  - ≤ 30 days left → 10% off suggested
- **One-click offer creation** from expiry suggestions with pre-filled product, discount, quantity, and expiry date
- **Covered products indicator** — products that already have active offers are shown separately with a "Covered" badge
- Active/inactive/sold-out offer management with validity dates
- **Sell Now button** — quick path from offer card to billing page with product pre-loaded

### � Category-Aware Smart Alerts
This is our key innovation. Instead of one-size-fits-all expiry alerts, ShopSmart uses **category-based thresholds**:

| Category | 🔴 Urgent Alert | 🟡 Warning Alert |
|----------|-----------------|-------------------|
| Dairy | 3 days | 7 days |
| Beverages | 5 days | 14 days |
| Snacks | 10 days | 30 days |
| Medicines | 15 days | 45 days |
| Groceries (rice, dal) | 30 days | 60 days |
| Electronics | 30 days | 90 days |

- Low stock alerts when inventory drops below 10% of max
- Dead stock detection for products with zero sales in 30+ days
- Expired product alerts with "remove from shelf" urgency
- **Smart alert suppression** — expiry alerts are automatically suppressed when the product already has an active clearance offer (the owner has already taken action)
- **Auto-resolve** — existing expiry alerts are auto-resolved when a clearance offer is created for that product
- **"Create Offer" button on alerts** — one-click redirect to offers page from any expiry alert
- **"Offer Active" tag** — visual indicator on alerts where the product already has an active offer
- **Delete individual alerts** — 🗑️ button on each alert to permanently remove it from Firestore
- **Bulk delete resolved** — "Delete Resolved" button in the topbar to clean up all resolved alerts at once

### 📊 Dashboard & Analytics
- Today's KPIs: customers, items sold, revenue, profit, active alerts
- 30-day profit trend bar chart
- Sales by category doughnut chart
- Top 5 selling products leaderboard
- Recent alerts feed

### 📋 Reports & Export
- Daily, weekly, and monthly report views
- Revenue vs profit trend line charts
- GST slab-wise breakdown with pie chart
- Top selling products table
- Daily breakdown with bill count, revenue, profit
- **CSV export** for accounting

### 🏪 Supplier & Dealer Management
- Supplier contact directory with phone, email, notes
- **Product linking** — assign products to suppliers directly when adding/editing a supplier via searchable checkbox list
- **Quick link button** — "� Products" button on each supplier card for fast product assignment
- **Product tags with stock levels** — each supplier card shows linked products with color-coded stock indicators (red/yellow/green)
- **Search suppliers** — filter by name, phone, or email
- **Grouped reorder drafts** — low-stock items grouped by supplier with a single WhatsApp message covering all products
- **Direct WhatsApp chat** — "💬 Chat" button opens a direct conversation with the supplier
- **WhatsApp reorder** — "📦 Reorder" button sends a formatted reorder message listing low-stock products
- **Auto reorder drafts** — when stock is critically low, generates pre-written reorder messages
- **Clean supplier deletion** — deleting a supplier automatically unlinks all associated products

### 📷 Barcode Scanning
- **Reusable scanner component** — works across inventory, billing, and any future pages
- **Camera-based scanning** — uses device rear camera (mobile) or webcam (desktop)
- **Supported formats** — EAN-13, EAN-8, UPC-A, CODE-128, CODE-39
- **Manual fallback** — type barcode number manually if camera isn't available
- **Single scan mode** — scan one barcode and auto-close (for inventory lookup)
- **Continuous scan mode** — keep scanning multiple items with 1.5s cooldown (for billing and bulk operations)
- **Audio feedback** — beep sound on successful scan
- **Scan log** — running list of scanned items in continuous mode

### 🌐 Vernacular Language Support (Hindi & Telugu)
- **Three languages** — English, Hindi (हिन्दी), and Telugu (తెలుగు)
- **Language switcher** in the topbar — one-click switch, persists across sessions via localStorage
- **Full UI translation** — navigation, buttons, labels, alerts, billing, reports, offers, suppliers, dashboard KPIs, table headers, form fields, filter dropdowns — every visible string translates
- **Designed for kirana owners** in Tier 2/3 cities who are more comfortable in regional languages
- **Extensible** — add more languages by simply adding entries to the translations object in `js/i18n.js`

### 🤖 AI Predictive Intelligence
- **Demand forecasting** — uses 30-day sales history to calculate daily sales rate per product
- **Stockout prediction** — "Amul Milk will run out in ~4 days at current rate"
- **Optimal reorder suggestions** — calculates how many units to reorder for 30 days of stock
- **Expiry waste prediction** — identifies products likely to expire before being sold, with estimated waste units
- **Demand trend analysis** — shows if demand is increasing 📈, stable ➡️, or decreasing 📉 (compares last 15 days vs previous 15)
- **Dashboard integration** — AI predictions card on the dashboard with urgent alerts highlighted
- **Moves from reactive to predictive** — instead of alerting after stock is low, predicts when it will happen

### 📡 Offline Mode
- **Service Worker** — caches the entire app shell (HTML, CSS, JS) for offline access
- **IndexedDB local storage** — products, suppliers, and offers cached locally for offline viewing
- **Pending writes queue** — billing and inventory changes made offline are queued in IndexedDB
- **Auto-sync on reconnect** — when internet returns, all pending changes sync to Firestore automatically
- **Offline banner** — visual indicator when the app is offline, with translated messages
- **Background sync** — service worker triggers sync when connectivity is restored
- **Rural-ready** — designed for kirana stores in Tier 2/3 cities with unreliable internet

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Database | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (Email/Password) |
| Charts | Chart.js 4.4 |
| Barcode | html5-qrcode (CDN) |
| i18n | Custom translation engine (English, Hindi, Telugu) |
| Offline | Service Worker + IndexedDB |
| AI/ML | Custom prediction engine (sales-based demand forecasting) |
| Hosting | Any static host (GitHub Pages, Netlify, or just open locally) |

**Zero dependencies. No npm. No build step. No framework.**

---

## 📁 Project Structure

```
shopsmart/
├── index.html                 ← Login page
├── signup.html                ← Account creation
├── sw.js                      ← Service Worker for offline mode
├── css/
│   ├── style.css              ← Complete UI styles + scanner + offline banner
│   └── donut-chart-refined.css
├── js/
│   ├── firebase.js            ← Firebase config & auth
│   ├── utils.js               ← GST engine, smart alert engine (offer-aware), helpers
│   ├── i18n.js                ← Internationalization — English, Hindi, Telugu translations
│   ├── layout.js              ← Sidebar & navigation builder (i18n-aware)
│   ├── predictions.js         ← AI demand forecasting & stockout prediction engine
│   ├── offline.js             ← Service Worker registration, IndexedDB cache, sync queue
│   ├── billing.js             ← Product loading, cart, offer detection, barcode lookup
│   ├── billing2.js            ← Cart rendering, bill confirmation, printing, offer qty tracking
│   ├── barcode-scanner.js     ← Reusable barcode scanner component (camera + manual)
│   └── donut-chart-fixed.js   ← Custom chart component
└── pages/
    ├── dashboard.html         ← KPIs, charts, top sellers, AI predictions
    ├── inventory.html         ← Product CRUD with barcode, supplier dropdown, bulk scan
    ├── billing.html           ← POS billing with barcode scanning & auto discounts
    ├── alerts.html            ← Smart alerts with offer-awareness & quick offer creation
    ├── offers.html            ← Limited qty offers, expiry clearance, sell-now
    ├── reports.html           ← Analytics with CSV export
    └── suppliers.html         ← Supplier management with product linking & WhatsApp
```

---

## 🚀 Setup & Run

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Add a Web App → Copy the `firebaseConfig` object
3. Paste into `js/firebase.js`
4. Enable **Authentication → Email/Password**
5. Enable **Firestore Database** (test mode for development)

### 2. Firestore Rules (for testing)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Run
```bash
# Option A: Python
python -m http.server 5500

# Option B: Node
npx serve .

# Option C: Just open index.html in browser
```

---

## 🔥 What Makes ShopSmart Different

1. **Category-aware intelligence** — A dairy product expiring in 3 days gets a red alert. Rice expiring in 30 days gets a yellow one. No false alarms.
2. **AI-powered demand forecasting** — Predicts when products will run out, suggests optimal reorder quantities, and identifies items likely to expire unsold. The "AI" in the tagline earns its place.
3. **Vernacular language support** — Full Hindi and Telugu UI so kirana owners in smaller cities can use the app in their language. One-click switch.
4. **Offline-first architecture** — Service Worker + IndexedDB means billing and inventory work even without internet. Changes sync automatically when connectivity returns. Rural-ready.
5. **Offer-aware alerts** — If you've already created a clearance offer for an expiring product, ShopSmart won't nag you with alerts. It auto-resolves them.
6. **Barcode-powered speed** — Scan products to add to inventory or bill in seconds. Bulk scan mode handles stock intake without typing.
7. **Limited quantity offers** — Create clearance offers for exactly the stock you want to move. Progress bar tracks how many have sold.
8. **Smart clearance suggestions** — Products approaching expiry get auto-suggested discount percentages based on urgency. One click to create the offer.
9. **Offer-aware billing** — Discounts are automatically detected and applied at checkout. No manual price overrides.
10. **Zero infrastructure** — No server, no database setup, no Docker. Firebase handles everything. A shop owner can be up and running in 5 minutes.
11. **WhatsApp-native reordering** — Low stock triggers pre-written reorder messages grouped by supplier, sent directly via WhatsApp.
12. **GST-compliant** — Every bill splits CGST/SGST per Indian tax slabs (0%, 5%, 12%, 18%, 28%).
13. **Supplier-product linking** — Assign dealers to products with searchable checkboxes. See stock health per supplier at a glance.

---

## 👥 Team Cloud Nine

| Name | Role |
|------|------|
| Soniya | Frontend & UI Design |
| Lasya | Database & Firebase Integration |
| Dedeepya | Business Logic & GST Engine |
| Sameer | Architecture & Full-Stack Development |

---

## 📄 License

Built for Hackathon 2025. Open source for educational purposes.
