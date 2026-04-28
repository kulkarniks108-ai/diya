from datetime import UTC, datetime, timedelta
from uuid import uuid4

from jose import jwt
from passlib.context import CryptContext

from app.config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(claims: dict, expires_minutes: int | None = None) -> str:
    payload = claims.copy()
    lifetime = expires_minutes or settings.auth.access_token_expire_minutes
    payload.update(
        {
            "jti": payload.get("jti", str(uuid4())),
            "iat": datetime.now(tz=UTC),
            "exp": datetime.now(tz=UTC) + timedelta(minutes=lifetime),
        }
    )
    return jwt.encode(payload, settings.auth.secret_key, algorithm=settings.auth.algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.auth.secret_key, algorithms=[settings.auth.algorithm])