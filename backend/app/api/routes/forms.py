from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, get_forms_service, get_responses_service
from app.schemas.analytics import FormAnalytics
from app.schemas.forms import FormCreate, FormList, FormRead
from app.services.forms_service import FormsService
from app.services.responses_service import ResponsesService

router = APIRouter(prefix="/forms", tags=["forms"])


@router.get("", response_model=FormList)
def list_forms(
    service: FormsService = Depends(get_forms_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> FormList:
    forms = service.list_forms(current_user["id"])
    return FormList(
        total=len(forms),
        items=[FormRead.model_validate(item) for item in forms],
    )


@router.post("", response_model=FormRead, status_code=status.HTTP_201_CREATED)
def create_form(
    payload: FormCreate,
    service: FormsService = Depends(get_forms_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> FormRead:
    created_form = service.create_form(payload, current_user["id"])
    return FormRead.model_validate(created_form)


@router.get("/{form_id}", response_model=FormRead)
def get_form(
    form_id: str,
    service: FormsService = Depends(get_forms_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> FormRead:
    form = service.get_form(form_id, current_user["id"])
    if form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    return FormRead.model_validate(form)


@router.get("/{form_id}/analytics", response_model=FormAnalytics)
def get_form_analytics(
    form_id: str,
    forms_service: FormsService = Depends(get_forms_service),
    responses_service: ResponsesService = Depends(get_responses_service),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> FormAnalytics:
    form = forms_service.get_form(form_id, current_user["id"])
    if form is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found")

    responses = responses_service.get_responses(form_id, current_user["id"])
    analytics = responses_service.get_form_analytics(form, responses)
    return FormAnalytics.model_validate(analytics)
