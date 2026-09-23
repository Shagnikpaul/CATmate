"""Incidents model."""
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(Text, primary_key=True, index=True)
    operator_id = Column(Text, ForeignKey("users.user_id"), nullable=True)
    machine_id = Column(Text, ForeignKey("machines.machine_id"), nullable=True)
    raw_voice_text = Column(Text, nullable=True)
    incident_type = Column(Text, nullable=True)
    location = Column(Text, nullable=True)
    severity = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=True)

    operator = relationship("User", back_populates="incidents")
    machine = relationship("Machine", back_populates="incidents")
