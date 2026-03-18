import uuid
from datetime import datetime, timezone
from typing import Any

from app.schemas.responses import ResponseCreate
from app.services.response_validator import ResponseValidator, ValidationError
from app.storage.mongodb import MongoStorage


class ResponsesService:
    def __init__(self, storage: MongoStorage) -> None:
        self.storage = storage

    def submit_response(
        self,
        payload: ResponseCreate,
        form: dict[str, Any],
        owner_id: str,
    ) -> tuple[dict[str, Any] | None, list[ValidationError]]:
        """
        Submit response with validation.

        Args:
            payload: Response submission data
            form: Form definition for validation

        Returns:
            Tuple of (created_response, validation_errors)
            If validation passes: (response_dict, [])
            If validation fails: (None, [errors])
        """
        # Validate response against form
        validation_errors = ResponseValidator.validate_response(
            form, payload.answers
        )

        if validation_errors:
            return None, validation_errors

        # If valid, save response
        response = payload.model_dump()
        response["id"] = str(uuid.uuid4())
        response["owner_id"] = owner_id
        response["submitted_at"] = datetime.now(timezone.utc)
        self.storage.save_response(response)
        return response, []

    def get_responses(self, form_id: str, owner_id: str) -> list[dict[str, Any]]:
        return self.storage.get_responses(form_id, owner_id)

    def get_form_analytics(
        self,
        form: dict[str, Any],
        responses: list[dict[str, Any]],
    ) -> dict[str, Any]:
        total_responses = len(responses)
        question_stats: list[dict[str, Any]] = []

        for question in form.get("questions", []):
            question_id = question["id"]
            question_type = question["type"]
            question_label = question["label"]
            required = bool(question.get("required", False))
            options = question.get("options", [])

            answers_for_question: list[Any] = []
            for response in responses:
                answer = response.get("answers", {}).get(question_id)
                answers_for_question.append(answer)

            if question_type == "text":
                text_answers = [
                    answer.strip()
                    for answer in answers_for_question
                    if isinstance(answer, str) and answer.strip()
                ]
                total_answered = len(text_answers)

                question_stats.append(
                    {
                        "question_id": question_id,
                        "label": question_label,
                        "type": question_type,
                        "required": required,
                        "total_answered": total_answered,
                        "unanswered_count": max(total_responses - total_answered, 0),
                        "options": [],
                        "text_samples": text_answers[:5],
                    }
                )
                continue

            option_counts: dict[str, int] = {
                option["id"]: 0 for option in options if "id" in option
            }

            if question_type in {"mcq", "dropdown"}:
                for answer in answers_for_question:
                    if isinstance(answer, str) and answer in option_counts:
                        option_counts[answer] += 1

                total_answered = sum(option_counts.values())
            else:
                responses_with_selection = 0
                for answer in answers_for_question:
                    if not isinstance(answer, list):
                        continue

                    valid_selections = [
                        item
                        for item in answer
                        if isinstance(item, str) and item in option_counts
                    ]
                    if valid_selections:
                        responses_with_selection += 1

                    for item in valid_selections:
                        option_counts[item] += 1

                total_answered = responses_with_selection

            option_stats = [
                {
                    "id": option["id"],
                    "label": option.get("label", option["id"]),
                    "count": option_counts.get(option["id"], 0),
                }
                for option in options
                if "id" in option
            ]

            question_stats.append(
                {
                    "question_id": question_id,
                    "label": question_label,
                    "type": question_type,
                    "required": required,
                    "total_answered": total_answered,
                    "unanswered_count": max(total_responses - total_answered, 0),
                    "options": option_stats,
                    "text_samples": [],
                }
            )

        return {
            "form_id": form["id"],
            "total_responses": total_responses,
            "generated_at": datetime.now(timezone.utc),
            "questions": question_stats,
        }
