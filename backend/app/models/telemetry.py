"""Telemetry model."""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    machine_id = Column(Text, ForeignKey("machines.machine_id"), nullable=True)
    operator_id = Column(Text, ForeignKey("users.user_id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=True)
    engine_hours = Column(Float, nullable=True)
    fuel_used_l = Column(Float, nullable=True)
    load_cycles = Column(Integer, nullable=True)
    idling_time_min = Column(Integer, nullable=True)
    seatbelt_status = Column(Text, nullable=True)
    safety_alert_triggered = Column(Boolean, default=False, nullable=True)

    machine = relationship("Machine", back_populates="telemetry_logs")
