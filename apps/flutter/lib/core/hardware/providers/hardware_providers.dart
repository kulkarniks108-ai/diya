import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/manager/device_manager.dart';
import '../domain/manager/device_registry.dart';
import '../domain/messaging/event_bus.dart';
import '../domain/messaging/event_router.dart';
import '../infrastructure/manager/backoff_strategy.dart';
import '../infrastructure/manager/device_manager_impl.dart';
import '../infrastructure/manager/shared_prefs_device_registry.dart';
import '../infrastructure/observability/hardware_logger.dart';

// Requires overriding in ProviderScope at app launch
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('sharedPreferencesProvider must be overridden');
});

final dioProvider = Provider<Dio>((ref) {
  return Dio();
});

final deviceRegistryProvider = Provider<DeviceRegistry>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return SharedPreferencesDeviceRegistry(prefs);
});

final hardwareEventBusProvider = Provider<HardwareEventBus>((ref) {
  final bus = HardwareEventBusImpl();
  ref.onDispose(() => bus.dispose());
  return bus;
});

final eventRouterProvider = Provider<EventRouter>((ref) {
  final bus = ref.watch(hardwareEventBusProvider);
  final router = EventRouter(bus);
  ref.onDispose(() => router.dispose());
  return router;
});

final backoffStrategyProvider = Provider<BackoffStrategy>((ref) {
  return BackoffStrategy();
});

final hardwareLoggerProvider = Provider<HardwareLogger>((ref) {
  final logger = HardwareLogger();
  ref.onDispose(() => logger.dispose());
  return logger;
});

final deviceManagerProvider = Provider<DeviceManager>((ref) {
  final registry = ref.watch(deviceRegistryProvider);
  final backoffStrategy = ref.watch(backoffStrategyProvider);
  final logger = ref.watch(hardwareLoggerProvider);
  final eventBus = ref.watch(hardwareEventBusProvider);
  
  final manager = DeviceManagerImpl(registry, backoffStrategy, logger, eventBus);
  ref.onDispose(() => manager.dispose());
  return manager;
});
