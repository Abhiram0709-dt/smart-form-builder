from collections import defaultdict
from typing import Any


class InMemoryStorage:
    def __init__(self) -> None:
        self.forms: dict[str, dict[str, Any]] = {}
        self.responses_by_form: dict[str, list[dict[str, Any]]] = defaultdict(list)

    def save_form(self, form: dict[str, Any]) -> None:
        self.forms[form["id"]] = form

    def get_form(self, form_id: str) -> dict[str, Any] | None:
        return self.forms.get(form_id)

    def save_response(self, form_id: str, response: dict[str, Any]) -> None:
        self.responses_by_form[form_id].append(response)

    def get_responses(self, form_id: str) -> list[dict[str, Any]]:
        return list(self.responses_by_form.get(form_id, []))


storage = InMemoryStorage()
