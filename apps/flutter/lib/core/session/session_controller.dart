import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import '../network/auth_api.dart';
import 'auth_session.dart';

final authApiProvider = Provider<AuthApi>((ref) => AuthApi());

final sessionControllerProvider = ChangeNotifierProvider<SessionController>((ref) {
  return SessionController(ref.read(authApiProvider));
});

class SessionController extends ChangeNotifier {
  SessionController(this._authApi) {
    _bootstrap();
  }

  final AuthApi _authApi;
  SessionState _state = const SessionState.loading();

  SessionState get state => _state;

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = prefs.getString(AppConfig.sessionStorageKey);

    if (encoded == null || encoded.isEmpty) {
      _state = const SessionState(status: AuthStatus.unauthenticated);
      notifyListeners();
      return;
    }

    final decoded = jsonDecode(encoded) as Map<String, dynamic>;
    final session = AuthSession.fromJson(decoded.cast<String, Object?>());
    _state = SessionState(status: AuthStatus.authenticated, session: session);
    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    _state = _state.copyWith(status: AuthStatus.refreshing, errorMessage: null);
    notifyListeners();

    try {
      final session = await _authApi.login(email: email, password: password);
      await _persist(session);
      _state = SessionState(status: AuthStatus.authenticated, session: session);
    } catch (error) {
      _state = SessionState(
        status: AuthStatus.error,
        errorMessage: 'Login failed: $error',
      );
    }

    notifyListeners();
  }

  Future<void> refreshSession() async {
    final currentSession = _state.session;
    if (currentSession == null) {
      return;
    }

    _state = _state.copyWith(status: AuthStatus.refreshing, errorMessage: null);
    notifyListeners();

    try {
      final refreshed = await _authApi.refresh(session: currentSession);
      await _persist(refreshed);
      _state = SessionState(status: AuthStatus.authenticated, session: refreshed);
    } catch (error) {
      _state = SessionState(
        status: AuthStatus.error,
        errorMessage: 'Refresh failed: $error',
      );
    }

    notifyListeners();
  }

  Future<void> signOut() async {
    final currentSession = _state.session;
    if (currentSession != null) {
      try {
        await _authApi.logout(accessToken: currentSession.accessToken);
      } catch (_) {
        // Logout should still clear local state even if the backend is unreachable.
      }
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.sessionStorageKey);
    _state = const SessionState(status: AuthStatus.unauthenticated);
    notifyListeners();
  }

  Future<void> updateArbitrationSummary(String summary) async {
    _state = _state.copyWith(lastArbitrationSummary: summary);
    notifyListeners();
  }

  Future<void> _persist(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConfig.sessionStorageKey, jsonEncode(session.toJson()));
  }
}
