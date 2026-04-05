function renderCart() {
  var el = document.getElementById("cart-items");
  var tot = document.getElementById("cart-totals");
  var btn = document.getElementById("confirm-btn");
  if (!el || !tot || !btn) return;

  if (!cart.length) {
    el.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-icon">🛒</div><p>Add items from the left panel.</p></div>';
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
    + '<div class="bill-total-row" style="color:var(--accent)"><span>🎯 Discount</span><span>-' + fmtCurrency(totalDiscount) + '</span></div>'
    + '<div class="bill-total-row"><span>After Discount</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>'
    : '<div class="bill-total-row"><span>Subtotal</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>';

  tot.innerHTML = discountRow
    + '<div class="bill-total-row"><span>CGST</span><span>' + fmtCurrency(summary.totalCGST) + '</span></div>'
    + '<div class="bill-total-row"><span>SGST</span><span>' + fmtCurrency(summary.totalSGST) + '</span></div>'
    + '<div class="bill-total-row grand"><span>Grand Total</span><span>' + fmtCurrency(summary.grandTotal) + '</span></div>';
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
  var billId = "BILL-" + Date.now();
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
    });
    await batch.commit();
    printBill(billId, summary, cartSnapshot, custName, totalDiscount);
    showToast("Bill " + billId + " saved!");
    cart = [];
    renderCart();
    document.getElementById("cust-name").value = "";
    await loadProducts();
  } catch(e) {
    showToast("Error: " + e.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "✅ Confirm & Save Bill";
  }
}

function printBill(billId, summary, items, custName, totalDiscount) {
  var settings = JSON.parse(localStorage.getItem("shopSettings") || "{}");
  var w = window.open("","_blank","width=400,height=600");
  if (!w) { showToast("Pop-up blocked!", "error"); return; }
  var itemsHtml = items.map(function(i) {
    var line = '<div class="row"><span>' + i.name + ' x' + i.qty + '</span><span>Rs.' + (i.price * i.qty).toFixed(2) + '</span></div>';
    if (i.offer && i.price < i.originalPrice) {
      line += '<div style="font-size:10px;color:#E65100;margin-left:4px">' + getOfferLabel(i.offer) + '</div>';
    }
    return line;
  }).join("");
  var discLine = totalDiscount > 0 ? '<div class="row"><span>Discount</span><span>-Rs.' + totalDiscount.toFixed(2) + '</span></div>' : '';
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
  html += '<p style="margin-top:14px">Thank you for shopping!</p>';
  html += '</body></html>';
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

document.addEventListener("DOMContentLoaded", function() {
  buildLayout("Billing");
  var pageContent = document.getElementById("page-content");
  if (pageContent) {
    pageContent.innerHTML =
      '<div class="billing-layout">'
      + '<div class="card" style="padding:0;overflow:hidden">'
      + '<div style="padding:14px 14px 10px;border-bottom:1px solid var(--border)">'
      + '<input type="text" id="search-input" placeholder="🔍 Search products..." oninput="renderProductList(this.value)" style="width:100%"/>'
      + '</div>'
      + '<div id="prod-list" style="max-height:calc(100vh - 220px);overflow-y:auto">'
      + '<div style="padding:16px;color:#888;text-align:center">Loading...</div>'
      + '</div></div>'
      + '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<div class="card"><div class="card-title">🛒 Current Bill</div>'
      + '<div class="form-group" style="margin-bottom:12px"><label>Customer Name (optional)</label>'
      + '<input type="text" id="cust-name" placeholder="Walk-in Customer"/></div>'
      + '<div id="cart-items"></div></div>'
      + '<div class="card"><div class="card-title">💰 Bill Summary</div>'
      + '<div id="cart-totals"></div></div>'
      + '<button class="btn btn-primary" id="confirm-btn" onclick="confirmBill()" disabled style="justify-content:center;padding:13px;font-size:15px">'
      + '✅ Confirm &amp; Save Bill</button>'
      + '</div></div>';
  }
  renderCart();
  loadProducts();
});
