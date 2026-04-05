// ── Cart System for Customer (User) Role ────────────────────────────────────
// localStorage-based cart with GST, offers, offline queue

var CartManager = (function() {
  var CART_KEY = "shopsmart_cart";

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function addItem(product, offer) {
    var cart = getCart();
    var existing = cart.find(function(c) { return c.productId === product.id; });
    if (existing) {
      if (existing.qty >= (product.quantity || 999)) {
        if (typeof showToast === "function") showToast("Max stock reached.", "error");
        return cart;
      }
      existing.qty++;
    } else {
      var price = product.sellingPrice;
      var offerApplied = null;
      if (offer) {
        if (offer.type === "percent") price = +(price - price * offer.value / 100).toFixed(2);
        else if (offer.type === "flat") price = +(price - Math.min(offer.value, price)).toFixed(2);
        offerApplied = { id: offer.id, label: (offer.value || 0) + (offer.type === "percent" ? "% OFF" : " OFF"), type: offer.type };
      }
      cart.push({
        productId: product.id,
        name: product.name,
        originalPrice: product.sellingPrice,
        price: price,
        qty: 1,
        gst: product.gst || 0,
        category: product.category || "",
        maxQty: product.quantity || 999,
        offerApplied: offerApplied
      });
    }
    saveCart(cart);
    if (typeof showToast === "function") showToast("✓ " + product.name + " added to cart");
    return cart;
  }

  function updateQty(productId, newQty) {
    var cart = getCart();
    var item = cart.find(function(c) { return c.productId === productId; });
    if (!item) return cart;
    if (newQty <= 0) { return removeItem(productId); }
    if (newQty > item.maxQty) { newQty = item.maxQty; }
    item.qty = newQty;
    saveCart(cart);
    return cart;
  }

  function removeItem(productId) {
    var cart = getCart().filter(function(c) { return c.productId !== productId; });
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
  }

  function getCartSummary() {
    var cart = getCart();
    var subtotal = 0, totalGST = 0, totalDiscount = 0;
    cart.forEach(function(item) {
      var lineTotal = item.price * item.qty;
      var gstAmt = +(lineTotal * item.gst / 100).toFixed(2);
      subtotal += lineTotal;
      totalGST += gstAmt;
      if (item.offerApplied) {
        totalDiscount += (item.originalPrice - item.price) * item.qty;
      }
    });
    return {
      items: cart,
      itemCount: cart.reduce(function(s, i) { return s + i.qty; }, 0),
      subtotal: +subtotal.toFixed(2),
      totalGST: +totalGST.toFixed(2),
      cgst: +(totalGST / 2).toFixed(2),
      sgst: +(totalGST / 2).toFixed(2),
      totalDiscount: +totalDiscount.toFixed(2),
      grandTotal: +(subtotal + totalGST).toFixed(2)
    };
  }

  function updateCartBadge() {
    var badge = document.getElementById("cart-badge");
    if (!badge) return;
    var cart = getCart();
    var count = cart.reduce(function(s, i) { return s + i.qty; }, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }

  // Checkout — create order in Firestore
  async function checkout(userId, userName) {
    var summary = getCartSummary();
    if (!summary.items.length) throw new Error("Cart is empty");

    // Validate stock availability
    var productIds = summary.items.map(function(i) { return i.productId; });
    var stockOk = true;
    for (var i = 0; i < summary.items.length; i++) {
      var item = summary.items[i];
      try {
        var doc = await db.collection(COL.products).doc(item.productId).get();
        if (!doc.exists || (doc.data().quantity || 0) < item.qty) {
          stockOk = false;
          if (typeof showToast === "function") showToast(item.name + " is out of stock or insufficient.", "error");
          break;
        }
      } catch(e) { /* offline — proceed optimistically */ }
    }

    var orderId = "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    var orderData = {
      orderId: orderId,
      userId: userId,
      customerName: userName || "Customer",
      date: today(),
      dateObj: new Date(),
      items: summary.items.map(function(i) {
        return { id: i.productId, name: i.name, qty: i.qty, price: i.price, originalPrice: i.originalPrice, gst: i.gst, category: i.category, offerApplied: i.offerApplied };
      }),
      subtotal: summary.subtotal,
      totalGST: summary.totalGST,
      cgst: summary.cgst,
      sgst: summary.sgst,
      totalDiscount: summary.totalDiscount,
      grandTotal: summary.grandTotal,
      status: "Not Started",
      isPreOrder: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      var batch = db.batch();
      batch.set(db.collection(COL.sales).doc(orderId), orderData);
      // Decrement stock
      summary.items.forEach(function(item) {
        batch.update(db.collection(COL.products).doc(item.productId), {
          quantity: firebase.firestore.FieldValue.increment(-item.qty),
          salesCount30: firebase.firestore.FieldValue.increment(item.qty)
        });
      });
      await batch.commit();
      clearCart();
      return orderId;
    } catch(e) {
      // Offline — queue in IndexedDB
      if (typeof OfflineManager !== "undefined") {
        await OfflineManager.queueWrite({ collection: COL.sales, docId: orderId, type: "set", data: orderData });
        clearCart();
        return orderId;
      }
      throw e;
    }
  }

  // Pre-order (10 min before arrival)
  async function preOrder(userId, userName, arrivalMinutes) {
    var summary = getCartSummary();
    if (!summary.items.length) throw new Error("Cart is empty");
    var orderId = "PRE-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    var arrivalTime = new Date(Date.now() + (arrivalMinutes || 10) * 60000);
    var orderData = {
      orderId: orderId, userId: userId, customerName: userName || "Customer",
      date: today(), dateObj: new Date(),
      items: summary.items.map(function(i) { return { id: i.productId, name: i.name, qty: i.qty, price: i.price, originalPrice: i.originalPrice, gst: i.gst, category: i.category, offerApplied: i.offerApplied }; }),
      subtotal: summary.subtotal, totalGST: summary.totalGST, cgst: summary.cgst, sgst: summary.sgst,
      totalDiscount: summary.totalDiscount, grandTotal: summary.grandTotal,
      status: "Not Started", isPreOrder: true, estimatedArrival: arrivalTime,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection(COL.sales).doc(orderId).set(orderData);
    clearCart();
    return orderId;
  }

  return {
    getCart: getCart, addItem: addItem, updateQty: updateQty, removeItem: removeItem,
    clearCart: clearCart, getCartSummary: getCartSummary, updateCartBadge: updateCartBadge,
    checkout: checkout, preOrder: preOrder
  };
})();
