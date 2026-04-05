// ── AI Predictive Intelligence Engine v2 ────────────────────────────────────
// Weighted moving average, weekly patterns, confidence scores, seasonal flags
var PredictionEngine = (function() {

  // Build daily sales map for a product: { "2026-04-01": 5, "2026-04-02": 0, ... }
  function buildDailySalesMap(salesData, productId, days) {
    var map = {};
    var now = new Date();
    for (var i = 0; i < days; i++) {
      var d = new Date(); d.setDate(now.getDate() - i);
      map[d.toISOString().split("T")[0]] = 0;
    }
    salesData.forEach(function(sale) {
      var sd = sale.dateObj;
      if (sd && sd.toDate) sd = sd.toDate();
      if (!sd) return;
      var key = sd.toISOString().split("T")[0];
      if (map[key] !== undefined) {
        (sale.items || []).forEach(function(item) {
          if (item.id === productId) map[key] += item.qty;
        });
      }
    });
    return map;
  }

  // Weighted moving average: recent days count more
  // Weights: last 7 days = 3x, 8-14 days = 2x, 15-30 days = 1x
  function calcWeightedDailyRate(dailyMap) {
    var now = new Date();
    var totalWeighted = 0, totalWeight = 0;
    Object.keys(dailyMap).forEach(function(dateStr) {
      var daysAgo = Math.floor((now - new Date(dateStr)) / 86400000);
      var weight = daysAgo <= 7 ? 3 : daysAgo <= 14 ? 2 : 1;
      totalWeighted += dailyMap[dateStr] * weight;
      totalWeight += weight;
    });
    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  }

  // Detect weekly pattern: which day of week sells most/least
  function detectWeeklyPattern(dailyMap) {
    var dayTotals = [0,0,0,0,0,0,0]; // Sun=0 to Sat=6
    var dayCounts = [0,0,0,0,0,0,0];
    Object.keys(dailyMap).forEach(function(dateStr) {
      var dow = new Date(dateStr).getDay();
      dayTotals[dow] += dailyMap[dateStr];
      dayCounts[dow]++;
    });
    var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var dayAvgs = dayTotals.map(function(t,i) { return dayCounts[i] > 0 ? t / dayCounts[i] : 0; });
    var maxDay = 0, minDay = 0;
    dayAvgs.forEach(function(avg, i) {
      if (avg > dayAvgs[maxDay]) maxDay = i;
      if (avg < dayAvgs[minDay]) minDay = i;
    });
    var overallAvg = dayAvgs.reduce(function(s,v){return s+v;},0) / 7;
    var hasClearPattern = overallAvg > 0 && (dayAvgs[maxDay] > overallAvg * 1.5 || dayAvgs[minDay] < overallAvg * 0.5);
    return {
      peakDay: dayNames[maxDay],
      lowDay: dayNames[minDay],
      peakAvg: +dayAvgs[maxDay].toFixed(1),
      lowAvg: +dayAvgs[minDay].toFixed(1),
      hasPattern: hasClearPattern
    };
  }

  // Confidence score: how reliable is this prediction?
  function calcConfidence(dailyMap, totalDaysWithData) {
    var daysWithSales = Object.values(dailyMap).filter(function(v){return v > 0;}).length;
    var totalDays = Object.keys(dailyMap).length;
    if (totalDays === 0) return { score: 0, label: "No data", color: "#888" };
    var ratio = daysWithSales / totalDays;
    if (ratio >= 0.6 && totalDays >= 14) return { score: 90, label: "High", color: "#3ab87d" };
    if (ratio >= 0.3 && totalDays >= 7) return { score: 60, label: "Medium", color: "#f0ad4e" };
    if (daysWithSales >= 3) return { score: 35, label: "Low", color: "#e8634f" };
    return { score: 10, label: "Very low", color: "#888" };
  }

  // Seasonal flag: did this product spike in the same period last month?
  function detectSeasonalSpike(salesData, productId) {
    var now = new Date();
    var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    var thisMonthQty = 0, lastMonthQty = 0;
    salesData.forEach(function(sale) {
      var sd = sale.dateObj; if (sd && sd.toDate) sd = sd.toDate(); if (!sd) return;
      (sale.items || []).forEach(function(item) {
        if (item.id !== productId) return;
        if (sd >= thisMonthStart) thisMonthQty += item.qty;
        else if (sd >= lastMonthStart && sd <= lastMonthEnd) lastMonthQty += item.qty;
      });
    });
    if (lastMonthQty > 0 && thisMonthQty > lastMonthQty * 1.5) {
      return { isSeasonal: true, message: "Demand up " + Math.round((thisMonthQty/lastMonthQty - 1)*100) + "% vs last month" };
    }
    return { isSeasonal: false, message: "" };
  }

  function predictStockoutDays(qty, rate) { return rate <= 0 ? Infinity : Math.floor(qty / rate); }

  function suggestReorderQty(rate, maxStock, currentQty) {
    var needed = Math.ceil(rate * 30);
    return Math.max(Math.min(needed - currentQty, maxStock - currentQty), 0);
  }

  function willExpireUnsold(qty, rate, expiryDate) {
    if (!expiryDate || rate <= 0) return false;
    var d = typeof daysUntil === "function" ? daysUntil(expiryDate) : Infinity;
    return d > 0 && Math.floor(rate * d) < qty;
  }

  function expiryWasteUnits(qty, rate, expiryDate) {
    if (!expiryDate) return 0;
    var d = typeof daysUntil === "function" ? daysUntil(expiryDate) : 0;
    if (d <= 0) return qty;
    return Math.max(qty - Math.floor(rate * d), 0);
  }

  function getDemandTrend(dailyMap) {
    var keys = Object.keys(dailyMap).sort();
    var half = Math.floor(keys.length / 2);
    var recent = 0, older = 0;
    keys.forEach(function(k, i) { if (i >= half) recent += dailyMap[k]; else older += dailyMap[k]; });
    if (recent > older * 1.2) return { trend: "increasing", icon: "📈", color: "#3ab87d" };
    if (recent < older * 0.8) return { trend: "decreasing", icon: "📉", color: "#e8634f" };
    return { trend: "stable", icon: "➡️", color: "#f0ad4e" };
  }

  async function generatePredictions() {
    if (typeof db === "undefined" || typeof COL === "undefined") return [];
    var thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    try {
      var results = await Promise.all([
        db.collection(COL.products).get(),
        db.collection(COL.sales).where("dateObj", ">=", thirtyDaysAgo).get()
      ]);
      var products = results[0].docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      var salesData = results[1].docs.map(function(d) { return d.data(); });
      var predictions = [];

      products.forEach(function(p) {
        var dailyMap = buildDailySalesMap(salesData, p.id, 30);
        var weightedRate = calcWeightedDailyRate(dailyMap);
        var weeklyPattern = detectWeeklyPattern(dailyMap);
        var confidence = calcConfidence(dailyMap, 30);
        var seasonal = detectSeasonalSpike(salesData, p.id);
        var stockoutDays = predictStockoutDays(p.quantity, weightedRate);
        var reorderQty = suggestReorderQty(weightedRate, p.maxStock || 100, p.quantity);
        var trend = getDemandTrend(dailyMap);
        var expireUnsold = willExpireUnsold(p.quantity, weightedRate, p.expiryDate);
        var wasteUnits = expiryWasteUnits(p.quantity, weightedRate, p.expiryDate);

        var alerts = [];
        if (stockoutDays <= 7 && stockoutDays !== Infinity) {
          alerts.push({ type: "stockout", severity: stockoutDays <= 3 ? "critical" : "warning",
            message: p.name + " will run out in ~" + stockoutDays + " days (confidence: " + confidence.label + ")", icon: "⚡" });
        }
        if (expireUnsold && wasteUnits > 0) {
          alerts.push({ type: "expiry_waste", severity: "warning",
            message: p.name + ": ~" + wasteUnits + " units likely to expire unsold", icon: "🗑️" });
        }
        if (seasonal.isSeasonal) {
          alerts.push({ type: "seasonal", severity: "info",
            message: p.name + ": " + seasonal.message, icon: "📅" });
        }

        predictions.push({
          id: p.id, name: p.name, category: p.category,
          currentQty: p.quantity, maxStock: p.maxStock || 100,
          dailyRate: +weightedRate.toFixed(2),
          stockoutDays: stockoutDays, reorderQty: reorderQty,
          trend: trend, confidence: confidence,
          weeklyPattern: weeklyPattern, seasonal: seasonal,
          expireUnsold: expireUnsold, wasteUnits: wasteUnits,
          expiryDate: p.expiryDate, supplierId: p.supplierId,
          alerts: alerts
        });
      });

      predictions.sort(function(a, b) {
        if (a.stockoutDays === Infinity && b.stockoutDays === Infinity) return 0;
        if (a.stockoutDays === Infinity) return 1;
        if (b.stockoutDays === Infinity) return -1;
        return a.stockoutDays - b.stockoutDays;
      });
      return predictions;
    } catch(e) { console.error("Predictions error:", e); return []; }
  }

  return { generatePredictions: generatePredictions, buildDailySalesMap: buildDailySalesMap,
    calcWeightedDailyRate: calcWeightedDailyRate, detectWeeklyPattern: detectWeeklyPattern,
    calcConfidence: calcConfidence, detectSeasonalSpike: detectSeasonalSpike };
})();
