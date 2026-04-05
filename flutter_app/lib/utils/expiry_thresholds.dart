enum AlertLevel { none, warning, urgent, expired }

class ExpiryThresholds {
  static const Map<String, Map<String, int>> thresholds = {
    'Dairy':       {'urgent': 3,  'warning': 7},
    'Beverages':   {'urgent': 5,  'warning': 14},
    'Snacks':      {'urgent': 10, 'warning': 30},
    'Personal Care': {'urgent': 15, 'warning': 45},
    'Medicines':   {'urgent': 15, 'warning': 45},
    'Groceries':   {'urgent': 30, 'warning': 60},
    'Cleaning':    {'urgent': 30, 'warning': 60},
    'Stationery':  {'urgent': 30, 'warning': 90},
    'Electronics': {'urgent': 30, 'warning': 90},
    'Other':       {'urgent': 15, 'warning': 30},
  };

  static AlertLevel getLevel(String category, DateTime? expiryDate) {
    if (expiryDate == null) return AlertLevel.none;
    final days = expiryDate.difference(DateTime.now()).inDays;
    if (days < 0) return AlertLevel.expired;
    final t = thresholds[category] ?? {'urgent': 7, 'warning': 30};
    if (days <= t['urgent']!) return AlertLevel.urgent;
    if (days <= t['warning']!) return AlertLevel.warning;
    return AlertLevel.none;
  }

  static int suggestedDiscount(DateTime? expiryDate) {
    if (expiryDate == null) return 0;
    final days = expiryDate.difference(DateTime.now()).inDays;
    if (days <= 3) return 40;
    if (days <= 7) return 30;
    if (days <= 15) return 20;
    if (days <= 30) return 10;
    return 0;
  }
}
