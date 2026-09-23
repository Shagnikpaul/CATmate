"""
Script to train and pickle the task-time regression model (Section 6d).

Features:
- task_type: One-Hot Encoded
- weather: One-Hot Encoded
- operator_skill: Ordinal Encoded (Beginner=0, Intermediate=1, Expert=2)
- machine_age_yrs: Numeric Standard Scaler
- estimated_time_min: Numeric Standard Scaler

Target:
- actual_time_min: Numeric
"""

import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
DATA_FILE = BASE_DIR / "data" / "task_history.csv"
MODEL_OUTPUT_FILE = Path(__file__).resolve().parent / "predictor.pkl"


def load_data(data_path: Path) -> pd.DataFrame:
    if not data_path.exists():
        raise FileNotFoundError(f"Task history dataset not found at {data_path}")
    df = pd.read_csv(data_path)
    required_cols = [
        "task_type",
        "weather",
        "operator_skill",
        "machine_age_yrs",
        "estimated_time_min",
        "actual_time_min",
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in dataset: {missing}")
    return df


def build_preprocessor() -> ColumnTransformer:
    cat_features = ["task_type", "weather"]
    ordinal_features = ["operator_skill"]
    numeric_features = ["machine_age_yrs", "estimated_time_min"]

    skill_order = [["Beginner", "Intermediate", "Expert"]]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_features,
            ),
            (
                "ord",
                OrdinalEncoder(
                    categories=skill_order,
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                ),
                ordinal_features,
            ),
            ("num", StandardScaler(), numeric_features),
        ],
        remainder="drop",
    )
    return preprocessor


def train_and_evaluate(df: pd.DataFrame):
    feature_cols = [
        "task_type",
        "weather",
        "operator_skill",
        "machine_age_yrs",
        "estimated_time_min",
    ]
    target_col = "actual_time_min"

    X = df[feature_cols]
    y = df[target_col].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocessor = build_preprocessor()

    # 1. Baseline: Linear Regression
    lr_pipeline = Pipeline(
        [
            ("preprocessor", preprocessor),
            ("regressor", LinearRegression()),
        ]
    )
    lr_pipeline.fit(X_train, y_train)
    lr_preds = lr_pipeline.predict(X_test)
    lr_mae = mean_absolute_error(y_test, lr_preds)
    lr_r2 = r2_score(y_test, lr_preds)

    print(f"--- Baseline Linear Regression ---")
    print(f"MAE: {lr_mae:.2f} min | R² Score: {lr_r2:.4f}")

    # 2. Main Model: Random Forest Regressor
    rf_pipeline = Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=120,
                    max_depth=10,
                    min_samples_split=4,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    rf_pipeline.fit(X_train, y_train)
    rf_preds = rf_pipeline.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
    rf_r2 = r2_score(y_test, rf_preds)

    residuals = y_test - rf_preds
    res_std = float(np.std(residuals))

    print(f"\n--- Production Random Forest Regressor ---")
    print(f"MAE:  {rf_mae:.2f} min")
    print(f"RMSE: {rf_rmse:.2f} min")
    print(f"R²:   {rf_r2:.4f}")
    print(f"Residual Std: {res_std:.2f} min")

    # Pick the best model (RF)
    best_pipeline = rf_pipeline if rf_r2 >= lr_r2 else lr_pipeline
    chosen_type = "RandomForestRegressor" if best_pipeline == rf_pipeline else "LinearRegression"

    # Save artifact
    artifact = {
        "pipeline": best_pipeline,
        "model_type": chosen_type,
        "feature_names": feature_cols,
        "metrics": {
            "mae": float(rf_mae),
            "rmse": float(rf_rmse),
            "r2": float(rf_r2),
            "residual_std": res_std,
            "baseline_lr_mae": float(lr_mae),
            "baseline_lr_r2": float(lr_r2),
        },
    }

    MODEL_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_OUTPUT_FILE)
    print(f"\n[OK] Trained model artifact saved to {MODEL_OUTPUT_FILE}")

    return artifact


if __name__ == "__main__":
    print(f"Loading data from {DATA_FILE}...")
    data_df = load_data(DATA_FILE)
    print(f"Loaded {len(data_df)} records.")
    train_and_evaluate(data_df)
