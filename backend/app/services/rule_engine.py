"""
Operator Behavior & Fatigue Rule Engine (Section 6c)

Implements the 5 core behavioral/fatigue flag rules:
1. Excessive Idling: Idling Time > 45 min
2. Fuel Inefficiency: Fuel Used / Load Cycles > 1.5x operator's own average
3. Low Productivity: Cycles < 3 AND Idling > 30 min
4. Critical Safety Pattern: Seatbelt Unfastened + Alert Triggered = True
5. Fatigue Risk (composite): Idling + Engine Hours trend + Timestamp (late shift) (>= 2 true)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import pandas as pd


class BehaviorRuleEngine:
    """
    Evaluates telemetry readings against CAT safety, efficiency, and fatigue rules.
    Provides batch processing for telemetry dataframes and single-event evaluation.
    """

    DEFAULT_BASELINE_FUEL_PER_CYCLE = 2.85  # Liters per load cycle default

    def __init__(self, baseline_ratios: Optional[Dict[str, float]] = None):
        """
        :param baseline_ratios: Optional map of operator_id -> baseline fuel_used / load_cycles ratio
        """
        self.baseline_ratios: Dict[str, float] = baseline_ratios or {}

    def calculate_baselines_from_df(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Compute each operator's average fuel consumed per load cycle across historical shifts.
        """
        valid_df = df[(df["load_cycles"] > 0) & (df["fuel_used_l"] > 0)].copy()
        if valid_df.empty:
            return {}

        valid_df["fuel_per_cycle"] = valid_df["fuel_used_l"] / valid_df["load_cycles"]
        grouped = valid_df.groupby("operator_id")["fuel_per_cycle"].median().to_dict()
        self.baseline_ratios.update(grouped)
        return self.baseline_ratios

    def get_operator_baseline(self, operator_id: str) -> float:
        return self.baseline_ratios.get(operator_id, self.DEFAULT_BASELINE_FUEL_PER_CYCLE)

    def evaluate_telemetry_event(
        self,
        record: Dict[str, Any],
        shift_start_engine_hours: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate a single telemetry event (dict) and return a list of triggered flags.
        Flag schema:
        {
            "operator_id": str,
            "machine_id": str,
            "flag_type": str,
            "risk_level": "Low" | "Medium" | "High" | "Critical",
            "details": str,
            "timestamp": str
        }
        """
        flags: List[Dict[str, Any]] = []

        operator_id = record.get("operator_id", "UNKNOWN")
        machine_id = record.get("machine_id", "UNKNOWN")
        timestamp_raw = record.get("timestamp")
        
        # Parse timestamp
        if isinstance(timestamp_raw, str):
            try:
                dt = datetime.fromisoformat(timestamp_raw)
            except ValueError:
                dt = datetime.strptime(timestamp_raw, "%Y-%m-%d %H:%M:%S")
        elif isinstance(timestamp_raw, datetime):
            dt = timestamp_raw
        else:
            dt = datetime.now()

        timestamp_str = dt.isoformat()

        # Telemetry metrics
        idling_time = float(record.get("idling_time_min", 0))
        fuel_used = float(record.get("fuel_used_l", 0.0))
        load_cycles = int(record.get("load_cycles", 0))
        engine_hours = float(record.get("engine_hours", 0.0))
        seatbelt = str(record.get("seatbelt_status", "Fastened")).strip().title()
        alert_triggered = bool(record.get("safety_alert_triggered", False))

        # --- Rule 1: Excessive Idling (Idling Time > 45 min) ---
        if idling_time > 45:
            risk = "High" if idling_time >= 60 else "Medium"
            flags.append({
                "operator_id": operator_id,
                "machine_id": machine_id,
                "flag_type": "Excessive Idling",
                "risk_level": risk,
                "details": f"Machine idling reached {int(idling_time)} min (threshold: 45 min). Recommend auto-shutdown check.",
                "timestamp": timestamp_str
            })

        # --- Rule 2: Fuel Inefficiency (Fuel Used ÷ Load Cycles > 1.5× baseline) ---
        if load_cycles >= 3 and fuel_used > 5.0:
            current_ratio = fuel_used / load_cycles
            op_baseline = self.get_operator_baseline(operator_id)
            if current_ratio > (1.5 * op_baseline):
                ratio_pct = int(((current_ratio / op_baseline) - 1.0) * 100)
                risk = "High" if ratio_pct >= 80 else "Medium"
                flags.append({
                    "operator_id": operator_id,
                    "machine_id": machine_id,
                    "flag_type": "Fuel Inefficiency",
                    "risk_level": risk,
                    "details": f"Burn rate is {current_ratio:.2f} L/cycle (+{ratio_pct}% above operator baseline of {op_baseline:.2f} L/cycle).",
                    "timestamp": timestamp_str
                })

        # --- Rule 3: Low Productivity (Load Cycles < 3 AND Idling > 30 min) ---
        if load_cycles < 3 and idling_time > 30:
            flags.append({
                "operator_id": operator_id,
                "machine_id": machine_id,
                "flag_type": "Low Productivity",
                "risk_level": "Medium",
                "details": f"Low output: only {load_cycles} load cycles logged with {int(idling_time)} min idling time.",
                "timestamp": timestamp_str
            })

        # --- Rule 4: Critical Safety Pattern (Unfastened + Alert Triggered) ---
        if seatbelt.lower() == "unfastened" and alert_triggered:
            flags.append({
                "operator_id": operator_id,
                "machine_id": machine_id,
                "flag_type": "Critical Safety Pattern",
                "risk_level": "Critical",
                "details": "CRITICAL HAZARD: Machine safety alert active while seatbelt remains unfastened.",
                "timestamp": timestamp_str
            })

        # --- Rule 5: Fatigue Risk (composite >= 2 conditions) ---
        # Condition A: Sluggish pacing / prolonged idling (>= 40 min)
        cond_idling = idling_time >= 40
        
        # Condition B: High continuous engine hours in current shift (>= 5.5 hours)
        shift_hours = (engine_hours - shift_start_engine_hours) if shift_start_engine_hours else 0.0
        cond_shift_strain = shift_hours >= 5.5
        
        # Condition C: Late shift timestamp (13:30 or later, post-lunch circadian drop or end-of-shift)
        cond_late_shift = dt.hour >= 14 or (dt.hour == 13 and dt.minute >= 30)

        fatigue_reasons = []
        if cond_idling:
            fatigue_reasons.append(f"prolonged idling ({int(idling_time)}m)")
        if cond_shift_strain:
            fatigue_reasons.append(f"extended shift operation ({shift_hours:.1f}h)")
        if cond_late_shift:
            fatigue_reasons.append(f"late-shift window ({dt.strftime('%H:%M')})")

        if len(fatigue_reasons) >= 2:
            risk = "High" if len(fatigue_reasons) >= 3 else "Medium"
            flags.append({
                "operator_id": operator_id,
                "machine_id": machine_id,
                "flag_type": "Fatigue Risk",
                "risk_level": risk,
                "details": f"Composite fatigue risk detected ({len(fatigue_reasons)}/3 criteria): {', '.join(fatigue_reasons)}.",
                "timestamp": timestamp_str
            })

        return flags

    def evaluate_telemetry_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Batch-evaluate an entire telemetry dataframe, tracking shift engine hours per shift.
        """
        if df.empty:
            return []

        # Update baselines first if not already present
        if not self.baseline_ratios:
            self.calculate_baselines_from_df(df)

        all_flags: List[Dict[str, Any]] = []
        
        # Sort chronologically
        df_sorted = df.sort_values(by=["operator_id", "machine_id", "timestamp"]).copy()
        
        # Track shift baseline engine hours per (operator, machine, date)
        if "timestamp" in df_sorted.columns:
            df_sorted["shift_date"] = pd.to_datetime(df_sorted["timestamp"]).dt.date
        else:
            df_sorted["shift_date"] = "default"

        shift_min_hours = df_sorted.groupby(["operator_id", "machine_id", "shift_date"])["engine_hours"].min().to_dict()

        for _, row in df_sorted.iterrows():
            record = row.to_dict()
            op = record.get("operator_id")
            mach = record.get("machine_id")
            s_date = record.get("shift_date")
            min_hrs = shift_min_hours.get((op, mach, s_date), record.get("engine_hours", 0.0))
            
            flags = self.evaluate_telemetry_event(record, shift_start_engine_hours=min_hrs)
            all_flags.extend(flags)

        return all_flags


# Singleton instance for simple imports
rule_engine = BehaviorRuleEngine()


def evaluate_operator_telemetry(db: Any, operator_id: str, date_str: Optional[str] = None) -> List[Any]:
    """
    Evaluates telemetry readings for a given operator (and optional date),
    persists any triggered BehaviorFlag objects in the database, and returns them.
    """
    from app.models.telemetry import Telemetry
    from app.models.behavior import BehaviorFlag
    from sqlalchemy import func

    # Query telemetry from DB
    query = db.query(Telemetry).filter(Telemetry.operator_id == operator_id)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(func.date(Telemetry.timestamp) == target_date)
        except Exception:
            pass

    telemetry_records = query.order_by(Telemetry.timestamp.asc()).all()
    created_flags = []

    if telemetry_records:
        min_hours = min((t.engine_hours or 0.0 for t in telemetry_records), default=0.0)
        for t in telemetry_records:
            rec = {
                "operator_id": t.operator_id,
                "machine_id": t.machine_id,
                "timestamp": t.timestamp,
                "engine_hours": t.engine_hours,
                "fuel_used_l": t.fuel_used_l,
                "load_cycles": t.load_cycles,
                "idling_time_min": t.idling_time_min,
                "seatbelt_status": t.seatbelt_status,
                "safety_alert_triggered": t.safety_alert_triggered,
            }
            flags = rule_engine.evaluate_telemetry_event(rec, shift_start_engine_hours=min_hours)
            for f in flags:
                flag_obj = BehaviorFlag(
                    operator_id=f["operator_id"],
                    machine_id=f["machine_id"],
                    flag_type=f["flag_type"],
                    risk_level=f["risk_level"],
                    details=f["details"],
                    timestamp=datetime.fromisoformat(f["timestamp"]) if isinstance(f["timestamp"], str) else f["timestamp"]
                )
                db.add(flag_obj)
                created_flags.append(flag_obj)
        db.commit()
    else:
        # Fallback evaluation: check telemetry.csv
        from pathlib import Path
        csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "telemetry.csv"
        if csv_path.exists():
            tdf = pd.read_csv(csv_path)
            op_df = tdf[tdf["operator_id"] == operator_id].copy()
            if not op_df.empty:
                op_df["timestamp"] = pd.to_datetime(op_df["timestamp"])
                if date_str:
                    op_df = op_df[op_df["timestamp"].dt.strftime("%Y-%m-%d") == date_str]
                flag_dicts = rule_engine.evaluate_telemetry_dataframe(op_df)
                for f in flag_dicts[:5]:  # Take top 5
                    ts = f["timestamp"]
                    if isinstance(ts, str):
                        try:
                            ts_dt = datetime.fromisoformat(ts)
                        except Exception:
                            ts_dt = datetime.utcnow()
                    else:
                        ts_dt = datetime.utcnow()

                    flag_obj = BehaviorFlag(
                        operator_id=f["operator_id"],
                        machine_id=f["machine_id"],
                        flag_type=f["flag_type"],
                        risk_level=f["risk_level"],
                        details=f["details"],
                        timestamp=ts_dt
                    )
                    db.add(flag_obj)
                    created_flags.append(flag_obj)
                db.commit()

    return created_flags

