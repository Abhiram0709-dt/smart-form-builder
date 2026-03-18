import uuid
from datetime import datetime, timezone
from typing import Any

from app.schemas.forms import FormCreate
from app.storage.mongodb import MongoStorage


class FormsService:
    def __init__(self, storage: MongoStorage) -> None:
        self.storage = storage

    def create_form(self, payload: FormCreate, owner_id: str) -> dict[str, Any]:
        form = payload.model_dump()
        form["id"] = str(uuid.uuid4())
        form["owner_id"] = owner_id
        form["created_at"] = datetime.now(timezone.utc)
        self.storage.save_form(form)
        return form

    def list_forms(self, owner_id: str) -> list[dict[str, Any]]:
        return self.storage.get_forms(owner_id)

    def get_form(self, form_id: str, owner_id: str) -> dict[str, Any] | None:
        return self.storage.get_form(form_id, owner_id)
