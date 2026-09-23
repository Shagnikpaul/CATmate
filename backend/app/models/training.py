"""Training modules and assignments models."""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class TrainingModule(Base):
    __tablename__ = "training_modules"

    module_id = Column(Text, primary_key=True, index=True)
    title = Column(Text, nullable=True)
    topic_tags = Column(JSON, nullable=True)
    video_url = Column(Text, nullable=True)
    duration_sec = Column(Integer, nullable=True)

    assignments = relationship("TrainingAssignment", back_populates="module", cascade="all, delete-orphan")

class TrainingAssignment(Base):
    __tablename__ = "training_assignments"

    assignment_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    operator_id = Column(Text, ForeignKey("users.user_id"), nullable=True)
    module_id = Column(Text, ForeignKey("training_modules.module_id"), nullable=True)
    reason = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    completed = Column(Boolean, default=False, nullable=True)

    operator = relationship("User", back_populates="training_assignments")
    module = relationship("TrainingModule", back_populates="assignments")
