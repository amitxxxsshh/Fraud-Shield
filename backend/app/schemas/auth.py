from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "USER"
    phone: Optional[str] = None
    upi_handle: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    user_id: str


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    phone_hash: Optional[str] = None
    upi_handle_hash: Optional[str] = None
