from app.schemas import LoginRequest, LogoutRequest, RefreshRequest
from app.services.auth_service import AuthService


def test_login_refresh_and_logout_flow() -> None:
    service = AuthService()

    login = service.login(LoginRequest(email='blind@example.com', password='2ndeye-demo'))

    assert login.access_token
    assert login.refresh_token
    assert login.session_id
    assert login.token_version == 1
    assert login.user.email == 'blind@example.com'

    me = service.me(login.access_token)
    assert me.user.email == 'blind@example.com'
    assert me.session_id == login.session_id

    refreshed = service.refresh(RefreshRequest(refresh_token=login.refresh_token))
    assert refreshed.session_id == login.session_id
    assert refreshed.token_version == 2
    assert refreshed.refresh_token != login.refresh_token

    service.logout(LogoutRequest(session_id=login.session_id), token=None)
    assert service._sessions_by_id[login.session_id].revoked_at is not None
