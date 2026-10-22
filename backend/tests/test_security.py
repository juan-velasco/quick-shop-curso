from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_is_bcrypt_and_verifies():
    hashed = hash_password("Secret123!")
    assert hashed.startswith("$2")
    assert "Secret123!" not in hashed
    assert verify_password("Secret123!", hashed)
    assert not verify_password("other", hashed)


def test_token_expires_two_hours_after_issue():
    token = create_access_token(7, "admin")
    payload = decode_access_token(token)
    assert payload["sub"] == "7"
    assert payload["role"] == "admin"
    assert payload["exp"] - payload["iat"] == 7200


def test_expired_token_is_rejected():
    token = create_access_token(1, "cliente", now=datetime.now(UTC) - timedelta(hours=3))
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_tampered_token_is_rejected():
    token = create_access_token(1, "cliente")
    forged = jwt.encode(
        {"sub": "1", "role": "admin", "iat": 1, "exp": 9999999999},
        "wrong-key-wrong-key-wrong-key-123",
        "HS256",
    )
    for bad in (token[:-2] + "xx", forged):
        with pytest.raises(jwt.PyJWTError):
            decode_access_token(bad)
    assert get_settings().algorithm == "HS256"
