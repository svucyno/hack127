import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'dart:developer';

class OfflineService {
  static Database? _db;

  Future<Database> get db async {
    _db ??= await openDatabase('shopsmart.db', version: 1,
        onCreate: (db, v) async {
      await db.execute('''
        CREATE TABLE pending_bills (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      ''');
      await db.execute('''
        CREATE TABLE cached_products (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          synced_at INTEGER NOT NULL
        )
      ''');
    });
    return _db!;
  }

  Future<void> queueBill(String id, Map<String, dynamic> billData) async {
    final database = await db;
    await database.insert('pending_bills', {
      'id': id,
      'data': jsonEncode(billData),
      'created_at': DateTime.now().millisecondsSinceEpoch,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
    log('Bill $id queued offline');
  }

  Future<List<Map<String, dynamic>>> getPendingBills() async {
    final database = await db;
    final rows = await database.query('pending_bills');
    return rows
        .map((r) => jsonDecode(r['data'] as String) as Map<String, dynamic>)
        .toList();
  }

  Future<int> getPendingCount() async {
    final database = await db;
    final result = await database.rawQuery('SELECT COUNT(*) as count FROM pending_bills');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> clearBill(String id) async {
    final database = await db;
    await database.delete('pending_bills', where: 'id = ?', whereArgs: [id]);
  }
}
