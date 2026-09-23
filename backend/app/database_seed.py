"""
Database Initialization and Seed Script for CatMate.
Populates:
- Sites (SITE01)
- Users (OP1001 Rahul Singh, OP1002, OP1003, MGR2001 Anita) with bcrypt pass123
- Machines (EXC001, EXC002, LDR001, DOZ001, TRK001)
- Tasks (T001, T002, T003 matching PRD Section 5)
- Training Modules (from training_modules.json)
- Sample Telemetry, Incidents, and Behavior Flags
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models.user import User, Site
from app.models.machine import Machine
from app.models.task import Task
from app.models.training import TrainingModule, TrainingAssignment
from app.models.telemetry import Telemetry
from app.models.incident import Incident
from app.models.behavior import BehaviorFlag
from app.services.auth_service import hash_password


def seed_database():
    print("[Seed] Creating database tables if not exist...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Sites
        site = db.query(Site).filter(Site.site_id == "SITE01").first()
        if not site:
            site = Site(
                site_id="SITE01",
                name="North Trench & Quarry Alpha",
                location="Sector 7 Heavy Earthworks"
            )
            db.add(site)
            db.commit()
            print("[Seed] Created SITE01")

        # 2. Users
        users_data = [
            {
                "user_id": "OP1001",
                "name": "Rahul Singh",
                "password": "pass123",
                "role": "operator",
                "site_id": "SITE01",
                "skill_level": "Intermediate",
            },
            {
                "user_id": "OP1002",
                "name": "Elena Rostova",
                "password": "pass123",
                "role": "operator",
                "site_id": "SITE01",
                "skill_level": "Expert",
            },
            {
                "user_id": "OP1003",
                "name": "Marcus Vance",
                "password": "pass123",
                "role": "operator",
                "site_id": "SITE01",
                "skill_level": "Beginner",
            },
            {
                "user_id": "MGR2001",
                "name": "Anita Sharma",
                "password": "pass123",
                "role": "manager",
                "site_id": "SITE01",
                "skill_level": "Expert",
            },
        ]

        for u in users_data:
            existing = db.query(User).filter(User.user_id == u["user_id"]).first()
            if not existing:
                user_obj = User(
                    user_id=u["user_id"],
                    name=u["name"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    site_id=u["site_id"],
                    skill_level=u["skill_level"],
                )
                db.add(user_obj)
        db.commit()
        print(f"[Seed] Users verified ({len(users_data)} users).")

        # 3. Machines
        machines_data = [
            {"machine_id": "EXC001", "model": "CAT 320 Hydraulic Excavator", "type": "Excavator", "age_years": 3},
            {"machine_id": "EXC002", "model": "CAT 336 Large Excavator", "type": "Excavator", "age_years": 5},
            {"machine_id": "LDR001", "model": "CAT 950M Wheel Loader", "type": "Wheel Loader", "age_years": 2},
            {"machine_id": "DOZ001", "model": "CAT D6 Track-Type Tractor", "type": "Dozer", "age_years": 4},
            {"machine_id": "TRK001", "model": "CAT 745 Articulated Truck", "type": "Dump Truck", "age_years": 4},
        ]
        for m in machines_data:
            existing = db.query(Machine).filter(Machine.machine_id == m["machine_id"]).first()
            if not existing:
                mach_obj = Machine(
                    machine_id=m["machine_id"],
                    model=m["model"],
                    type=m["type"],
                    age_years=m["age_years"],
                    site_id="SITE01"
                )
                db.add(mach_obj)
        db.commit()
        print(f"[Seed] Machines verified ({len(machines_data)} machines).")

        # 4. Training Modules
        modules_json = Path(__file__).resolve().parent.parent / "data" / "training_modules.json"
        if modules_json.exists():
            with open(modules_json, "r", encoding="utf-8") as f:
                modules_list = json.load(f)
            for m in modules_list:
                existing = db.query(TrainingModule).filter(TrainingModule.module_id == m["module_id"]).first()
                if not existing:
                    mod_obj = TrainingModule(
                        module_id=m["module_id"],
                        title=m["title"],
                        topic_tags=m.get("topic_tags", []),
                        video_url=m.get("video_url", ""),
                        duration_sec=m.get("duration_sec", 90),
                    )
                    db.add(mod_obj)
            db.commit()
            print(f"[Seed] Training modules loaded ({len(modules_list)} modules).")

        # 5. Scheduled Tasks
        today = datetime.utcnow().replace(hour=8, minute=0, second=0, microsecond=0)
        tasks_data = [
            {
                "task_id": "T001",
                "machine_id": "EXC001",
                "operator_id": "OP1001",
                "task_type": "Excavation",
                "zone": "North Trench",
                "scheduled_start": today,
                "estimated_time_min": 60,
                "actual_time_min": 58,
                "weather": "Sunny",
                "status": "completed",
            },
            {
                "task_id": "T002",
                "machine_id": "EXC001",
                "operator_id": "OP1001",
                "task_type": "Loading",
                "zone": "Bay 2",
                "scheduled_start": today + timedelta(hours=2),
                "estimated_time_min": 45,
                "actual_time_min": None,
                "weather": "Sunny",
                "status": "in_progress",
            },
            {
                "task_id": "T003",
                "machine_id": "EXC001",
                "operator_id": "OP1001",
                "task_type": "Trenching",
                "zone": "East Trench 4",
                "scheduled_start": today + timedelta(hours=5),
                "estimated_time_min": 50,
                "actual_time_min": None,
                "weather": "Sunny",
                "status": "pending",
            },
            {
                "task_id": "T004",
                "machine_id": "LDR001",
                "operator_id": "OP1002",
                "task_type": "Grading",
                "zone": "Haul Road A",
                "scheduled_start": today + timedelta(hours=1),
                "estimated_time_min": 40,
                "actual_time_min": None,
                "weather": "Sunny",
                "status": "in_progress",
            },
            {
                "task_id": "T005",
                "machine_id": "DOZ001",
                "operator_id": "OP1003",
                "task_type": "Hauling",
                "zone": "South Stockpile",
                "scheduled_start": today + timedelta(hours=3),
                "estimated_time_min": 55,
                "actual_time_min": 72,
                "weather": "Sunny",
                "status": "in_progress",
            },
        ]
        for t in tasks_data:
            existing = db.query(Task).filter(Task.task_id == t["task_id"]).first()
            if not existing:
                task_obj = Task(
                    task_id=t["task_id"],
                    machine_id=t["machine_id"],
                    operator_id=t["operator_id"],
                    task_type=t["task_type"],
                    zone=t["zone"],
                    scheduled_start=t["scheduled_start"],
                    estimated_time_min=t["estimated_time_min"],
                    actual_time_min=t["actual_time_min"],
                    weather=t["weather"],
                    status=t["status"],
                )
                db.add(task_obj)
        db.commit()
        print(f"[Seed] Tasks verified ({len(tasks_data)} tasks).")

        # 6. Initial Telemetry
        if db.query(Telemetry).count() == 0:
            now = datetime.utcnow()
            telemetry_records = [
                Telemetry(
                    machine_id="EXC001",
                    operator_id="OP1001",
                    timestamp=now - timedelta(minutes=5),
                    engine_hours=1524.8,
                    fuel_used_l=34.5,
                    load_cycles=14,
                    idling_time_min=18,
                    seatbelt_status="Fastened",
                    safety_alert_triggered=False
                ),
                Telemetry(
                    machine_id="LDR001",
                    operator_id="OP1002",
                    timestamp=now - timedelta(minutes=3),
                    engine_hours=982.1,
                    fuel_used_l=28.0,
                    load_cycles=22,
                    idling_time_min=8,
                    seatbelt_status="Fastened",
                    safety_alert_triggered=False
                ),
                Telemetry(
                    machine_id="DOZ001",
                    operator_id="OP1003",
                    timestamp=now - timedelta(minutes=2),
                    engine_hours=3412.3,
                    fuel_used_l=46.2,
                    load_cycles=8,
                    idling_time_min=48,  # Triggers idling flag
                    seatbelt_status="Unfastened",
                    safety_alert_triggered=True
                )
            ]
            db.add_all(telemetry_records)
            db.commit()
            print("[Seed] Initial telemetry readings added.")

        # 7. Initial Behavior Flags
        if db.query(BehaviorFlag).count() == 0:
            flags = [
                BehaviorFlag(
                    operator_id="OP1001",
                    machine_id="EXC001",
                    flag_type="Fatigue Risk",
                    risk_level="Medium",
                    details="Idling 52min + late-shift timestamp (2/3 conditions met)",
                    timestamp=datetime.utcnow() - timedelta(hours=2)
                ),
                BehaviorFlag(
                    operator_id="OP1003",
                    machine_id="DOZ001",
                    flag_type="Excessive Idling",
                    risk_level="High",
                    details="Idling reached 48 min (threshold: 45 min)",
                    timestamp=datetime.utcnow() - timedelta(hours=1)
                ),
                BehaviorFlag(
                    operator_id="OP1003",
                    machine_id="DOZ001",
                    flag_type="Critical Safety Pattern",
                    risk_level="Critical",
                    details="Seatbelt unfastened while safety proximity alert triggered",
                    timestamp=datetime.utcnow() - timedelta(minutes=30)
                )
            ]
            db.add_all(flags)
            db.commit()
            print("[Seed] Initial behavior flags added.")

        # 8. Initial Incidents
        if db.query(Incident).count() == 0:
            incidents = [
                Incident(
                    incident_id="INC0042",
                    operator_id="OP1001",
                    machine_id="EXC001",
                    raw_voice_text="hydraulic leak near the bucket cylinder spraying fluid",
                    incident_type="Hydraulic Leak",
                    location="Near Bucket",
                    severity="Medium",
                    timestamp=datetime.utcnow() - timedelta(hours=3)
                ),
                Incident(
                    incident_id="INC0043",
                    operator_id="OP1003",
                    machine_id="DOZ001",
                    raw_voice_text="rock roll near right track loose soil",
                    incident_type="Proximity Hazard",
                    location="Right Track",
                    severity="High",
                    timestamp=datetime.utcnow() - timedelta(hours=1)
                )
            ]
            db.add_all(incidents)
            db.commit()
            print("[Seed] Initial incidents logged.")

        # 9. Initial Training Assignments
        if db.query(TrainingAssignment).count() == 0:
            assignment = TrainingAssignment(
                operator_id="OP1001",
                module_id="M002",
                reason="Idling 52min detected in shift",
                assigned_at=datetime.utcnow() - timedelta(hours=2),
                completed=False
            )
            db.add(assignment)
            db.commit()
            print("[Seed] Initial training assignment added.")

        print("\n[Seed] DATABASE SEEDING COMPLETED SUCCESSFULLY!")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
