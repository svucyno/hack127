import 'package:cloud_firestore/cloud_firestore.dart';

class Supplier {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String notes;
  final int leadTimeDays;

  const Supplier({
    required this.id,
    required this.name,
    this.phone = '',
    this.email = '',
    this.notes = '',
    this.leadTimeDays = 3,
  });

  factory Supplier.fromFirestore(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>? ?? {};
    return Supplier(
      id: doc.id,
      name: d['name'] ?? '',
      phone: d['phone'] ?? '',
      email: d['email'] ?? '',
      notes: d['notes'] ?? '',
      leadTimeDays: d['leadTimeDays'] ?? 3,
    );
  }

  Map<String, dynamic> toFirestore() => {
    'name': name, 'phone': phone, 'email': email,
    'notes': notes, 'leadTimeDays': leadTimeDays,
  };
}
