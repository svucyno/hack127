class BillItem {
  final String productId;
  final String name;
  final double price;
  final double originalPrice;
  final double cost;
  final int qty;
  final int gstSlab;
  final String category;
  final String? offerId;
  final String? offerLabel;

  const BillItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.originalPrice,
    required this.cost,
    required this.qty,
    this.gstSlab = 0,
    this.category = '',
    this.offerId,
    this.offerLabel,
  });

  factory BillItem.fromMap(Map<String, dynamic> m) => BillItem(
    productId: m['id'] ?? '',
    name: m['name'] ?? '',
    price: (m['price'] ?? 0).toDouble(),
    originalPrice: (m['originalPrice'] ?? m['price'] ?? 0).toDouble(),
    cost: (m['cost'] ?? 0).toDouble(),
    qty: m['qty'] ?? 1,
    gstSlab: m['gst'] ?? 0,
    category: m['category'] ?? '',
    offerId: m['offerId'],
    offerLabel: m['offerLabel'],
  );

  Map<String, dynamic> toMap() => {
    'id': productId, 'name': name, 'price': price,
    'originalPrice': originalPrice, 'cost': cost,
    'qty': qty, 'gst': gstSlab, 'category': category,
    'offerId': offerId, 'offerLabel': offerLabel,
  };
}
