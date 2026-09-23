"""Machines, machine manuals, and manual chunks models."""
from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Machine(Base):
    __tablename__ = "machines"

    machine_id = Column(Text, primary_key=True, index=True)  # e.g. EXC001
    model = Column(Text, nullable=True)
    type = Column(Text, nullable=True)
    age_years = Column(Integer, nullable=True)
    site_id = Column(Text, ForeignKey("sites.site_id"), nullable=True)

    site = relationship("Site", back_populates="machines")
    manuals = relationship("MachineManual", back_populates="machine")
    tasks = relationship("Task", back_populates="machine")
    telemetry_logs = relationship("Telemetry", back_populates="machine")
    incidents = relationship("Incident", back_populates="machine")
    behavior_flags = relationship("BehaviorFlag", back_populates="machine")

class MachineManual(Base):
    __tablename__ = "machine_manuals"

    manual_id = Column(Text, primary_key=True, index=True)
    machine_id = Column(Text, ForeignKey("machines.machine_id"), nullable=True)
    title = Column(Text, nullable=True)
    source_pdf_path = Column(Text, nullable=True)

    machine = relationship("Machine", back_populates="manuals")
    chunks = relationship("ManualChunk", back_populates="manual", cascade="all, delete-orphan")

class ManualChunk(Base):
    __tablename__ = "manual_chunks"

    chunk_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    manual_id = Column(Text, ForeignKey("machine_manuals.manual_id"), nullable=True)
    chunk_text = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)

    manual = relationship("MachineManual", back_populates="chunks")
