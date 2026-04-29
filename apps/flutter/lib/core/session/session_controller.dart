import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../errors/app_error.dart';
import '../errors/app_error_mapper.dart';
import '../network/auth_api.dart';
import '../utils/async_lock.dart';
import 'auth_session.dart';
import 'session_repository.dart';
import 'secure_session_repository.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  final api = AuthApi();
  final sessionController = ref.watch(sessionControllerProvider);
  // Register the token expiry interceptor after creating the session controller
  api.registerInterceptor(sessionController);
  return api;
});

final sessionRepositoryProvider = Provider<SessionRepository>((ref) => SecureSessionRepository());

final sessionControllerProvider = ChangeNotifierProvider<SessionController>((ref) {
  return SessionController(ref.read(authApiProvider), ref.read(sessionRepositoryProvider));
});

class SessionController extends ChangeNotifier {
  SessionController(this._authApi, this._sessionRepository) {
    _bootstrap();
  }

  final AuthApi _authApi;
  final SessionRepository _sessionRepository;
  final AsyncLock _refreshLock = AsyncLock();
  SessionState _state = const SessionState.loading();

  SessionState get state => _state;

  Future<void> _bootstrap() async {
    final session = await _sessionRepository.load();

    if (session == null) {
      _state = SessionState(status: AuthStatus.unauthenticated);
      notifyListeners();
      return;
    }

    // We have a locally stored session; validate it with the backend.
    _state = SessionState(status: AuthStatus.refreshing, session: session);
    notifyListeners();

    try {
      await _authApi.me(accessToken: session.accessToken);
      _state = SessionState(status: AuthStatus.authenticated, session: session);
    } on AppError catch (error) {
      if (error.type == AppErrorType.network) {
        _state = SessionState(
          status: AuthStatus.authenticated,
          session: session,
          error: error,
        );
      } else {
        try {
          final refreshed = await _authApi.refresh(session: session);
          await _sessionRepository.save(refreshed);
          await _authApi.me(accessToken: refreshed.accessToken);
          _state = SessionState(status: AuthStatus.authenticated, session: refreshed);
        } on AppError catch (refreshError) {
          if (refreshError.type == AppErrorType.network) {
            _state = SessionState(
              status: AuthStatus.authenticated,
              session: session,
              error: refreshError,
            );
          } else {
            await _sessionRepository.clear();
            _state = SessionState(status: AuthStatus.unauthenticated, error: refreshError);
          }
        }
      }
    } catch (error) {
      final appError = AppErrorMapper.fromException(error, fallbackType: AppErrorType.auth);
      try {
        final refreshed = await _authApi.refresh(session: session);
        await _sessionRepository.save(refreshed);
        await _authApi.me(accessToken: refreshed.accessToken);
        _state = SessionState(status: AuthStatus.authenticated, session: refreshed);
      } on AppError catch (refreshError) {
        if (refreshError.type == AppErrorType.network) {
          _state = SessionState(status: AuthStatus.authenticated, session: session, error: refreshError);
        } else {
          await _sessionRepository.clear();
          _state = SessionState(status: AuthStatus.unauthenticated, error: appError);
        }
      }
    }

    notifyListeners();
  }

  Future<void> signIn({required String email, required String password}) async {
    _state = SessionState(status: AuthStatus.refreshing, session: _state.session);
    notifyListeners();

    try {
      final session = await _authApi.login(email: email, password: password);
      await _sessionRepository.save(session);
      _state = SessionState(status: AuthStatus.authenticated, session: session);
    } on AppError catch (error) {
      _state = SessionState(status: AuthStatus.error, error: error);
    }

    notifyListeners();
  }

  Future<void> refreshSession() async {
    return _refreshLock.acquire(() async {
      final currentSession = _state.session;
      if (currentSession == null) {
        return;
      }

      _state = SessionState(status: AuthStatus.refreshing, session: currentSession);
      notifyListeners();

      try {
        final refreshed = await _authApi.refresh(session: currentSession);
        await _sessionRepository.save(refreshed);
        _state = SessionState(status: AuthStatus.authenticated, session: refreshed);
      } on AppError catch (error) {
        if (error.type == AppErrorType.network) {
          _state = SessionState(status: AuthStatus.authenticated, session: currentSession, error: error);
        } else {
          _state = SessionState(status: AuthStatus.error, error: error);
        }
      }

      notifyListeners();
    });
  }

  /// Update the current session (used by interceptor for token refresh).
  Future<void> updateSession(AuthSession newSession) async {
    await _sessionRepository.save(newSession);
    _state = SessionState(status: AuthStatus.authenticated, session: newSession);
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

    await _sessionRepository.clear();
    _state = SessionState(status: AuthStatus.unauthenticated);
    notifyListeners();
  }

  Future<void> updateArbitrationSummary(String summary) async {
    _state = _state.copyWith(lastArbitrationSummary: summary);
    notifyListeners();
  }

  // Persist helper is no longer used directly; repository handles persistence
}
