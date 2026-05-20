import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/session/session_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/home/home_screen.dart';
import '../features/debug/device_debug_screen.dart';
import '../features/safety/providers/safety_bootstrap.dart';
import '../features/startup/startup_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final sessionController = ref.watch(sessionControllerProvider);
  // Watch the bootstrap provider to trigger queue processing on authentication
  ref.watch(safetyBootstrapProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: sessionController,
    redirect: (context, state) {
      final sessionState = sessionController.state;
      final location = state.matchedLocation;

      if (sessionState.isLoading) {
        return location == '/' ? null : '/';
      }

      final isLoginRoute = location == '/login';
      final isHomeRoute = location == '/home';
      final isDebugRoute = location == '/debug';

      if (!sessionState.isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      if (sessionState.isAuthenticated && isLoginRoute) {
        return '/home';
      }

      if (sessionState.isAuthenticated && location == '/') {
        return '/home';
      }

      if (!sessionState.isAuthenticated && (isHomeRoute || isDebugRoute)) {
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const StartupScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/debug',
        builder: (context, state) => const DeviceDebugScreen(),
      ),
    ],
  );
});
