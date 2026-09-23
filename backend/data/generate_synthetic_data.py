"""Script to generate realistic synthetic seed data and load it into Supabase PostgreSQL."""
import os
import sys
import random
from datetime import datetime, timedelta

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import Site, User, Session as UserSession
from app.models.machine import Machine, MachineManual, ManualChunk
from app.models.task import Task
from app.models.telemetry import Telemetry
from app.models.incident import Incident
from app.models.behavior import BehaviorFlag
from app.models.training import TrainingModule, TrainingAssignment
from app.services.auth_service import hash_password

def seed_database():
    print("Starting synthetic data generation and seeding...")
    db: Session = SessionLocal()
    try:
        # 1. Sites
        sites_data = [
            Site(site_id="SITE01", name="North Valley Quarry", location="Sector 4B, Apex Ridge"),
            Site(site_id="SITE02", name="East Metro Excavation Hub", location="Zone 12, Terminal Bay")
        ]
        for s in sites_data:
            existing = db.query(Site).filter(Site.site_id == s.site_id).first()
            if not existing:
                db.add(s)
        db.commit()
        print("[+] Sites seeded")

        # 2. Users (Operators & Manager with pass123)
        common_password_hash = hash_password("pass123")
        users_data = [
            User(
                user_id="OP1001",
                name="Rahul Singh",
                password_hash=common_password_hash,
                role="operator",
                site_id="SITE01",
                skill_level="Intermediate"
            ),
            User(
                user_id="OP1002",
                name="Marcus Chen",
                password_hash=common_password_hash,
                role="operator",
                site_id="SITE01",
                skill_level="Expert"
            ),
            User(
                user_id="OP1003",
                name="Sarah Jenkins",
                password_hash=common_password_hash,
                role="operator",
                site_id="SITE01",
                skill_level="Beginner"
            ),
            User(
                user_id="MGR2001",
                name="Anita Sharma",
                password_hash=common_password_hash,
                role="manager",
                site_id="SITE01",
                skill_level="Expert"
            )
        ]
        for u in users_data:
            existing = db.query(User).filter(User.user_id == u.user_id).first()
            if not existing:
                db.add(u)
            else:
                existing.password_hash = common_password_hash
        db.commit()
        print("[+] Users seeded (OP1001, OP1002, OP1003, MGR2001 with password 'pass123')")

        # 3. Machines
        machines_data = [
            Machine(machine_id="EXC001", model="CAT 320 Next Gen", type="Hydraulic Excavator", age_years=3, site_id="SITE01"),
            Machine(machine_id="EXC002", model="CAT 336 Heavy", type="Large Excavator", age_years=2, site_id="SITE01"),
            Machine(machine_id="DOZ001", model="CAT D6T", type="Track Bulldozer", age_years=5, site_id="SITE01"),
            Machine(machine_id="LDR001", model="CAT 950M", type="Wheel Loader", age_years=4, site_id="SITE01")
        ]
        for m in machines_data:
            existing = db.query(Machine).filter(Machine.machine_id == m.machine_id).first()
            if not existing:
                db.add(m)
        db.commit()
        print("[+] Machines seeded")

        # 4. Machine Manuals & Chunks
        manual = db.query(MachineManual).filter(MachineManual.manual_id == "MAN001").first()
        if not manual:
            manual = MachineManual(
                manual_id="MAN001",
                machine_id="EXC001",
                title="CAT 320 Hydraulic Excavator Operation and Maintenance Manual",
                source_pdf_path="backend/data/manuals/cat_320_manual.pdf"
            )
            db.add(manual)
            db.commit()

            chunks_data = [
                ManualChunk(
                    manual_id="MAN001",
                    page_number=42,
                    chunk_text="Hydraulic Fluid Level Check: Park the machine on level ground, lower bucket to ground, and check the sight gauge on the left side of the hydraulic tank. Oil level should be between ADD and FULL marks."
                ),
                ManualChunk(
                    manual_id="MAN001",
                    page_number=15,
                    chunk_text="Seatbelt and Safety Controls: Inspect webbing before shift. Fasten buckle securely across hips. Proximity radar and cameras automatically calibrate when key is turned to ON position."
                ),
                ManualChunk(
                    manual_id="MAN001",
                    page_number=78,
                    chunk_text="Engine Oil and Fluids: Check dipstick on the right engine service door. Capacity is 25 liters of Cat 15W-40 DEO. Replace fuel filters every 500 hours."
                )
            ]
            db.add_all(chunks_data)
            db.commit()
            print("[+] Machine manuals & RAG chunks seeded")

        # 5. Today's Tasks
        now = datetime.utcnow()
        today_tasks_data = [
            Task(
                task_id="T001",
                machine_id="EXC001",
                operator_id="OP1001",
                task_type="Excavation",
                zone="North Trench",
                scheduled_start=now.replace(hour=8, minute=0, second=0),
                estimated_time_min=60,
                actual_time_min=55,
                weather="Sunny",
                status="completed"
            ),
            Task(
                task_id="T002",
                machine_id="EXC001",
                operator_id="OP1001",
                task_type="Loading",
                zone="Bay 2",
                scheduled_start=now.replace(hour=10, minute=0, second=0),
                estimated_time_min=45,
                actual_time_min=30,
                weather="Sunny",
                status="in_progress"
            ),
            Task(
                task_id="T003",
                machine_id="EXC001",
                operator_id="OP1001",
                task_type="Trenching",
                zone="South Sector",
                scheduled_start=now.replace(hour=13, minute=30, second=0),
                estimated_time_min=50,
                actual_time_min=None,
                weather="Sunny",
                status="pending"
            ),
            Task(
                task_id="T004",
                machine_id="DOZ001",
                operator_id="OP1002",
                task_type="Grading",
                zone="East Ramp",
                scheduled_start=now.replace(hour=9, minute=0, second=0),
                estimated_time_min=40,
                actual_time_min=38,
                weather="Sunny",
                status="completed"
            ),
            Task(
                task_id="T005",
                machine_id="LDR001",
                operator_id="OP1003",
                task_type="Stockpile Loading",
                zone="Bay 1",
                scheduled_start=now.replace(hour=8, minute=30, second=0),
                estimated_time_min=45,
                actual_time_min=65,
                weather="Sunny",
                status="in_progress"
            )
        ]
        for t in today_tasks_data:
            existing = db.query(Task).filter(Task.task_id == t.task_id).first()
            if not existing:
                db.add(t)
        db.commit()
        print("[+] Tasks seeded")

        # 6. Training Modules
        training_modules_data = [
            TrainingModule(
                module_id="M001",
                title="Smooth Operation & Anti-Idling Mastery",
                topic_tags=["idling", "fuel_efficiency", "smooth_operation"],
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration_sec=90
            ),
            TrainingModule(
                module_id="M002",
                title="Heavy Loading Cycle Fuel Efficiency",
                topic_tags=["fuel_efficiency", "loading", "productivity"],
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration_sec=120
            ),
            TrainingModule(
                module_id="M003",
                title="Seatbelt & Proximity Blind-Spot Protocol",
                topic_tags=["safety", "seatbelt", "proximity"],
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration_sec=60
            ),
            TrainingModule(
                module_id="M004",
                title="Fatigue Recognition & Shift Rhythm Pacing",
                topic_tags=["fatigue", "wellness", "safety", "shift_management"],
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration_sec=150
            ),
            TrainingModule(
                module_id="M005",
                title="Track Wear & Progressive Braking Control",
                topic_tags=["braking", "smooth_operation", "undercarriage"],
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                duration_sec=90
            )
        ]
        for tm in training_modules_data:
            existing = db.query(TrainingModule).filter(TrainingModule.module_id == tm.module_id).first()
            if not existing:
                db.add(tm)
        db.commit()
        print("[+] Training modules seeded")

        # 7. Telemetry Data
        if db.query(Telemetry).count() < 20:
            telemetry_records = []
            base_engine_hours = 1520.0
            for i in range(30):
                t_stamp = now - timedelta(hours=(30 - i) * 0.5)
                # Create some variation and safety condition spikes
                is_unfastened = (i in [14, 22])
                alert = (i in [14, 25])
                idling_min = 52 if i in [8, 18] else random.randint(5, 25)
                fuel_l = round(12.0 + (i * 1.8), 1)
                cycles = random.randint(2, 8)

                telemetry_records.append(
                    Telemetry(
                        machine_id="EXC001",
                        operator_id="OP1001",
                        timestamp=t_stamp,
                        engine_hours=round(base_engine_hours + (i * 0.4), 1),
                        fuel_used_l=fuel_l,
                        load_cycles=cycles,
                        idling_time_min=idling_min,
                        seatbelt_status="Unfastened" if is_unfastened else "Fastened",
                        safety_alert_triggered=alert
                    )
                )
            db.add_all(telemetry_records)
            db.commit()
            print(f"[+] {len(telemetry_records)} Telemetry rows seeded")

        # 8. Incidents
        incidents_data = [
            Incident(
                incident_id="INC0042",
                operator_id="OP1001",
                machine_id="EXC001",
                raw_voice_text="hydraulic leak noticed near the bucket linkage",
                incident_type="Hydraulic Leak",
                location="Near Bucket / Front Attachment",
                severity="Medium",
                photo_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
                timestamp=now - timedelta(hours=2)
            ),
            Incident(
                incident_id="INC0043",
                operator_id="OP1003",
                machine_id="LDR001",
                raw_voice_text="ground instability and loose gravel near Trench 3 slope",
                incident_type="Site Hazard",
                location="Trench 3 Slope",
                severity="High",
                photo_url=None,
                timestamp=now - timedelta(hours=4)
            )
        ]
        for inc in incidents_data:
            existing = db.query(Incident).filter(Incident.incident_id == inc.incident_id).first()
            if not existing:
                db.add(inc)
        db.commit()
        print("[+] Incidents seeded")

        # 9. Behavior Flags
        flags_data = [
            BehaviorFlag(
                operator_id="OP1001",
                machine_id="EXC001",
                flag_type="Fatigue Risk",
                risk_level="Medium",
                details="Idling 52min + late-shift timestamp (2/3 conditions met)",
                timestamp=now - timedelta(hours=1, minutes=30)
            ),
            BehaviorFlag(
                operator_id="OP1001",
                machine_id="EXC001",
                flag_type="Excessive Idling",
                risk_level="Medium",
                details="Continuous idling recorded at 52 min (threshold: 45 min)",
                timestamp=now - timedelta(hours=3)
            ),
            BehaviorFlag(
                operator_id="OP1003",
                machine_id="LDR001",
                flag_type="Critical Safety Pattern",
                risk_level="High",
                details="Proximity safety alert triggered while seatbelt was unfastened",
                timestamp=now - timedelta(hours=5)
            )
        ]
        for f in flags_data:
            existing = db.query(BehaviorFlag).filter(
                BehaviorFlag.operator_id == f.operator_id,
                BehaviorFlag.flag_type == f.flag_type
            ).first()
            if not existing:
                db.add(f)
        db.commit()
        print("[+] Behavior flags seeded")

        # 10. Training Assignment
        assn = db.query(TrainingAssignment).filter(TrainingAssignment.operator_id == "OP1001").first()
        if not assn:
            assn = TrainingAssignment(
                operator_id="OP1001",
                module_id="M001",
                reason="Idling 52min & fuel inefficiency spike",
                assigned_at=now - timedelta(hours=1),
                completed=False
            )
            db.add(assn)
            db.commit()
            print("[+] Training assignment seeded")

        print("\nAll synthetic database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}", file=sys.stderr)
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
