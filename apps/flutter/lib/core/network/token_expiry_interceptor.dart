import 'package:dio/dio.dart';

import '../session/session_controller.dart';
import 'auth_api.dart';

/// Interceptor to handle 401 token expiry by attempting a single refresh.
class TokenExpiryInterceptor extends Interceptor {
  TokenExpiryInterceptor({
    required this.authApi,
    required this.sessionController,
  });

  final AuthApi authApi;
  final SessionController sessionController;

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    // If it's a 401 and we haven't already tried to refresh, attempt refresh
    if (err.response?.statusCode == 401) {
      final currentSession = sessionController.state.session;
      if (currentSession == null) {
        return handler.next(err);
      }

      try {
        // Attempt to refresh the token
        final newSession = await authApi.refresh(session: currentSession);
        await sessionController.updateSession(newSession);

        // Retry the original request with the new token
        final requestOptions = err.requestOptions;
        requestOptions.headers['Authorization'] = 'Bearer ${newSession.accessToken}';

        final response = await Dio().request<dynamic>(
          requestOptions.path,
          data: requestOptions.data,
          queryParameters: requestOptions.queryParameters,
          options: Options(
            method: requestOptions.method,
            headers: requestOptions.headers,
            contentType: requestOptions.contentType,
            responseType: requestOptions.responseType,
            receiveTimeout: requestOptions.receiveTimeout,
            sendTimeout: requestOptions.sendTimeout,
          ),
        );

        return handler.resolve(Response<dynamic>(
          requestOptions: response.requestOptions,
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          data: response.data,
          isRedirect: response.isRedirect,
          redirects: response.redirects,
        ));
      } catch (_) {
        // If refresh fails, return the original 401 error
        // SessionController will handle logout
        return handler.next(err);
      }
    }

    return handler.next(err);
  }
}
