// ── GST Engine ─────────────────────────────────────────────────────────────
var GST_SLABS = [0, 5, 12, 18, 28];

function calcGST(price, qty, gstPct) {
  var subtotal = price * qty;
  var gstAmt   = parseFloat(((subtotal * gstPct) / 100).toFixed(2));
  var cgst     = parseFloat((gstAmt / 2).toFixed(2));
  var sgst     = parseFloat((gstAmt / 2).toFixed(2));
  var total    = parseFloat((subtotal + gstAmt).toFixed(2));
  return { subtotal: subtotal, gstAmt: gstAmt, cgst: cgst, sgst: sgst, total: total };
}

function calcBillGST(items) {
  var subtotal = 0, totalGST = 0, totalCGST = 0, totalSGST = 0, grandTotal = 0;
  var slabMap = {};
  items.forEach(function(item) {
    var g = calcGST(item.price, item.qty, item.gst);
    subtotal   += g.subtotal;
    totalGST   += g.gstAmt;
    totalCGST  += g.cgst;
    totalSGST  += g.sgst;
    grandTotal += g.total;
    if (!slabMap[item.gst]) slabMap[item.gst] = 0;
    slabMap[item.gst] += g.gstAmt;
  });
  return {
    subtotal:   +subtotal.toFixed(2),
    totalGST:   +totalGST.toFixed(2),
    totalCGST:  +totalCGST.toFixed(2),
    totalSGST:  +totalSGST.toFixed(2),
    grandTotal: +grandTotal.toFixed(2),
    slabMap: slabMap
  };
}

// ── Date helpers ────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  var diff = new Date(dateStr) - new Date(today());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  var diff = new Date(today()) - new Date(dateStr);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  var d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

// ── Category-based expiry thresholds ───────────────────────────────────────
var EXPIRY_THRESHOLDS = {
  "Dairy":          { urgent: 3,  warning: 7   },
  "Beverages":      { urgent: 5,  warning: 14  },
  "Snacks":         { urgent: 10, warning: 30  },
  "Personal Care":  { urgent: 15, warning: 45  },
  "Medicines":      { urgent: 15, warning: 45  },
  "Groceries":      { urgent: 30, warning: 60  },
  "Cleaning":       { urgent: 30, warning: 60  },
  "Stationery":     { urgent: 30, warning: 90  },
  "Electronics":    { urgent: 30, warning: 90  },
  "Other":          { urgent: 15, warning: 30  },
};

function getExpiryThresholds(category) {
  return EXPIRY_THRESHOLDS[category] || EXPIRY_THRESHOLDS["Other"];
}

// ── Alert engine ──────────────────────────────────────────────────────────
async function runAlertEngine() {
  var snap = await db.collection(COL.products).get();
  var batch = db.batch();
  var alertsSnap = await db.collection(COL.alerts).where("resolved", "==", false).get();
  var existingKeys = new Set(alertsSnap.docs.map(function(d) { return d.data().key; }));

  snap.forEach(function(doc) {
    var p   = doc.data();
    var id  = doc.id;
    var qty = p.quantity || 0;
    var max = p.maxStock || 1;
    var pct = (qty / max) * 100;
    var exp = p.expiryDate ? daysUntil(p.expiryDate) : null;
    var thresholds = getExpiryThresholds(p.category);

    // Low stock
    if (pct <= 10) {
      var key = "lowstock_" + id;
      if (!existingKeys.has(key)) {
        var ref = db.collection(COL.alerts).doc();
        batch.set(ref, { type: "lowstock", key: key, productId: id, productName: p.name, category: p.category, message: "Low stock: " + p.name + " has only " + qty + " units left (" + pct.toFixed(1) + "% of max).", resolved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
    }

    // Expiry warning (yellow)
    if (exp !== null && exp <= thresholds.warning && exp > thresholds.urgent) {
      var key2 = "expiry_warn_" + id;
      if (!existingKeys.has(key2)) {
        var ref2 = db.collection(COL.alerts).doc();
        batch.set(ref2, { type: "expiry30", key: key2, productId: id, productName: p.name, category: p.category, message: "Expiry warning: " + p.name + " (" + p.category + ") expires in " + exp + " days (" + fmtDate(p.expiryDate) + ").", resolved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
    }

    // Expiry urgent (red)
    if (exp !== null && exp <= thresholds.urgent && exp >= 0) {
      var key3 = "expiry_urgent_" + id;
      if (!existingKeys.has(key3)) {
        var ref3 = db.collection(COL.alerts).doc();
        batch.set(ref3, { type: "expiry15", key: key3, productId: id, productName: p.name, category: p.category, message: "URGENT: " + p.name + " (" + p.category + ") expires in " + exp + " day" + (exp !== 1 ? "s" : "") + "! Consider a discount offer.", resolved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
    }

    // Already expired
    if (exp !== null && exp < 0) {
      var key4 = "expired_" + id;
      if (!existingKeys.has(key4)) {
        var ref4 = db.collection(COL.alerts).doc();
        batch.set(ref4, { type: "expiry15", key: key4, productId: id, productName: p.name, category: p.category, message: "EXPIRED: " + p.name + " (" + p.category + ") expired " + Math.abs(exp) + " days ago! Remove from shelf.", resolved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
    }

    // Dead stock — use createdAt timestamp instead of broken createdDaysAgo
    if ((p.salesCount30 || 0) === 0 && p.createdAt && p.createdAt.toDate) {
      var createdDays = daysSince(p.createdAt.toDate().toISOString().split("T")[0]);
      if (createdDays > 30) {
        var key5 = "deadstock_" + id;
        if (!existingKeys.has(key5)) {
          var ref5 = db.collection(COL.alerts).doc();
          batch.set(ref5, { type: "deadstock", key: key5, productId: id, productName: p.name, category: p.category, message: "Dead stock: " + p.name + " has had zero sales in 30+ days. Consider not restocking.", resolved: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
      }
    }
  });
  await batch.commit();
}

// ── Toast notification ─────────────────────────────────────────────────────
function showToast(msg, type) {
  type = type || "success";
  var t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.classList.add("show"); }, 10);
  setTimeout(function() { t.classList.remove("show"); setTimeout(function() { t.remove(); }, 400); }, 3000);
}

// ── Confirm dialog ─────────────────────────────────────────────────────────
function confirmAction(msg) {
  return window.confirm(msg);
}

// ── Sidebar active link ────────────────────────────────────────────────────
function setActiveNav() {
  var path = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-link").forEach(function(a) {
    var href = a.getAttribute("href").split("/").pop();
    if (href === path) { a.classList.add("active"); } else { a.classList.remove("active"); }
  });
}

// ── Loyalty Points Engine ─────────────────────────────────────────────────
var POINTS_PER_RUPEE = 0.1;   // 1 point per ₹10
var MIN_REDEEM_POINTS = 50;
var POINT_VALUE = 1;           // 1 point = ₹1

var TIER_THRESHOLDS = [
  { name: "Platinum", min: 5000, color: "#e5e4e2" },
  { name: "Gold",     min: 2000, color: "#ffd700" },
  { name: "Silver",   min: 500,  color: "#c0c0c0" },
  { name: "Bronze",   min: 0,    color: "#cd7f32" }
];

function calcPoints(grandTotal) {
  return Math.floor((grandTotal || 0) * POINTS_PER_RUPEE);
}

function getTier(lifetimePoints) {
  var pts = lifetimePoints || 0;
  for (var i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (pts >= TIER_THRESHOLDS[i].min) {
      var current = TIER_THRESHOLDS[i];
      var next = i > 0 ? TIER_THRESHOLDS[i - 1] : null;
      return {
        name: current.name,
        color: current.color,
        nextTier: next ? next.name : null,
        pointsToNext: next ? (next.min - pts) : 0,
        nextMin: next ? next.min : 0,
        currentMin: current.min
      };
    }
  }
  return { name: "Bronze", color: "#cd7f32", nextTier: "Silver", pointsToNext: 500 - pts, nextMin: 500, currentMin: 0 };
}

function getTierColor(tier) {
  var colors = { "Bronze": "#cd7f32", "Silver": "#c0c0c0", "Gold": "#ffd700", "Platinum": "#e5e4e2" };
  return colors[tier] || "#cd7f32";
}

function generateCoupon(tier) {
  var code = "SHOP-" + tier.toUpperCase() + "-" + (Math.floor(1000 + Math.random() * 9000));
  var now = new Date();
  var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  var expiresAt = expires.toISOString().split("T")[0];

  if (tier === "Silver") {
    return { code: code, discount: 5, type: "percentage", minPurchase: 500, expiresAt: expiresAt, used: false, reason: "Silver Tier Reward" };
  } else if (tier === "Gold") {
    return { code: code, discount: 10, type: "percentage", minPurchase: 1000, expiresAt: expiresAt, used: false, reason: "Gold Tier Reward" };
  } else if (tier === "Platinum") {
    return { code: code, discount: 15, type: "percentage", minPurchase: 0, expiresAt: expiresAt, used: false, reason: "Platinum Tier Reward" };
  }
  return null;
}

function generateBirthdayCoupon() {
  var code = "SHOP-BDAY-" + (Math.floor(1000 + Math.random() * 9000));
  var now = new Date();
  var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { code: code, discount: 10, type: "percentage", minPurchase: 0, expiresAt: expires.toISOString().split("T")[0], used: false, reason: "Birthday Special 🎂" };
}

function generateMissYouCoupon() {
  var code = "SHOP-MISS-" + (Math.floor(1000 + Math.random() * 9000));
  var now = new Date();
  var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { code: code, discount: 5, type: "percentage", minPurchase: 0, expiresAt: expires.toISOString().split("T")[0], used: false, reason: "We Miss You! 💝" };
}

function generateMilestoneCoupon(visitCount) {
  var code = "SHOP-MILE-" + (Math.floor(1000 + Math.random() * 9000));
  var now = new Date();
  var expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { code: code, discount: 100, type: "flat", minPurchase: 0, expiresAt: expires.toISOString().split("T")[0], used: false, reason: visitCount + " Visits Milestone 🎉" };
}

// ── Customer Alert Engine (birthday + inactivity checks) ──────────────────
async function runCustomerAlertEngine() {
  try {
    var snap = await db.collection(COL.customers).get();
    var todayDate = new Date();
    var todayMonth = todayDate.getMonth() + 1;
    var todayDay = todayDate.getDate();

    snap.forEach(function(doc) {
      var c = doc.data();
      var coupons = c.coupons || [];
      var needsUpdate = false;

      // Birthday coupon check
      if (c.birthday) {
        var bday = new Date(c.birthday);
        var bdayMonth = bday.getMonth() + 1;
        var bdayDay = bday.getDate();
        var diff = (bdayMonth === todayMonth) ? (bdayDay - todayDay) : -999;
        if (diff >= 0 && diff <= 7) {
          var hasBday = coupons.some(function(cp) { return cp.reason && cp.reason.indexOf("Birthday") !== -1 && !cp.used && cp.expiresAt >= today(); });
          if (!hasBday) {
            coupons.push(generateBirthdayCoupon());
            needsUpdate = true;
          }
        }
      }

      // Inactivity coupon (30+ days since last visit)
      if (c.lastVisit && daysSince(c.lastVisit) > 30) {
        var hasMissYou = coupons.some(function(cp) { return cp.reason && cp.reason.indexOf("Miss You") !== -1 && !cp.used && cp.expiresAt >= today(); });
        if (!hasMissYou) {
          coupons.push(generateMissYouCoupon());
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        db.collection(COL.customers).doc(doc.id).update({ coupons: coupons });
      }
    });
  } catch(e) {
    console.error("Customer alert engine error:", e);
  }
}

