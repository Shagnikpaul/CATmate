"""Tasks model."""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Text, primary_key=True, index=True)
    machine_id = Column(Text, ForeignKey("machines.machine_id"), nullable=True)
    operator_id = Column(Text, ForeignKey("users.user_id"), nullable=True)
    task_type = Column(Text, nullable=True)
    zone = Column(Text, nullable=True)
    scheduled_start = Column(DateTime, nullable=True)
    estimated_time_min = Column(Integer, nullable=True)
    actual_time_min = Column(Integer, nullable=True)
    weather = Column(Text, nullable=True)
    status = Column(Text, default="pending", nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'in_progress', 'completed')", name="check_task_status"),
    )

    machine = relationship("Machine", back_populates="tasks")
    operator = relationship("User", back_populates="tasks")
