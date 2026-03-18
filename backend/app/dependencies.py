from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.services.auth_service import AuthService
from app.services.forms_service import FormsService
from app.services.responses_service import ResponsesService
from app.storage.mongodb import storage

auth_service = AuthService(storage)
forms_service = FormsService(storage)
responses_service = ResponsesService(storage)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_auth_service() -> AuthService:
    return auth_service


def get_forms_service() -> FormsService:
    return forms_service


def get_responses_service() -> ResponsesService:
    return responses_service


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    auth_service_dep: AuthService = Depends(get_auth_service),
) -> dict[str, Any]:
    if token is None or not token.strip():
        return {
            "id": "public-user",
            "name": "Public User",
            "email": "public@example.com",
        }

    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = auth_service_dep.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
