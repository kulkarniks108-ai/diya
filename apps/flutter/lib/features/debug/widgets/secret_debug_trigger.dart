import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// A wrapper widget that listens for 5 rapid taps on its child to navigate to the debug screen.
/// Ideal for wrapping a top-level scaffold or an app bar to provide hidden access.
class SecretDebugTrigger extends StatefulWidget {
  final Widget child;
  final int requiredTaps;
  final Duration resetDuration;

  const SecretDebugTrigger({
    super.key,
    required this.child,
    this.requiredTaps = 5,
    this.resetDuration = const Duration(seconds: 2),
  });

  @override
  State<SecretDebugTrigger> createState() => _SecretDebugTriggerState();
}

class _SecretDebugTriggerState extends State<SecretDebugTrigger> {
  int _tapCount = 0;
  DateTime? _lastTapTime;

  void _handlePointerDown(PointerDownEvent event) {
    // Only capture taps in the top 120 pixels (the header/AppBar area)
    if (event.position.dy > 120) {
      return;
    }

    final now = DateTime.now();
    
    if (_lastTapTime != null && now.difference(_lastTapTime!) > widget.resetDuration) {
      // Reset if too much time has passed since last tap
      _tapCount = 0;
    }

    _lastTapTime = now;
    _tapCount++;

    if (_tapCount >= widget.requiredTaps) {
      _tapCount = 0; // Reset after triggering
      
      // Navigate to the debug dashboard
      context.push('/debug');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Using Listener instead of GestureDetector to catch raw pointer events
    // before the gesture arena resolves them, ensuring taps aren't swallowed by children.
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: _handlePointerDown,
      child: widget.child,
    );
  }
}
