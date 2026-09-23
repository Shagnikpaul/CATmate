"""Users, sessions, and sites models."""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Site(Base):
    __tablename__ = "sites"

    site_id = Column(Text, primary_key=True, index=True)
    name = Column(Text, nullable=True)
    location = Column(Text, nullable=True)

    users = relationship("User", back_populates="site")
    machines = relationship("Machine", back_populates="site")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Text, primary_key=True, index=True)  # e.g. OP1001, MGR2001
    name = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)  # operator, manager
    site_id = Column(Text, ForeignKey("sites.site_id"), nullable=True)
    skill_level = Column(Text, nullable=True)  # Beginner / Intermediate / Expert

    __table_args__ = (
        CheckConstraint("role IN ('operator', 'manager')", name="check_user_role"),
    )

    site = relationship("Site", back_populates="users")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="operator")
    incidents = relationship("Incident", back_populates="operator")
    behavior_flags = relationship("BehaviorFlag", back_populates="operator")
    training_assignments = relationship("TrainingAssignment", back_populates="operator")

class Session(Base):
    __tablename__ = "sessions"

    token = Column(Text, primary_key=True, index=True)
    user_id = Column(Text, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
