import 'auth_session.dart';

abstract class SessionRepository {
  Future<AuthSession?> load();
  Future<void> save(AuthSession session);
  Future<void> clear();
}

// Minimal interface-only file; implementations should live alongside this.
