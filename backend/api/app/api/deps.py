from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def get_bearer_token(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH.TOKEN.MISSING", "message": "Bearer token is required"},
        )
    return credentials.credentials
