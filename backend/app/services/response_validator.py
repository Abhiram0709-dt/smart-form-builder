from dataclasses import dataclass
from typing import Any

from app.schemas.forms import QuestionType


@dataclass
class ValidationError:
    """Represents a single validation error for a response."""

    question_id: str
    code: str
    message: str


class ResponseValidator:
    """Validates form responses against form definition."""

    @staticmethod
    def validate_response(
        form: dict[str, Any], answers: dict[str, Any]
    ) -> list[ValidationError]:
        """
        Validate answers against form questions.

        Args:
            form: Form definition with questions
            answers: Submitted answers (question_id -> answer)

        Returns:
            List of ValidationError objects; empty if valid
        """
        errors: list[ValidationError] = []

        # Build question map from form
        questions_map = {q["id"]: q for q in form.get("questions", [])}

        # Check for unknown question IDs
        for question_id in answers:
            if question_id not in questions_map:
                errors.append(
                    ValidationError(
                        question_id=question_id,
                        code="unknown_question",
                        message=f"Question '{question_id}' not found in form",
                    )
                )

        # Validate each question
        for question in form.get("questions", []):
            q_id = question["id"]
            q_type = QuestionType(question["type"])
            is_required = question.get("required", False)
            answer = answers.get(q_id)

            # Check required
            if is_required and answer is None:
                errors.append(
                    ValidationError(
                        question_id=q_id,
                        code="required_missing",
                        message=f"Question '{question['label']}' is required",
                    )
                )
                continue

            if answer is None:
                continue

            # Type-specific validation
            if q_type == QuestionType.TEXT:
                if not isinstance(answer, str):
                    errors.append(
                        ValidationError(
                            question_id=q_id,
                            code="invalid_type",
                            message="Expected string answer for text question",
                        )
                    )

            elif q_type in (QuestionType.MCQ, QuestionType.DROPDOWN):
                if not isinstance(answer, str):
                    errors.append(
                        ValidationError(
                            question_id=q_id,
                            code="invalid_type",
                            message="Expected string answer for mcq/dropdown question",
                        )
                    )
                    continue

                valid_option_ids = {opt["id"] for opt in question.get("options", [])}
                if answer not in valid_option_ids:
                    errors.append(
                        ValidationError(
                            question_id=q_id,
                            code="invalid_option",
                            message=f"Option '{answer}' not found for question",
                        )
                    )

            elif q_type == QuestionType.CHECKBOX:
                if not isinstance(answer, list):
                    errors.append(
                        ValidationError(
                            question_id=q_id,
                            code="invalid_type",
                            message="Expected list answer for checkbox question",
                        )
                    )
                    continue

                if not answer:
                    errors.append(
                        ValidationError(
                            question_id=q_id,
                            code="required_missing",
                            message="Checkbox must have at least one selection",
                        )
                    )
                    continue

                valid_option_ids = {opt["id"] for opt in question.get("options", [])}
                for option_id in answer:
                    if option_id not in valid_option_ids:
                        errors.append(
                            ValidationError(
                                question_id=q_id,
                                code="invalid_option",
                                message=f"Option '{option_id}' not found for question",
                            )
                        )

        return errors
