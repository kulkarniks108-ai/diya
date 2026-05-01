import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/manager/device_manager.dart';
import '../domain/manager/device_registry.dart';
import '../domain/messaging/event_bus.dart';
import '../domain/messaging/event_arbitrator.dart';
import '../domain/messaging/event_router.dart';
import '../infrastructure/manager/backoff_strategy.dart';
import '../infrastructure/manager/device_manager_impl.dart';
import '../infrastructure/manager/shared_prefs_device_registry.dart';
import '../infrastructure/observability/hardware_logger.dart';

// ──────────────────────────────────────────────────────────────
// External Dependencies (must be overridden in ProviderScope)
// ──────────────────────────────────────────────────────────────

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('sharedPreferencesProvider must be overridden');
});

final dioProvider = Provider<Dio>((ref) {
  return Dio();
});

// ──────────────────────────────────────────────────────────────
// Infrastructure
// ──────────────────────────────────────────────────────────────

final deviceRegistryProvider = Provider<DeviceRegistry>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return SharedPreferencesDeviceRegistry(prefs);
});

final backoffStrategyProvider = Provider<BackoffStrategy>((ref) {
  return BackoffStrategy();
});

final hardwareLoggerProvider = Provider<HardwareLogger>((ref) {
  final logger = HardwareLogger();
  ref.onDispose(() => logger.dispose());
  return logger;
});

// ──────────────────────────────────────────────────────────────
// Event Pipeline: EventBus → EventRouter (with Arbitration)
// ──────────────────────────────────────────────────────────────

final hardwareEventBusProvider = Provider<HardwareEventBus>((ref) {
  final bus = HardwareEventBusImpl();
  ref.onDispose(() => bus.dispose());
  return bus;
});

final eventArbitratorProvider = Provider<EventArbitrator>((ref) {
  return const EventArbitrator();
});

final eventRouterProvider = Provider<EventRouter>((ref) {
  final bus = ref.watch(hardwareEventBusProvider);
  final arbitrator = ref.watch(eventArbitratorProvider);
  final router = EventRouter(bus, arbitrator);
  ref.onDispose(() => router.dispose());
  return router;
});

// ──────────────────────────────────────────────────────────────
// Device Manager (lifecycle only — does NOT route events)
// ──────────────────────────────────────────────────────────────

final deviceManagerProvider = Provider<DeviceManager>((ref) {
  final registry = ref.watch(deviceRegistryProvider);
  final backoffStrategy = ref.watch(backoffStrategyProvider);
  final logger = ref.watch(hardwareLoggerProvider);
  final eventBus = ref.watch(hardwareEventBusProvider);
  
  final manager = DeviceManagerImpl(registry, backoffStrategy, logger, eventBus);
  ref.onDispose(() => manager.dispose());
  return manager;
});
