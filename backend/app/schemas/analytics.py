from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.forms import QuestionType


class OptionAnalytics(BaseModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    count: int = Field(ge=0)


class QuestionAnalytics(BaseModel):
    question_id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    type: QuestionType
    required: bool
    total_answered: int = Field(ge=0)
    unanswered_count: int = Field(ge=0)
    options: list[OptionAnalytics] = Field(default_factory=list)
    text_samples: list[str] = Field(default_factory=list)


class FormAnalytics(BaseModel):
    form_id: str = Field(min_length=1)
    total_responses: int = Field(ge=0)
    generated_at: datetime
    questions: list[QuestionAnalytics] = Field(default_factory=list)
