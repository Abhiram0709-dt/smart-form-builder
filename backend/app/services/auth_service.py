import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import UserSignup
from app.storage.mongodb import MongoStorage


class AuthService:
    def __init__(self, storage: MongoStorage) -> None:
        self.storage = storage

    def signup(self, payload: UserSignup) -> dict[str, Any]:
        normalized_email = payload.email.strip().lower()

        existing_user = self.storage.get_user_by_email(normalized_email)
        if existing_user is not None:
            raise ValueError("EMAIL_ALREADY_EXISTS")

        user = {
            "id": str(uuid.uuid4()),
            "name": payload.name.strip(),
            "email": normalized_email,
            "hashed_password": hash_password(payload.password),
            "created_at": datetime.now(timezone.utc),
        }

        self.storage.create_user(user)
        return user

    def authenticate(self, email: str, password: str) -> dict[str, Any] | None:
        normalized_email = email.strip().lower()
        user = self.storage.get_user_by_email(normalized_email)
        if user is None:
            return None

        if not verify_password(password, user["hashed_password"]):
            return None

        return user

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self.storage.get_user_by_id(user_id)

    def create_auth_payload(self, user: dict[str, Any]) -> dict[str, Any]:
        access_token = create_access_token(user["id"])
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
            },
        }
