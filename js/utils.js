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
