"""Authentication router."""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserOut, LogoutResponse
from app.services.auth_service import (
    verify_password,
    create_session_token,
    delete_session_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user by user_id and password.
    Creates an active session and returns opaque session token.
    """
    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_session_token(db, user.user_id)

    return LoginResponse(
        success=True,
        token=token,
        user=UserOut.model_validate(user)
    )

@router.post("/logout", response_model=LogoutResponse)
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Delete session token to log out.
    """
    if authorization:
        delete_session_token(db, authorization)
    return LogoutResponse(success=True)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get profile information of the currently authenticated user.
    """
    return UserOut.model_validate(current_user)
