var products = [], cart = [], activeOffers = [], billingCatFilter = "";

async function loadProducts() {
  try {
    var results = await Promise.all([
      db.collection(COL.products).orderBy("name").get(),
      db.collection(COL.offers).where("active", "==", true).get()
    ]);
    products = results[0].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });

    // Filter to only valid (not expired) offers
    var todayStr = today();
    activeOffers = results[1].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); })
      .filter(function(o) { return !o.validUntil || o.validUntil >= todayStr; });

    renderProductList();
    renderBillCatNav();
  } catch(e) {
    console.error("Load products error:", e);
    var el = document.getElementById("prod-list");
    if (el) el.innerHTML = '<div style="padding:16px;color:var(--red);text-align:center">Could not load products. Please refresh.</div>';
  }
}

function getOfferForProduct(productId) {
  return activeOffers.find(function(o) {
    if (o.productId !== productId) return false;
    // Skip if limited qty offer is sold out
    if (o.maxQty && (o.soldQty || 0) >= o.maxQty) return false;
    return true;
  }) || null;
}

function calcDiscountedPrice(originalPrice, offer) {
  if (!offer) return originalPrice;
  if (offer.type === "percent") {
    var disc = +(originalPrice * offer.value / 100).toFixed(2);
    return +(originalPrice - disc).toFixed(2);
  }
  if (offer.type === "flat") {
    // Cap discount at the product price — never go below ₹0
    var flatDisc = Math.min(offer.value, originalPrice);
    return +(originalPrice - flatDisc).toFixed(2);
  }
  return originalPrice;
}

function getOfferLabel(offer) {
  if (!offer) return "";
  if (offer.type === "percent") return offer.value + "% OFF";
  if (offer.type === "flat") return "₹" + offer.value + " OFF";
  if (offer.type === "bxgy") return "Buy " + offer.buyQty + " Get " + offer.getQty + " Free";
  return "";
}

function renderProductList(q) {
  var list = products;
  if (billingCatFilter) list = list.filter(function(p) { return p.category === billingCatFilter; });
  if (q) list = list.filter(function(p) { return p.name.toLowerCase().includes(q.toLowerCase()); });
  var el = document.getElementById("prod-list");
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div style="padding:16px;color:#888;text-align:center">No products found.</div>'; return; }
  el.innerHTML = list.map(function(p) {
    var offer = getOfferForProduct(p.id);
    var discPrice = calcDiscountedPrice(p.sellingPrice, offer);
    var offerBadge = offer ? '<div style="font-size:10px;font-weight:700;color:var(--accent);margin-top:2px">🎯 ' + getOfferLabel(offer) + '</div>' : '';
    var priceHtml;
    if (offer && discPrice < p.sellingPrice) {
      priceHtml = '<div style="font-weight:700;color:var(--green)">' + fmtCurrency(discPrice) + ' <span style="text-decoration:line-through;color:#aaa;font-weight:400;font-size:11px">' + fmtCurrency(p.sellingPrice) + '</span></div>';
    } else {
      priceHtml = '<div style="font-weight:700;color:var(--green)">' + fmtCurrency(p.sellingPrice) + '</div>';
    }
    return '<div class="prod-row" onclick="addToCart(\'' + p.id + '\')" style="display:flex;align-items:center;padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--green-p2);gap:10px">'
      + '<div style="flex:1"><div style="font-weight:600;font-size:13px">' + p.name + '</div>'
      + '<div style="font-size:11px;color:#888">' + p.category + ' · ' + (p.size||'') + ' · GST ' + (p.gst||0) + '%</div>'
      + offerBadge + '</div>'
      + '<div style="text-align:right">' + priceHtml
      + '<div style="font-size:11px;color:#888">Stock: ' + p.quantity + '</div></div></div>';
  }).join("");
}

function addToCart(id) {
  var p = products.find(function(x) { return x.id === id; });
  if (!p) return;
  if (p.quantity <= 0) { showToast(t("bill.out_of_stock"), "error"); return; }
  var existing = cart.find(function(c) { return c.id === id; });
  if (existing) {
    if (existing.qty >= p.quantity) { showToast(t("bill.max_stock"), "error"); return; }
    existing.qty++;
  } else {
    var offer = getOfferForProduct(p.id);
    var effectivePrice = calcDiscountedPrice(p.sellingPrice, offer);
    cart.push({
      id: p.id, name: p.name,
      originalPrice: p.sellingPrice,
      price: effectivePrice,
      cost: p.costPrice, qty: 1,
      gst: p.gst || 0, category: p.category,
      maxQty: p.quantity,
      offer: offer
    });
  }
  renderCart();
}

function changeQty(id, delta) {
  var item = cart.find(function(c) { return c.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(function(c) { return c.id !== id; });
  if (item.qty > item.maxQty) { item.qty = item.maxQty; showToast(t("bill.max_stock"),"error"); }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(function(c) { return c.id !== id; });
  renderCart();
}

function renderBillCatNav() {
  var el = document.getElementById("bill-cat-nav");
  if (el && typeof buildCatNav === "function") {
    el.innerHTML = buildCatNav(
      ["Groceries","Dairy","Beverages","Personal Care","Stationery","Electronics","Snacks","Medicines","Cleaning","Other"],
      products, billingCatFilter, "selectBillCat"
    );
  }
}

function selectBillCat(cat) {
  billingCatFilter = cat;
  renderBillCatNav();
  var q = document.getElementById("search-input");
  renderProductList(q ? q.value : "");
}

function addToCartByBarcode(code) {
  var p = products.find(function(x) { return x.barcode === code; });
  if (p) {
    addToCart(p.id);
    showToast("✓ " + p.name + " added");
  } else {
    showToast("Product not found. Try searching manually.", "error");
  }
}

function openBillingScanner() {
  BarcodeScanner.open({
    continuous: true,
    onScan: function(code) {
      addToCartByBarcode(code);
    }
  });
}

function checkUrlParams() {
  var params = new URLSearchParams(window.location.search);
  var productId = params.get("productId");
  if (productId) {
    setTimeout(function() { addToCart(productId); }, 500);
  }
}
