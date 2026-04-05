function getCouponDiscount(grandTotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.minPurchase && grandTotal < appliedCoupon.minPurchase) return 0;
  if (appliedCoupon.type === "percentage") {
    return +(grandTotal * appliedCoupon.discount / 100).toFixed(2);
  }
  if (appliedCoupon.type === "flat") {
    return Math.min(appliedCoupon.discount, grandTotal);
  }
  return 0;
}

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

  // Calculate total offer discount (already reflected in prices)
  var totalDiscount = cart.reduce(function(sum, item) {
    if (item.offer && item.price < item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.qty;
    }
    return sum;
  }, 0);

  var originalSubtotal = cart.reduce(function(sum, item) {
    return sum + (item.originalPrice || item.price) * item.qty;
  }, 0);

  // Coupon discount
  var couponDisc = getCouponDiscount(summary.grandTotal);
  // Points redemption (cap at grandTotal after coupon)
  var maxRedeem = Math.min(redeemPoints * POINT_VALUE, summary.grandTotal - couponDisc);
  if (maxRedeem < 0) maxRedeem = 0;
  var finalTotal = +(summary.grandTotal - couponDisc - maxRedeem).toFixed(2);
  if (finalTotal < 0) finalTotal = 0;

  var discountRow = totalDiscount > 0
    ? '<div class="bill-total-row"><span>MRP Total</span><span>' + fmtCurrency(originalSubtotal) + '</span></div>'
    + '<div class="bill-total-row" style="color:var(--accent)"><span>🎯 Discount</span><span>-' + fmtCurrency(totalDiscount) + '</span></div>'
    + '<div class="bill-total-row"><span>After Discount</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>'
    : '<div class="bill-total-row"><span>Subtotal</span><span>' + fmtCurrency(summary.subtotal) + '</span></div>';

  var couponRow = couponDisc > 0
    ? '<div class="bill-total-row" style="color:var(--mint)"><span>🎫 Coupon (' + appliedCoupon.code + ')</span><span>-' + fmtCurrency(couponDisc) + '</span></div>'
    : '';

  var pointsRow = maxRedeem > 0
    ? '<div class="bill-total-row" style="color:var(--cyan)"><span>🪙 Points Redeemed (' + redeemPoints + ' pts)</span><span>-' + fmtCurrency(maxRedeem) + '</span></div>'
    : '';

  // Show coupon warning if min not met
  var couponWarn = '';
  if (appliedCoupon && appliedCoupon.minPurchase && summary.grandTotal < appliedCoupon.minPurchase) {
    couponWarn = '<div style="font-size:11px;color:var(--red);padding:4px 0">⚠️ Min purchase ₹' + appliedCoupon.minPurchase + ' required for this coupon.</div>';
  }

  tot.innerHTML = discountRow
    + '<div class="bill-total-row"><span>CGST</span><span>' + fmtCurrency(summary.totalCGST) + '</span></div>'
    + '<div class="bill-total-row"><span>SGST</span><span>' + fmtCurrency(summary.totalSGST) + '</span></div>'
    + couponWarn + couponRow + pointsRow
    + '<div class="bill-total-row grand"><span>Grand Total</span><span>' + fmtCurrency(finalTotal) + '</span></div>';
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
  var custName = "";
  var custPhone = "";

  if (billingCustomer) {
    custName = billingCustomer.name;
    custPhone = billingCustomer.phone;
  } else {
    custName = (document.getElementById("cust-name") || {}).value || "Walk-in";
    custPhone = (document.getElementById("cust-phone") || {}).value || "";
  }

  // Calculate coupon and points deductions
  var couponDisc = getCouponDiscount(summary.grandTotal);
  var maxRedeem = Math.min(redeemPoints * POINT_VALUE, summary.grandTotal - couponDisc);
  if (maxRedeem < 0) maxRedeem = 0;
  var finalTotal = +(summary.grandTotal - couponDisc - maxRedeem).toFixed(2);
  if (finalTotal < 0) finalTotal = 0;

  // Points earned on this purchase (on final total)
  var pointsEarned = calcPoints(finalTotal);

  try {
    var batch = db.batch();
    var saleRef = db.collection(COL.sales).doc(billId);
    batch.set(saleRef, {
      billId: billId, date: dateStr, dateObj: new Date(), customerName: custName,
      customerPhone: custPhone,
      customerId: billingCustomer ? billingCustomer.id : "",
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
      couponDiscount: couponDisc,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      pointsRedeemed: redeemPoints,
      pointsDiscount: maxRedeem,
      pointsEarned: pointsEarned,
      grandTotal: finalTotal, profit: +profit.toFixed(2), createdAt: nowTs
    });
    cart.forEach(function(item) {
      var ref = db.collection(COL.products).doc(item.id);
      batch.update(ref, { quantity: firebase.firestore.FieldValue.increment(-item.qty), salesCount30: firebase.firestore.FieldValue.increment(item.qty) });
    });
    await batch.commit();

    // ── Update customer loyalty data ──────────────────────────────────
    var newBalance = 0;
    if (billingCustomer) {
      var custRef = db.collection(COL.customers).doc(billingCustomer.id);
      var oldPoints = billingCustomer.loyaltyPoints || 0;
      var oldLifetime = billingCustomer.lifetimePoints || 0;
      var oldTier = billingCustomer.tier || "Bronze";
      var oldVisits = billingCustomer.totalVisits || 0;
      newBalance = oldPoints - redeemPoints + pointsEarned;
      var newLifetime = oldLifetime + pointsEarned;
      var newTierInfo = getTier(newLifetime);
      var newVisits = oldVisits + 1;

      var updateData = {
        totalSpent: firebase.firestore.FieldValue.increment(finalTotal),
        totalVisits: firebase.firestore.FieldValue.increment(1),
        loyaltyPoints: newBalance,
        lifetimePoints: newLifetime,
        tier: newTierInfo.name,
        lastVisit: dateStr
      };

      // Mark coupon as used
      if (appliedCoupon && couponDisc > 0) {
        var updatedCoupons = (billingCustomer.coupons || []).map(function(cp) {
          if (cp.code === appliedCoupon.code) {
            return Object.assign({}, cp, { used: true });
          }
          return cp;
        });
        updateData.coupons = updatedCoupons;
      }

      // Check tier upgrade → generate coupon
      if (newTierInfo.name !== oldTier && newTierInfo.name !== "Bronze") {
        var tierCoupon = generateCoupon(newTierInfo.name);
        if (tierCoupon) {
          var coupArr = updateData.coupons || billingCustomer.coupons || [];
          coupArr.push(tierCoupon);
          updateData.coupons = coupArr;
          showToast("🎉 " + billingCustomer.name + " upgraded to " + newTierInfo.name + "! Coupon issued: " + tierCoupon.code, "info");
        }
      }

      // Milestone coupon (every 10th visit)
      if (newVisits % 10 === 0) {
        var mileCoupon = generateMilestoneCoupon(newVisits);
        var coupArr2 = updateData.coupons || billingCustomer.coupons || [];
        coupArr2.push(mileCoupon);
        updateData.coupons = coupArr2;
        showToast("🎉 " + newVisits + " visits milestone! ₹100 OFF coupon issued!", "info");
      }

      await custRef.update(updateData);
      showToast("🪙 " + billingCustomer.name + " earned " + pointsEarned + " points! Balance: " + newBalance + " pts");
    } else if (custPhone && /^\d{10}$/.test(custPhone) && !isWalkIn) {
      // New customer — auto-create
      try {
        await db.collection(COL.customers).add({
          name: custName || "Customer",
          phone: custPhone,
          email: "",
          birthday: "",
          totalSpent: finalTotal,
          totalVisits: 1,
          loyaltyPoints: pointsEarned,
          lifetimePoints: pointsEarned,
          tier: getTier(pointsEarned).name,
          coupons: [],
          lastVisit: dateStr,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        newBalance = pointsEarned;
        showToast("New customer saved! Earned " + pointsEarned + " points 🪙");
      } catch(e2) {
        console.error("Auto-create customer error:", e2);
      }
    }

    printBill(billId, summary, cartSnapshot, custName, totalDiscount, couponDisc, maxRedeem, pointsEarned, newBalance);
    showToast("Bill " + billId + " saved!");
    cart = [];
    billingCustomer = null; appliedCoupon = null; redeemPoints = 0; isWalkIn = false;
    renderCart();
    if (document.getElementById("cust-name")) document.getElementById("cust-name").value = "";
    if (document.getElementById("cust-phone")) document.getElementById("cust-phone").value = "";
    if (document.getElementById("cust-info")) document.getElementById("cust-info").innerHTML = "";
    if (document.getElementById("cust-coupon-area")) document.getElementById("cust-coupon-area").innerHTML = "";
    if (document.getElementById("cust-points-area")) document.getElementById("cust-points-area").innerHTML = "";
    var walkinCb = document.getElementById("walkin-toggle");
    if (walkinCb) walkinCb.checked = false;
    await loadProducts();
  } catch(e) {
    showToast("Error: " + e.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = "✅ Confirm & Save Bill";
  }
}

function printBill(billId, summary, items, custName, totalDiscount, couponDisc, pointsDisc, pointsEarned, newBalance) {
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
  var discLine = totalDiscount > 0 ? '<div class="row"><span>Offer Discount</span><span>-Rs.' + totalDiscount.toFixed(2) + '</span></div>' : '';
  var couponLine = (couponDisc || 0) > 0 ? '<div class="row"><span>Coupon Discount</span><span>-Rs.' + couponDisc.toFixed(2) + '</span></div>' : '';
  var pointsLine = (pointsDisc || 0) > 0 ? '<div class="row"><span>Points Redeemed</span><span>-Rs.' + pointsDisc.toFixed(2) + '</span></div>' : '';
  var finalTotal = +(summary.grandTotal - (couponDisc || 0) - (pointsDisc || 0)).toFixed(2);
  if (finalTotal < 0) finalTotal = 0;

  var loyaltyLine = '';
  if (pointsEarned > 0) {
    loyaltyLine = '<hr/><div style="text-align:center;font-size:12px;margin:8px 0">'
      + '🪙 Points Earned: <b>' + pointsEarned + '</b><br>'
      + 'New Balance: <b>' + (newBalance || 0) + ' pts</b>'
      + '</div>';
  }

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
  html += '<div class="row"><span>SGST</span><span>Rs.' + summary.totalSGST + '</span></div>';
  html += couponLine + pointsLine + '<hr/>';
  html += '<div class="row total"><span>GRAND TOTAL</span><span>Rs.' + finalTotal + '</span></div>';
  html += loyaltyLine;
  html += '<hr/><p style="margin-top:14px">Thank you for shopping!</p>';
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
      + '<div style="padding:14px 14px 10px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">'
      + '<input type="text" id="search-input" placeholder="🔍 Search products..." oninput="renderProductList(this.value)" style="flex:1"/>'
      + '<button class="btn-scan" onclick="scanBillingBarcode()" title="Scan barcode to add to cart">📷 Scan</button>'
      + '</div>'
      + '<div id="prod-list" style="max-height:calc(100vh - 220px);overflow-y:auto">'
      + '<div style="padding:16px;color:#888;text-align:center">Loading...</div>'
      + '</div></div>'
      + '<div style="display:flex;flex-direction:column;gap:14px">'

      // Customer section
      + '<div class="customer-billing-section">'
      + '<div class="card-title">👤 Customer</div>'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      + '<input type="text" id="cust-phone" placeholder="📱 Phone (10 digits)" maxlength="10" oninput="lookupCustomer(this.value)" style="flex:1"/>'
      + '<label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer"><input type="checkbox" id="walkin-toggle" onchange="toggleWalkIn()"/> Walk-in</label>'
      + '</div>'
      + '<input type="text" id="cust-name" placeholder="Customer Name (optional)" style="margin-bottom:6px"/>'
      + '<div id="cust-info"></div>'
      + '<div id="cust-coupon-area"></div>'
      + '<div id="cust-points-area"></div>'
      + '</div>'

      + '<div class="card"><div class="card-title">🛒 Current Bill</div>'
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
