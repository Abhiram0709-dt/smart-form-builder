from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, get_forms_service, get_responses_service
from app.schemas.responses import (
    ResponseCreate,
    ResponseList,
    ResponseRead,
    ValidationErrorDetail,
    ValidationErrorResponse,
)
from app.services.forms_service import FormsService
from app.services.responses_service import ResponsesService

router = APIRouter(prefix="/responses", tags=["responses"])


@router.post("", response_model=ResponseRead, status_code=status.HTTP_201_CREATED)
def submit_response(
    payload: ResponseCreate,
    forms_service: FormsService = Depends(get_forms_service),
    responses_service: ResponsesService = Depends(get_responses_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResponseRead:
    form = forms_service.get_form(payload.form_id, current_user["id"])
    if form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    # Submit response with validation
    created_response, validation_errors = responses_service.submit_response(
        payload, form, current_user["id"]
    )

    # Handle validation errors
    if validation_errors:
        error_details = [
            ValidationErrorDetail(
                question_id=err.question_id, code=err.code, message=err.message
            )
            for err in validation_errors
        ]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ValidationErrorResponse(
                detail="Response validation failed", errors=error_details
            ).model_dump(),
        )

    return ResponseRead.model_validate(created_response)


@router.get("/{form_id}", response_model=ResponseList)
def get_responses(
    form_id: str,
    forms_service: FormsService = Depends(get_forms_service),
    responses_service: ResponsesService = Depends(get_responses_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResponseList:
    form = forms_service.get_form(form_id, current_user["id"])
    if form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    responses = responses_service.get_responses(form_id, current_user["id"])
    return ResponseList(
        form_id=form_id,
        total=len(responses),
        items=[ResponseRead.model_validate(item) for item in responses],
    )
