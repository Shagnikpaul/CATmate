"""Pydantic schemas package."""
from app.schemas.auth import LoginRequest, LoginResponse, UserOut, LogoutResponse
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskOut,
    TodayTaskItem,
    ConditionsOut,
    TodayTasksResponse
)
from app.schemas.machine import (
    MachineOut,
    MachineStatusResponse,
    ProximitySimulateRequest,
    ProximitySimulateResponse
)
from app.schemas.incident import (
    IncidentCreate,
    IncidentStructured,
    IncidentCreateResponse,
    IncidentOut,
    IncidentListResponse
)
from app.schemas.behavior import (
    BehaviorFlagOut,
    BehaviorFlagsResponse,
    BehaviorEvaluateRequest
)
from app.schemas.training import (
    TrainingModuleOut,
    TrainingRecommendationsResponse,
    TrainingAssignmentCreate,
    TrainingAssignmentOut
)
from app.schemas.manager import (
    OperatorOverview,
    ManagerOverviewResponse,
    ManagerTaskCreate,
    ManagerFeedItem,
    ManagerFeedResponse
)
from app.schemas.prediction import TaskTimePredictRequest, TaskTimePredictResponse
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ManualQueryRequest,
    ManualQueryResponse
)

__all__ = [
    "LoginRequest",
    "LoginResponse",
    "UserOut",
    "LogoutResponse",
    "TaskCreate",
    "TaskUpdate",
    "TaskOut",
    "TodayTaskItem",
    "ConditionsOut",
    "TodayTasksResponse",
    "MachineOut",
    "MachineStatusResponse",
    "ProximitySimulateRequest",
    "ProximitySimulateResponse",
    "IncidentCreate",
    "IncidentStructured",
    "IncidentCreateResponse",
    "IncidentOut",
    "IncidentListResponse",
    "BehaviorFlagOut",
    "BehaviorFlagsResponse",
    "BehaviorEvaluateRequest",
    "TrainingModuleOut",
    "TrainingRecommendationsResponse",
    "TrainingAssignmentCreate",
    "TrainingAssignmentOut",
    "OperatorOverview",
    "ManagerOverviewResponse",
    "ManagerTaskCreate",
    "ManagerFeedItem",
    "ManagerFeedResponse",
    "TaskTimePredictRequest",
    "TaskTimePredictResponse",
    "AssistantQueryRequest",
    "AssistantQueryResponse",
    "ManualQueryRequest",
    "ManualQueryResponse"
]
