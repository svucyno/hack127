import 'package:flutter/material.dart';

class OfflineBanner extends StatelessWidget {
  final int pendingCount;
  final VoidCallback? onSync;

  const OfflineBanner({super.key, this.pendingCount = 0, this.onSync});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Colors.orange.shade700,
      child: Row(children: [
        const Icon(Icons.wifi_off, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            'You\'re offline${pendingCount > 0 ? ' ($pendingCount pending)' : ''}',
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ),
        if (onSync != null)
          TextButton(
            onPressed: onSync,
            child: const Text('Sync', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
      ]),
    );
  }
}
