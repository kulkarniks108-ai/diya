enum AuthStatus { loading, unauthenticated, authenticated, refreshing, error }

class AuthSession {
  const AuthSession({
    required this.userId,
    required this.email,
    required this.roles,
    required this.accessToken,
    required this.refreshToken,
    required this.sessionId,
    required this.tokenVersion,
  });

  final String userId;
  final String email;
  final List<String> roles;
  final String accessToken;
  final String refreshToken;
  final String sessionId;
  final int tokenVersion;

  Map<String, Object?> toJson() => <String, Object?>{
        'userId': userId,
        'email': email,
        'roles': roles,
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'sessionId': sessionId,
        'tokenVersion': tokenVersion,
      };

  factory AuthSession.fromJson(Map<String, Object?> json) {
    return AuthSession(
      userId: json['userId'] as String,
      email: json['email'] as String,
      roles: (json['roles'] as List<dynamic>).cast<String>(),
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      sessionId: json['sessionId'] as String,
      tokenVersion: json['tokenVersion'] as int,
    );
  }
}

class SessionState {
  const SessionState({
    required this.status,
    this.session,
    this.errorMessage,
    this.lastArbitrationSummary,
  });

  final AuthStatus status;
  final AuthSession? session;
  final String? errorMessage;
  final String? lastArbitrationSummary;

  const SessionState.loading()
      : status = AuthStatus.loading,
        session = null,
        errorMessage = null,
        lastArbitrationSummary = null;

  bool get isLoading => status == AuthStatus.loading;
  bool get isAuthenticated => status == AuthStatus.authenticated && session != null;

  SessionState copyWith({
    AuthStatus? status,
    AuthSession? session,
    String? errorMessage,
    String? lastArbitrationSummary,
  }) {
    return SessionState(
      status: status ?? this.status,
      session: session ?? this.session,
      errorMessage: errorMessage ?? this.errorMessage,
      lastArbitrationSummary: lastArbitrationSummary ?? this.lastArbitrationSummary,
    );
  }
}
