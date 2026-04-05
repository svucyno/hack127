// ── AI Predictive Intelligence Engine ───────────────────────────────────────
var PredictionEngine = (function() {
  function calcDailySalesRate(salesData, productId, days) {
    var since = new Date(); since.setDate(since.getDate() - days);
    var totalQty = 0;
    salesData.forEach(function(sale) {
      var saleDate = sale.dateObj;
      if (saleDate && saleDate.toDate) saleDate = saleDate.toDate();
      if (saleDate >= since) {
        (sale.items || []).forEach(function(item) {
          if (item.id === productId) totalQty += item.qty;
        });
      }
    });
    return totalQty / days;
  }
  function predictStockoutDays(currentQty, dailyRate) {
    if (dailyRate <= 0) return Infinity;
    return Math.floor(currentQty / dailyRate);
  }
  function suggestReorderQty(dailyRate, maxStock, currentQty) {
    var needed = Math.ceil(dailyRate * 30);
    var reorder = Math.max(needed - currentQty, 0);
    return Math.min(reorder, maxStock - currentQty);
  }
  function willExpireUnsold(currentQty, dailyRate, expiryDate) {
    if (!expiryDate || dailyRate <= 0) return false;
    var daysToExpiry = daysUntil(expiryDate);
    if (daysToExpiry <= 0) return true;
    return Math.floor(dailyRate * daysToExpiry) < currentQty;
  }
  function expiryWasteUnits(currentQty, dailyRate, expiryDate) {
    if (!expiryDate) return 0;
    var d = daysUntil(expiryDate);
    if (d <= 0) return currentQty;
    return Math.max(currentQty - Math.floor(dailyRate * d), 0);
  }
  function getDemandTrend(salesData, productId) {
    var now = new Date();
    var recent = new Date(); recent.setDate(now.getDate() - 15);
    var older = new Date(); older.setDate(now.getDate() - 30);
    var recentQty = 0, olderQty = 0;
    salesData.forEach(function(sale) {
      var d = sale.dateObj; if (d && d.toDate) d = d.toDate();
      (sale.items || []).forEach(function(item) {
        if (item.id === productId) {
          if (d >= recent) recentQty += item.qty;
          else if (d >= older) olderQty += item.qty;
        }
      });
    });
    if (recentQty > olderQty * 1.2) return { trend: "increasing", icon: "📈", color: "#3ab87d" };
    if (recentQty < olderQty * 0.8) return { trend: "decreasing", icon: "📉", color: "#e8634f" };
    return { trend: "stable", icon: "➡️", color: "#f0ad4e" };
  }
  async function generatePredictions() {
    var thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    var results = await Promise.all([
      db.collection(COL.products).get(),
      db.collection(COL.sales).where("dateObj", ">=", thirtyDaysAgo).get()
    ]);
    var products = results[0].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
    var salesData = results[1].docs.map(function(d) { return d.data(); });
    var predictions = [];
    products.forEach(function(p) {
      var dailyRate = calcDailySalesRate(salesData, p.id, 30);
      var stockoutDays = predictStockoutDays(p.quantity, dailyRate);
      var reorderQty = suggestReorderQty(dailyRate, p.maxStock || 100, p.quantity);
      var trend = getDemandTrend(salesData, p.id);
      var expireUnsold = willExpireUnsold(p.quantity, dailyRate, p.expiryDate);
      var wasteUnits = expiryWasteUnits(p.quantity, dailyRate, p.expiryDate);
      var alerts = [];
      if (stockoutDays <= 7 && stockoutDays !== Infinity) {
        alerts.push({ type: "stockout", severity: stockoutDays <= 3 ? "critical" : "warning",
          message: p.name + " will run out in ~" + stockoutDays + " days.", icon: "⚡" });
      }
      if (expireUnsold && wasteUnits > 0) {
        alerts.push({ type: "expiry_waste", severity: "warning",
          message: p.name + ": ~" + wasteUnits + " units likely to expire unsold.", icon: "🗑️" });
      }
      predictions.push({ id: p.id, name: p.name, category: p.category, currentQty: p.quantity,
        maxStock: p.maxStock || 100, dailyRate: +dailyRate.toFixed(2), stockoutDays: stockoutDays,
        reorderQty: reorderQty, trend: trend, expireUnsold: expireUnsold, wasteUnits: wasteUnits,
        expiryDate: p.expiryDate, supplierId: p.supplierId, alerts: alerts });
    });
    predictions.sort(function(a, b) {
      if (a.stockoutDays === Infinity && b.stockoutDays === Infinity) return 0;
      if (a.stockoutDays === Infinity) return 1;
      if (b.stockoutDays === Infinity) return -1;
      return a.stockoutDays - b.stockoutDays;
    });
    return predictions;
  }
  return { generatePredictions: generatePredictions };
})();
