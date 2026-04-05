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

### 🧾 Intelligent Billing System
- Click-to-add product billing with real-time cart
- **Auto GST calculation** — CGST + SGST split per item based on GST slab
- **Automatic offer/discount detection** — active offers are applied at billing time with strikethrough pricing and savings display
- Stock auto-deduction on bill confirmation
- Print-ready bill receipt with shop details, GST breakdown, and discount info

### 🎯 Offers & Discounts
- Create percentage, flat, or Buy-X-Get-Y offers linked to specific products
- **Expiry-linked suggestions** — products approaching expiry are automatically suggested for discount offers
- Active/inactive offer management with validity dates

### 🔔 Category-Aware Smart Alerts
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

### 🏪 Supplier Management
- Supplier contact directory with phone, email, notes
- **Auto reorder drafts** — when stock is critically low, generates pre-written reorder messages
- **One-click WhatsApp** integration for sending reorder requests directly

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Database | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (Email/Password) |
| Charts | Chart.js 4.4 |
| Hosting | Any static host (GitHub Pages, Netlify, or just open locally) |

**Zero dependencies. No npm. No build step. No framework.**

---

## 📁 Project Structure

```
shopsmart/
├── index.html                 ← Login page
├── signup.html                ← Account creation
├── css/
│   ├── style.css              ← Complete UI styles
│   └── donut-chart-refined.css
├── js/
│   ├── firebase.js            ← Firebase config & auth
│   ├── utils.js               ← GST engine, category-based alerts, helpers
│   ├── layout.js              ← Sidebar & navigation builder
│   ├── billing.js             ← Product loading, cart, offer detection
│   ├── billing2.js            ← Cart rendering, bill confirmation, printing
│   └── donut-chart-fixed.js   ← Custom chart component
└── pages/
    ├── dashboard.html         ← KPIs, charts, top sellers
    ├── inventory.html         ← Product CRUD with company/brand
    ├── billing.html           ← POS billing with auto discounts
    ├── alerts.html            ← Smart category-aware alerts
    ├── offers.html            ← Discount & offer management
    ├── reports.html           ← Analytics with CSV export
    └── suppliers.html         ← Supplier contacts & WhatsApp reorder
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
2. **Offer-aware billing** — Discounts are automatically detected and applied at checkout. No manual price overrides.
3. **Zero infrastructure** — No server, no database setup, no Docker. Firebase handles everything. A shop owner can be up and running in 5 minutes.
4. **WhatsApp-native reordering** — Low stock triggers pre-written reorder messages that open directly in WhatsApp with the supplier's number.
5. **GST-compliant** — Every bill splits CGST/SGST per Indian tax slabs (0%, 5%, 12%, 18%, 28%).

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
