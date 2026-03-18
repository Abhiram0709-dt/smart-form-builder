from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_auth_service
from app.schemas.auth import AuthResponse, UserLogin, UserSignup
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(
    payload: UserSignup,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        user = auth_service.signup(payload)
    except ValueError as exc:
        if str(exc) == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            ) from exc
        raise

    return AuthResponse.model_validate(auth_service.create_auth_payload(user))


@router.post("/login", response_model=AuthResponse)
def login(
    payload: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    user = auth_service.authenticate(payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return AuthResponse.model_validate(auth_service.create_auth_payload(user))
