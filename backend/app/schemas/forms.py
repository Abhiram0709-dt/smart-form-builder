from enum import Enum

from pydantic import BaseModel, Field, model_validator


class QuestionType(str, Enum):
    TEXT = "text"
    MCQ = "mcq"
    CHECKBOX = "checkbox"
    DROPDOWN = "dropdown"


class Option(BaseModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)


class Question(BaseModel):
    id: str = Field(min_length=1)
    type: QuestionType
    label: str = Field(min_length=1)
    required: bool = False
    options: list[Option] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_options(self) -> "Question":
        option_based_types = {
            QuestionType.MCQ,
            QuestionType.CHECKBOX,
            QuestionType.DROPDOWN,
        }

        if self.type in option_based_types and not self.options:
            raise ValueError("Options are required for mcq, checkbox, and dropdown questions")

        if self.type == QuestionType.TEXT and self.options:
            raise ValueError("Text questions must not include options")

        option_ids = [option.id for option in self.options]
        if len(option_ids) != len(set(option_ids)):
            raise ValueError("Option IDs must be unique within a question")

        return self


class FormCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str | None = None
    questions: list[Question] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_question_ids(self) -> "FormCreate":
        question_ids = [question.id for question in self.questions]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("Question IDs must be unique within a form")
        return self


class FormRead(FormCreate):
    id: str


class FormList(BaseModel):
    total: int = Field(ge=0)
    items: list[FormRead] = Field(default_factory=list)
