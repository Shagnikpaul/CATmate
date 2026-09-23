"""Authentication service: password hashing, session tokens, and dependencies."""
import uuid
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Session as UserSession
from app.config import settings

def hash_password(password: str) -> str:
    """Hash password using native bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_session_token(db: Session, user_id: str) -> str:
    """Generate opaque token, store in sessions table, and return token."""
    token = f"sess_{uuid.uuid4().hex[:16]}"
    expires_at = datetime.utcnow() + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
    
    session_obj = UserSession(
        token=token,
        user_id=user_id,
        created_at=datetime.utcnow(),
        expires_at=expires_at
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return token

def delete_session_token(db: Session, token: str) -> bool:
    """Delete a session token on logout."""
    clean_token = token.replace("Bearer ", "").strip()
    session_obj = db.query(UserSession).filter(UserSession.token == clean_token).first()
    if session_obj:
        db.delete(session_obj)
        db.commit()
        return True
    return False

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency to authenticate requests using Bearer token from sessions table."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    token = authorization.replace("Bearer ", "").strip()
    session_obj = db.query(UserSession).filter(UserSession.token == token).first()
    
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
        
    if session_obj.expires_at and session_obj.expires_at < datetime.utcnow():
        db.delete(session_obj)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired"
        )
        
    user = db.query(User).filter(User.user_id == session_obj.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    return user

def get_current_manager(current_user: User = Depends(get_current_user)) -> User:
    """FastAPI dependency to ensure the authenticated user has manager role."""
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Manager role required"
        )
    return current_user

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional authentication dependency for flexible endpoints."""
    if not authorization:
        return None
    try:
        return get_current_user(authorization, db)
    except HTTPException:
        return None
