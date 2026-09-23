"""
Synthetic Data Generator for CatMate
Generates:
1. telemetry.csv (~6,000 rows of realistic equipment shifts with injected flag scenarios)
2. task_history.csv (~800 rows for ML regression modeling)
3. training_modules.json (micro-learning video library matching behavior topics)
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd

# Set fixed random seed for reproducibility
np.random.seed(42)

DATA_DIR = Path(__file__).resolve().parent

# --- Configuration & Lookups ---
MACHINES = [
    {"machine_id": "EXC001", "model": "CAT 320 Hydraulic Excavator", "type": "Excavator", "age_years": 3, "base_hours": 1520.0},
    {"machine_id": "EXC002", "model": "CAT 336 Large Excavator", "type": "Excavator", "age_years": 5, "base_hours": 2840.0},
    {"machine_id": "EXC003", "model": "CAT 308 Mini Excavator", "type": "Excavator", "age_years": 1, "base_hours": 420.0},
    {"machine_id": "LDR001", "model": "CAT 950M Wheel Loader", "type": "Wheel Loader", "age_years": 2, "base_hours": 980.0},
    {"machine_id": "LDR002", "model": "CAT 966M Wheel Loader", "type": "Wheel Loader", "age_years": 4, "base_hours": 1820.0},
    {"machine_id": "DOZ001", "model": "CAT D6 Track-Type Tractor", "type": "Dozer", "age_years": 6, "base_hours": 3410.0},
    {"machine_id": "DOZ002", "model": "CAT D8 Heavy Crawler Dozer", "type": "Dozer", "age_years": 7, "base_hours": 4120.0},
    {"machine_id": "TRK001", "model": "CAT 745 Articulated Truck", "type": "Dump Truck", "age_years": 4, "base_hours": 2150.0},
]

OPERATORS = [
    {"operator_id": "OP1001", "name": "Rahul Singh", "skill_level": "Intermediate"},
    {"operator_id": "OP1002", "name": "Elena Rostova", "skill_level": "Expert"},
    {"operator_id": "OP1003", "name": "Marcus Vance", "skill_level": "Beginner"},
    {"operator_id": "OP1004", "name": "Amina Al-Mansoor", "skill_level": "Intermediate"},
    {"operator_id": "OP1005", "name": "David Chen", "skill_level": "Expert"},
    {"operator_id": "OP1006", "name": "Carlos Gomez", "skill_level": "Beginner"},
    {"operator_id": "OP1007", "name": "Sarah Jenkins", "skill_level": "Intermediate"},
    {"operator_id": "OP1008", "name": "Tariq Mahmood", "skill_level": "Expert"},
    {"operator_id": "OP1009", "name": "Priya Sharma", "skill_level": "Intermediate"},
    {"operator_id": "OP1010", "name": "John O'Connor", "skill_level": "Beginner"},
]

TASK_TYPES = ["Excavation", "Loading", "Grading", "Trenching", "Hauling"]
WEATHERS = ["Sunny", "Rainy", "Windy", "Muddy"]

TRAINING_MODULES = [
    {
        "module_id": "M001",
        "title": "Smooth Braking & Inertia Management",
        "topic_tags": ["braking", "safety", "wear_reduction"],
        "video_url": "https://assets.catmate.internal/videos/m001_smooth_braking.mp4",
        "duration_sec": 90,
        "description": "Techniques for gradual deceleration and hydraulic retarder engagement on steep grades."
    },
    {
        "module_id": "M002",
        "title": "Anti-Idling Protocols & Auto-Shutdown",
        "topic_tags": ["idling", "fuel_efficiency"],
        "video_url": "https://assets.catmate.internal/videos/m002_anti_idling.mp4",
        "duration_sec": 75,
        "description": "Configuring automatic engine idle shutdown (AIES) and cab climate management."
    },
    {
        "module_id": "M003",
        "title": "Eco-Mode Power Band Optimization",
        "topic_tags": ["fuel_efficiency", "hydraulics"],
        "video_url": "https://assets.catmate.internal/videos/m003_eco_mode.mp4",
        "duration_sec": 120,
        "description": "Maximizing hydraulic torque while operating within standard Eco-Mode RPM ranges."
    },
    {
        "module_id": "M004",
        "title": "3-Point Contact & In-Cab Harness Compliance",
        "topic_tags": ["safety", "seatbelt"],
        "video_url": "https://assets.catmate.internal/videos/m004_cab_safety.mp4",
        "duration_sec": 60,
        "description": "Mandatory safety interlock procedures, seatbelt tension verification, and egress safety."
    },
    {
        "module_id": "M005",
        "title": "Fatigue Mitigation & Shift Pacing",
        "topic_tags": ["fatigue", "safety", "wellness"],
        "video_url": "https://assets.catmate.internal/videos/m005_fatigue_mitigation.mp4",
        "duration_sec": 110,
        "description": "Recognizing early physical fatigue signs, micro-breaks, hydration, and cabin ergonomic setup."
    },
    {
        "module_id": "M006",
        "title": "Cycle Time Efficiency in Trenching Bay",
        "topic_tags": ["productivity", "trenching"],
        "video_url": "https://assets.catmate.internal/videos/m006_cycle_efficiency.mp4",
        "duration_sec": 95,
        "description": "Optimal bucket curl angles and swing arc control to minimize wasted cycle seconds."
    },
    {
        "module_id": "M007",
        "title": "Hydraulic Leak Detection & Daily Circle Inspection",
        "topic_tags": ["inspection", "safety", "maintenance"],
        "video_url": "https://assets.catmate.internal/videos/m007_circle_inspection.mp4",
        "duration_sec": 140,
        "description": "Ground-level inspection walkaround: checking cylinder seals, hoses, and sight gauges."
    },
    {
        "module_id": "M008",
        "title": "Blind Spot Awareness & Proximity Radar Protocol",
        "topic_tags": ["safety", "proximity", "awareness"],
        "video_url": "https://assets.catmate.internal/videos/m008_blindspot_protocol.mp4",
        "duration_sec": 85,
        "description": "Responding promptly to Cat Detect proximity warnings and establishing exclusion zones."
    },
    {
        "module_id": "M009",
        "title": "Heavy Mud & Slippery Grade Navigation",
        "topic_tags": ["weather", "traction", "safety"],
        "video_url": "https://assets.catmate.internal/videos/m009_mud_traction.mp4",
        "duration_sec": 105,
        "description": "Differential lock utilization and track slippage prevention in rainy conditions."
    },
    {
        "module_id": "M010",
        "title": "Loading Bay Spillage & Payload Management",
        "topic_tags": ["fuel_efficiency", "productivity"],
        "video_url": "https://assets.catmate.internal/videos/m010_payload_control.mp4",
        "duration_sec": 90,
        "description": "Centering bucket payloads over haul trucks to reduce tire wear and spillage re-work."
    }
]


def generate_task_history(num_records: int = 800) -> pd.DataFrame:
    """
    Generate realistic task history dataset for task duration regression.
    Signal formula:
    actual = estimated * weather_factor * skill_factor * age_factor + noise
    """
    records = []
    
    weather_multipliers = {
        "Sunny": 0.95,
        "Windy": 1.05,
        "Rainy": 1.22,
        "Muddy": 1.32,
    }
    
    skill_multipliers = {
        "Beginner": 1.22,
        "Intermediate": 1.00,
        "Expert": 0.84,
    }
    
    task_base_estimates = {
        "Excavation": (45, 90),
        "Loading": (30, 60),
        "Grading": (40, 75),
        "Trenching": (50, 100),
        "Hauling": (25, 55),
    }

    for i in range(1, num_records + 1):
        task_id = f"TH{i:04d}"
        task_type = np.random.choice(TASK_TYPES)
        weather = np.random.choice(WEATHERS, p=[0.45, 0.25, 0.20, 0.10])
        
        op = np.random.choice(OPERATORS)
        skill = op["skill_level"]
        
        mach = np.random.choice(MACHINES)
        age_yrs = mach["age_years"]
        
        min_est, max_est = task_base_estimates[task_type]
        estimated_time = int(np.random.randint(min_est, max_est + 1))
        
        # Calculate structured synthetic signal
        w_factor = weather_multipliers[weather]
        s_factor = skill_multipliers[skill]
        age_factor = 1.0 + (age_yrs * 0.015)  # slight machine degradation
        
        mean_actual = estimated_time * w_factor * s_factor * age_factor
        noise = np.random.normal(loc=0.0, scale=3.5)
        actual_time = int(max(15, round(mean_actual + noise)))
        
        records.append({
            "task_id": task_id,
            "task_type": task_type,
            "weather": weather,
            "operator_skill": skill,
            "machine_age_yrs": age_yrs,
            "estimated_time_min": estimated_time,
            "actual_time_min": actual_time
        })
        
    df = pd.DataFrame(records)
    return df


def generate_telemetry_dataset(days: int = 14) -> pd.DataFrame:
    """
    Generate ~6,000 telemetry rows across 14 days of realistic shifts.
    Each shift is simulated as a sequence of timestamped readings (every 15 mins).
    Controlled injection of flag scenarios for behavior and safety detection:
    - ~10% excessive idling (> 45 min)
    - ~10% fuel inefficiency (fuel used / load cycles > 1.5x baseline)
    - ~8% low productivity (cycles < 3 and idling > 30)
    - ~15% critical safety pattern (unfastened seatbelt + safety alert)
    - ~12% fatigue risk (late shift + extended shift engine hours + high idling)
    """
    records = []
    current_engine_hours = {m["machine_id"]: m["base_hours"] for m in MACHINES}
    
    base_date = datetime(2026, 9, 10, 7, 0, 0)
    
    record_id = 1
    
    for day in range(days):
        shift_date = base_date + timedelta(days=day)
        
        # Simulate active machine-operator pairings for the day
        for mach_idx, machine in enumerate(MACHINES):
            machine_id = machine["machine_id"]
            # Assign operator (with Rahul OP1001 frequently on EXC001 for demo consistency)
            if machine_id == "EXC001" and day % 2 == 0:
                operator = OPERATORS[0]  # Rahul Singh
            else:
                operator = OPERATORS[(mach_idx + day) % len(OPERATORS)]
                
            operator_id = operator["operator_id"]
            
            # 8-hour shift, reading every 15 minutes = 32 readings per shift
            num_readings = 32
            shift_start = shift_date.replace(hour=7, minute=0, second=0)
            
            shift_fuel_cumulative = 0.0
            shift_cycles_cumulative = 0
            
            # Shift scenario flags to ensure controlled scenario distributions
            force_unfastened_alert_window = (day % 3 == 0 and mach_idx in (0, 2))
            force_high_idling = (day % 4 == 0 and mach_idx in (1, 3))
            force_fatigue_pattern = (day % 5 == 0 and mach_idx == 0) # Rahul late shift fatigue demo
            
            for step in range(num_readings):
                timestamp = shift_start + timedelta(minutes=step * 15)
                hour = timestamp.hour
                
                # Active vs Idle determination
                is_idling = False
                idling_time_min = 0
                
                if force_high_idling and step >= 20:
                    idling_time_min = int(np.random.randint(46, 68))
                    is_idling = True
                elif force_fatigue_pattern and step >= 24: # late shift 13:00+
                    idling_time_min = int(np.random.randint(42, 55))
                    is_idling = True
                else:
                    if np.random.rand() < 0.12:
                        idling_time_min = int(np.random.randint(10, 48))
                        if idling_time_min > 20:
                            is_idling = True
                    else:
                        idling_time_min = int(np.random.randint(0, 10))

                # Increment engine hours realistically
                engine_inc = 0.25 if not is_idling else 0.15
                current_engine_hours[machine_id] = round(current_engine_hours[machine_id] + engine_inc, 2)
                
                # Fuel consumed in 15 mins (liters)
                if is_idling:
                    fuel_delta = round(float(np.random.uniform(1.2, 2.5)), 2)
                    load_cycles_delta = 0
                else:
                    fuel_delta = round(float(np.random.uniform(4.5, 9.5)), 2)
                    load_cycles_delta = int(np.random.randint(1, 4))
                    
                # Fuel inefficiency scenario
                if day % 6 == 0 and mach_idx == 1 and not is_idling:
                    fuel_delta = round(fuel_delta * 2.2, 2) # fuel spike
                    
                shift_fuel_cumulative = round(shift_fuel_cumulative + fuel_delta, 2)
                shift_cycles_cumulative += load_cycles_delta
                
                # Seatbelt status & safety alert
                if force_unfastened_alert_window and 10 <= step <= 15:
                    seatbelt_status = "Unfastened"
                    safety_alert_triggered = True
                else:
                    if np.random.rand() < 0.08:
                        seatbelt_status = "Unfastened"
                        safety_alert_triggered = bool(np.random.rand() < 0.60)
                    else:
                        seatbelt_status = "Fastened"
                        safety_alert_triggered = False
                        
                records.append({
                    "id": record_id,
                    "machine_id": machine_id,
                    "operator_id": operator_id,
                    "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "engine_hours": current_engine_hours[machine_id],
                    "fuel_used_l": shift_fuel_cumulative,
                    "load_cycles": shift_cycles_cumulative,
                    "idling_time_min": idling_time_min,
                    "seatbelt_status": seatbelt_status,
                    "safety_alert_triggered": safety_alert_triggered
                })
                record_id += 1

    df = pd.DataFrame(records)
    return df


def main():
    print(f"Generating synthetic datasets in {DATA_DIR}...")
    
    # 1. Generate Task History
    task_df = generate_task_history(num_records=850)
    task_csv_path = DATA_DIR / "task_history.csv"
    task_df.to_csv(task_csv_path, index=False)
    print(f"[OK] Created {task_csv_path} with {len(task_df)} rows")
    
    # 2. Generate Telemetry Log
    telemetry_df = generate_telemetry_dataset(days=21)
    telemetry_csv_path = DATA_DIR / "telemetry.csv"
    telemetry_df.to_csv(telemetry_csv_path, index=False)
    print(f"[OK] Created {telemetry_csv_path} with {len(telemetry_df)} rows")
    
    # 3. Generate Training Modules Metadata
    training_json_path = DATA_DIR / "training_modules.json"
    with open(training_json_path, "w", encoding="utf-8") as f:
        json.dump(TRAINING_MODULES, f, indent=2)
    print(f"[OK] Created {training_json_path} with {len(TRAINING_MODULES)} modules")
    
    # Quick sanity summary
    print("\n--- Telemetry Scenario Inspection ---")
    high_idle_cnt = len(telemetry_df[telemetry_df["idling_time_min"] > 45])
    crit_safety_cnt = len(telemetry_df[(telemetry_df["seatbelt_status"] == "Unfastened") & (telemetry_df["safety_alert_triggered"] == True)])
    print(f"Excessive Idling (>45 min) rows: {high_idle_cnt} ({high_idle_cnt/len(telemetry_df):.1%})")
    print(f"Critical Safety (Unfastened + Alert) rows: {crit_safety_cnt} ({crit_safety_cnt/len(telemetry_df):.1%})")
    print(f"Total Telemetry Readings: {len(telemetry_df)}")
    print("Done!")


if __name__ == "__main__":
    main()
