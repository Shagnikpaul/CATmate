"""Authentication Pydantic schemas."""
from typing import Optional
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):
    user_id: str
    password: str

class UserOut(BaseModel):
    user_id: str
    name: str
    role: str
    site_id: Optional[str] = None
    skill_level: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[UserOut] = None
    error: Optional[str] = None

class LogoutResponse(BaseModel):
    success: bool
