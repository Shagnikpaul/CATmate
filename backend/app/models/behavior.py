"""Behavior and fatigue flags model."""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BehaviorFlag(Base):
    __tablename__ = "behavior_flags"

    flag_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    operator_id = Column(Text, ForeignKey("users.user_id"), nullable=True)
    machine_id = Column(Text, ForeignKey("machines.machine_id"), nullable=True)
    flag_type = Column(Text, nullable=True)  # Excessive Idling / Fuel Inefficiency / Low Productivity / Critical Safety Pattern / Fatigue Risk
    risk_level = Column(Text, nullable=True)  # Low / Medium / High
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=True)

    operator = relationship("User", back_populates="behavior_flags")
    machine = relationship("Machine", back_populates="behavior_flags")
