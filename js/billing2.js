function renderCart() {
  var el = document.getElementById("cart-items");
  var tot = document.getElementById("cart-totals");
  var btn = document.getElementById("confirm-btn");
  if (!el || !tot || !btn) return;

  if (!cart.length) {
    el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🛒</div><p>' + t("bill.add_items") + '</p></div>';
    tot.innerHTML = "";
    btn.disabled = true;
    return;
  }
  btn.disabled = false;

  el.innerHTML = cart.map(function(item) {
    var g = calcGST(item.price, item.qty, item.gst);
    var gstLine = item.gst ? '<div style="font-size:10px;color:#888">CGST ' + fmtCurrency(g.cgst) + ' + SGST ' + fmtCurrency(g.sgst) + '</div>' : '';
    var discountLine = '';
    if (item.offer && item.price < item.originalPrice) {
      var saved = ((item.originalPrice - item.price) * item.qty).toFixed(2);
      discountLine = '<div style="font-size:10px;color:var(--accent);font-weight:600">🎯 ' + getOfferLabel(item.offer) + ' — Saved ' + fmtCurrency(saved) + '</div>';
    }
    var priceDisplay;
    if (item.offer && item.price < item.originalPrice) {
      priceDisplay = fmtCurrency(item.price) + ' <span style="text-decoration:line-through;color:#aaa;font-size:11px">' + fmtCurrency(item.originalPrice) + '</span>';
    } else {
      priceDisplay = fmtCurrency(item.price);
    }
    return '<div class="cart-item"><div style="flex:1">'
      + '<div class="cart-item-name">' + item.name + '</div>'
      + '<div class="cart-item-price">' + priceDisplay + ' x ' + item.qty + ' = ' + fmtCurrency(g.subtotal) + '</div>'
      + discountLine
      + gstLine + '</div>'
      + '<div class="qty-ctrl">'
      + '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',-1)">-</button>'
      + '<span style="font-weight:700;min-width:20px;text-align:center">' + item.qty + '</span>'
      + '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',1)">+</button>'
      + '<button class="btn-icon" onclick="removeFromCart(\'' + item.id + '\')">🗑️</button>'
      + '</div></div>';
  }).join("");

  var summary = calcBillGST(cart);

  // Calculate total discount (informational — already reflected in prices)
  var totalDiscount = cart.reduce(function(sum, item) {
    if (item.offer && item.price < item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.qty;
    }
    return sum;
  }, 0);

  // Show original subtotal before discount, then discount, then discounted totals
  var originalSubtotal = cart.reduce(function(sum, item) {
    return sum + (item.originalPrice || item.price) * item.qty;
  }, 0);

  var discountRow = totalDiscount > 0
    ? '<div class="bill-total-row"><span>MRP Total</span><span>' + fmtCurrency(originalSubtotal) + '</span></div>'
    + '<div class="bill-total-row" style="color:var(--accent)"><span>🎯 ' + t("bill.discount") + '</span><span>-' + fmtCurrency(totalDiscount) + '</span></div>'
    + '<div class="bill-total-row"><span>After Discount</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>'
    : '<div class="bill-total-row"><span>' + t("bill.subtotal") + '</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>';

  tot.innerHTML = discountRow
    + '<div class="bill-total-row"><span>CGST</span><span>' + fmtCurrency(summary.totalCGST) + '</span></div>'
    + '<div class="bill-total-row"><span>SGST</span><span>' + fmtCurrency(summary.totalSGST) + '</span></div>'
    + '<div class="bill-total-row grand"><span>' + t("bill.grand_total") + '</span><span>' + fmtCurrency(summary.grandTotal) + '</span></div>';
}

async function confirmBill() {
  if (!cart.length) return;
  var btn = document.getElementById("confirm-btn");
  btn.disabled = true; btn.textContent = "Processing...";
  var summary = calcBillGST(cart);
  var totalDiscount = cart.reduce(function(sum, item) {
    if (item.offer && item.price < item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.qty;
    }
    return sum;
  }, 0);
  var profit = cart.reduce(function(s, i) { return s + (i.price - i.cost) * i.qty; }, 0);
  // Sequential bill number from Firestore counter
  var billId;
  try {
    var counterRef = db.collection("settings").doc("billCounter");
    var counterDoc = await counterRef.get();
    var nextNum = counterDoc.exists ? (counterDoc.data().count || 0) + 1 : 1;
    await counterRef.set({ count: nextNum });
    billId = "BILL-" + String(nextNum).padStart(5, "0");
  } catch(e) {
    billId = "BILL-" + Date.now(); // fallback
  }
  var dateStr = today();
  var nowTs = firebase.firestore.FieldValue.serverTimestamp();
  var cartSnapshot = cart.map(function(i) { return Object.assign({}, i); });
  var custName = document.getElementById("cust-name").value.trim() || "Walk-in";
  try {
    var batch = db.batch();
    var saleRef = db.collection(COL.sales).doc(billId);
    batch.set(saleRef, {
      billId: billId, date: dateStr, dateObj: new Date(), customerName: custName,
      items: cart.map(function(i) {
        return {
          id: i.id, name: i.name, qty: i.qty,
          originalPrice: i.originalPrice || i.price,
          price: i.price, cost: i.cost,
          gst: i.gst, category: i.category,
          offerId: i.offer ? i.offer.id : null,
          offerLabel: i.offer ? getOfferLabel(i.offer) : null
        };
      }),
      subtotal: summary.subtotal, totalCGST: summary.totalCGST, totalSGST: summary.totalSGST,
      totalDiscount: +totalDiscount.toFixed(2),
      grandTotal: summary.grandTotal, profit: +profit.toFixed(2), createdAt: nowTs
    });
    cart.forEach(function(item) {
      var ref = db.collection(COL.products).doc(item.id);
      batch.update(ref, { quantity: firebase.firestore.FieldValue.increment(-item.qty), salesCount30: firebase.firestore.FieldValue.increment(item.qty) });
      // Update offer soldQty if limited quantity offer
      if (item.offer && item.offer.id && item.offer.maxQty) {
        var offerRef = db.collection(COL.offers).doc(item.offer.id);
        batch.update(offerRef, { soldQty: firebase.firestore.FieldValue.increment(item.qty) });
      }
    });
    await batch.commit();
    printBill(billId, summary, cartSnapshot, custName, totalDiscount);
    showToast("Bill " + billId + " saved!");
    cart = [];
    renderCart();
    document.getElementById("cust-name").value = "";
    await loadProducts();
  } catch(e) {
    showToast(friendlyError(e), "error");
  } finally {
    btn.disabled = false; btn.textContent = "✅ Confirm & Save Bill";
  }
}

function printBill(billId, summary, items, custName, totalDiscount) {
  var settings = JSON.parse(localStorage.getItem("shopSettings") || "{}");
  var w = window.open("","_blank","width=400,height=600");
  if (!w) { showToast("Please allow pop-ups to print the bill.", "error"); return; }
  var itemsHtml = items.map(function(i) {
    var line = '<div class="row"><span>' + i.name + ' x' + i.qty + '</span><span>Rs.' + (i.price * i.qty).toFixed(2) + '</span></div>';
    if (i.offer && i.price < i.originalPrice) {
      line += '<div style="font-size:10px;color:#E65100;margin-left:4px">' + getOfferLabel(i.offer) + '</div>';
    }
    return line;
  }).join("");
  var discLine = totalDiscount > 0 ? '<div class="row"><span>' + (typeof t === "function" ? t("bill.discount") : "Discount") + '</span><span>-Rs.' + totalDiscount.toFixed(2) + '</span></div>' : '';
  var html = '<html><head><title>Bill</title>';
  html += '<style>body{font-family:monospace;font-size:13px;padding:20px;max-width:320px}';
  html += 'h2{text-align:center;margin:0}p{text-align:center;color:#555;margin:2px 0}';
  html += 'hr{border:1px dashed #ccc;margin:10px 0}';
  html += '.row{display:flex;justify-content:space-between;margin:4px 0}';
  html += '.total{font-weight:bold;font-size:15px}</style></head><body>';
  html += '<h2>' + (settings.shopName || "ShopSmart") + '</h2>';
  html += '<p>' + (settings.address || "") + '</p>';
  html += '<p>GST: ' + (settings.gstNumber || "N/A") + '</p><hr/>';
  html += '<div class="row"><span>Bill #</span><span>' + billId + '</span></div>';
  html += '<div class="row"><span>Date</span><span>' + today() + '</span></div>';
  html += '<div class="row"><span>Customer</span><span>' + custName + '</span></div><hr/>';
  html += itemsHtml + '<hr/>';
  html += '<div class="row"><span>Subtotal</span><span>Rs.' + summary.subtotal + '</span></div>';
  html += discLine;
  html += '<div class="row"><span>CGST</span><span>Rs.' + summary.totalCGST + '</span></div>';
  html += '<div class="row"><span>SGST</span><span>Rs.' + summary.totalSGST + '</span></div><hr/>';
  html += '<div class="row total"><span>GRAND TOTAL</span><span>Rs.' + summary.grandTotal + '</span></div><hr/>';
  html += '<p style="margin-top:14px">' + (typeof t === "function" ? t("bill.thank_you") : "Thank you for shopping!") + '</p>';
  html += '</body></html>';
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

document.addEventListener("DOMContentLoaded", function() {
  buildLayout(t("bill.title"));
  var pageContent = document.getElementById("page-content");
  if (pageContent) {
    pageContent.innerHTML =
      '<div class="billing-layout">'
      + '<div style="display:flex;flex-direction:column;gap:0">'
      + '<div id="bill-cat-nav" style="padding:0 0 14px;overflow:visible"></div>'
      + '<div class="card" style="padding:0;overflow:hidden">'
      + '<div style="padding:14px 14px 10px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">'
      + '<input type="text" id="search-input" placeholder="🔍 ' + t("bill.search") + '" oninput="renderProductList(this.value)" style="flex:1"/>'
      + '<button class="btn btn-sm btn-outline" onclick="openBillingScanner()" title="Scan barcode">📷 ' + t("bill.scan") + '</button>'
      + '</div>'
      + '<div id="prod-list" style="max-height:calc(100vh - 300px);overflow-y:auto">'
      + '<div style="padding:16px;color:#888;text-align:center">Loading...</div>'
      + '</div></div></div>'
      + '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<div class="card"><div class="card-title">🛒 ' + t("bill.cart") + '</div>'
      + '<div class="form-group" style="margin-bottom:12px"><label>' + t("bill.customer") + '</label>'
      + '<input type="text" id="cust-name" placeholder="' + t("bill.walkin") + '"/></div>'
      + '<div id="cart-items"></div></div>'
      + '<div class="card"><div class="card-title">💰 ' + t("bill.summary") + '</div>'
      + '<div id="cart-totals"></div></div>'
      + '<button class="btn btn-primary" id="confirm-btn" onclick="confirmBill()" disabled style="justify-content:center;padding:13px;font-size:15px">'
      + '✅ ' + t("bill.confirm") + '</button>'
      + '</div></div>';
  }
  renderCart();
  loadProducts().then(function() { checkUrlParams(); });
});
