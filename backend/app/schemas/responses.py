from datetime import datetime
from typing import TypeAlias

from pydantic import BaseModel, Field, model_validator

AnswerValue: TypeAlias = str | list[str]


class ResponseCreate(BaseModel):
    form_id: str = Field(min_length=1)
    answers: dict[str, AnswerValue] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_answers(self) -> "ResponseCreate":
        for question_id, answer in self.answers.items():
            if not question_id.strip():
                raise ValueError("Answer keys must be non-empty question IDs")

            if isinstance(answer, str):
                if not answer.strip():
                    raise ValueError("String answers must be non-empty")

            if isinstance(answer, list):
                if any((not isinstance(item, str)) or (not item.strip()) for item in answer):
                    raise ValueError("List answers must contain non-empty strings")

        return self


class ResponseRead(BaseModel):
    id: str = Field(min_length=1)
    form_id: str = Field(min_length=1)
    answers: dict[str, AnswerValue] = Field(default_factory=dict)
    submitted_at: datetime


class ResponseList(BaseModel):
    form_id: str = Field(min_length=1)
    total: int = Field(ge=0)
    items: list[ResponseRead] = Field(default_factory=list)


class ValidationErrorDetail(BaseModel):
    question_id: str = Field(min_length=1)
    code: str = Field(min_length=1)
    message: str = Field(min_length=1)


class ValidationErrorResponse(BaseModel):
    detail: str = "Validation failed"
    errors: list[ValidationErrorDetail] = Field(default_factory=list)
