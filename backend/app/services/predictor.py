"""
Task Time Estimation ML Service (Section 6d).
Loads the trained Random Forest model artifact and runs inference.
"""

from pathlib import Path
from typing import Any, Dict, Optional
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "predictor.pkl"

DEFAULT_TASK_DURATIONS = {
    "excavation": 60,
    "loading": 45,
    "grading": 50,
    "trenching": 65,
    "hauling": 40,
}


class TaskTimePredictor:
    """
    Singleton predictor that loads the trained sklearn artifact from predictor.pkl
    and predicts task duration and confidence.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_path: Optional[Path] = None):
        if self._initialized:
            return

        self.model_path = model_path or MODEL_PATH
        self.artifact: Optional[Dict[str, Any]] = None
        self.pipeline = None
        self.metrics = {}
        self.residual_std = 5.3  # Fallback default from training

        self._load_model()
        self._initialized = True

    def _load_model(self) -> None:
        if self.model_path.exists():
            try:
                self.artifact = joblib.load(self.model_path)
                self.pipeline = self.artifact.get("pipeline")
                self.metrics = self.artifact.get("metrics", {})
                self.residual_std = self.metrics.get("residual_std", 5.3)
                print(f"[TaskTimePredictor] Successfully loaded model from {self.model_path}")
            except Exception as e:
                print(f"[TaskTimePredictor] Error loading model from {self.model_path}: {e}")
                self.pipeline = None
        else:
            print(f"[TaskTimePredictor] Model artifact not found at {self.model_path}. Fallback mode active.")
            self.pipeline = None

    def predict(
        self,
        task_type: str,
        weather: str,
        operator_skill: str,
        machine_age_yrs: float,
        estimated_time_min: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Runs ML prediction on input features.
        Returns:
            {
                "predicted_time_min": int,
                "baseline_estimate_min": int,
                "confidence": "high" | "medium" | "low"
            }
        """
        # Clean inputs
        clean_task_type = str(task_type).strip().title()
        clean_weather = str(weather).strip().title()
        clean_skill = str(operator_skill).strip().title()
        clean_age = float(machine_age_yrs)

        # Baseline estimate default if not provided
        if estimated_time_min is None or estimated_time_min <= 0:
            baseline = DEFAULT_TASK_DURATIONS.get(clean_task_type.lower(), 50)
        else:
            baseline = int(estimated_time_min)

        # Validate skill
        if clean_skill not in ["Beginner", "Intermediate", "Expert"]:
            clean_skill = "Intermediate"

        # Model inference if pipeline available
        if self.pipeline is not None:
            input_df = pd.DataFrame(
                [
                    {
                        "task_type": clean_task_type,
                        "weather": clean_weather,
                        "operator_skill": clean_skill,
                        "machine_age_yrs": clean_age,
                        "estimated_time_min": baseline,
                    }
                ]
            )
            try:
                raw_pred = self.pipeline.predict(input_df)[0]
                predicted_time = max(10, int(round(raw_pred)))
            except Exception as err:
                print(f"[TaskTimePredictor] Inference error: {err}. Using fallback heuristic.")
                predicted_time = self._fallback_heuristic(
                    baseline, clean_weather, clean_skill, clean_age
                )
        else:
            predicted_time = self._fallback_heuristic(
                baseline, clean_weather, clean_skill, clean_age
            )

        # Confidence calculation based on residual standard error vs predicted duration
        ratio = self.residual_std / max(1.0, float(predicted_time))
        if ratio < 0.10:
            confidence = "high"
        elif ratio < 0.20:
            confidence = "medium"
        else:
            confidence = "low"

        return {
            "predicted_time_min": predicted_time,
            "baseline_estimate_min": baseline,
            "confidence": confidence,
        }

    def _fallback_heuristic(
        self, baseline: int, weather: str, skill: str, machine_age: float
    ) -> int:
        """Deterministic physics/operations heuristic if ML artifact is unavailable."""
        weather_factors = {"Sunny": 0.95, "Windy": 1.05, "Rainy": 1.18, "Muddy": 1.25}
        skill_factors = {"Expert": 0.85, "Intermediate": 1.0, "Beginner": 1.22}
        age_factor = 1.0 + (machine_age * 0.015)

        factor = (
            weather_factors.get(weather, 1.0)
            * skill_factors.get(skill, 1.0)
            * age_factor
        )
        return max(10, int(round(baseline * factor)))


# Global accessor
predictor_service = TaskTimePredictor()
