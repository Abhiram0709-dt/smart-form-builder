from pydantic import BaseModel, Field


class UserSignup(BaseModel):
    name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class UserRead(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
