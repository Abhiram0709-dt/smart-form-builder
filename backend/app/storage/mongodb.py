from typing import Any

from pymongo import MongoClient

from app.core.config import settings


class MongoStorage:
    def __init__(self) -> None:
        self.client = MongoClient(settings.mongodb_uri)
        self.db = self.client[settings.mongodb_db_name]

        self.users = self.db["users"]
        self.forms = self.db["forms"]
        self.responses = self.db["responses"]

        self._ensure_indexes()

    def _ensure_indexes(self) -> None:
        self.users.create_index("email", unique=True)
        self.forms.create_index("id", unique=True)
        self.forms.create_index("owner_id")
        self.responses.create_index("id", unique=True)
        self.responses.create_index([("owner_id", 1), ("form_id", 1)])

    @staticmethod
    def _clean_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
        if document is None:
            return None

        return {key: value for key, value in document.items() if key != "_id"}

    def create_user(self, user: dict[str, Any]) -> None:
        self.users.insert_one(user)

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        document = self.users.find_one({"email": email})
        return self._clean_document(document)

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        document = self.users.find_one({"id": user_id})
        return self._clean_document(document)

    def save_form(self, form: dict[str, Any]) -> None:
        self.forms.insert_one(form)

    def get_forms(self, owner_id: str) -> list[dict[str, Any]]:
        cursor = self.forms.find(
            {"owner_id": owner_id},
            sort=[("created_at", -1)],
        )
        return [self._clean_document(item) for item in cursor if item is not None]

    def get_form(self, form_id: str, owner_id: str) -> dict[str, Any] | None:
        document = self.forms.find_one({"id": form_id, "owner_id": owner_id})
        return self._clean_document(document)

    def save_response(self, response: dict[str, Any]) -> None:
        self.responses.insert_one(response)

    def get_responses(self, form_id: str, owner_id: str) -> list[dict[str, Any]]:
        cursor = self.responses.find(
            {"form_id": form_id, "owner_id": owner_id},
            sort=[("submitted_at", 1)],
        )
        return [self._clean_document(item) for item in cursor if item is not None]


storage = MongoStorage()
