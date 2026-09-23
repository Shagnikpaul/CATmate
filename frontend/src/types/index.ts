export type UserRole = 'operator' | 'manager';

export interface User {
  user_id: string;
  name: string;
  role: UserRole;
  site_id: string;
  assigned_machine_id?: string;
  avatar?: string;
}

export interface SessionResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface Task {
  task_id: string;
  operator_id: string;
  machine_id: string;
  task_type: 'Excavation' | 'Loading' | 'Grading' | 'Trenching' | 'Hauling' | string;
  zone: string;
  scheduled_start: string;
  estimated_time_min: number;
  actual_time_min?: number;
  elapsed_sec?: number;
  status: TaskStatus;
}

export interface DailyConditions {
  weather: string;
  hazards: string[];
}

export interface DailyTasksResponse {
  date: string;
  conditions: DailyConditions;
  tasks: Task[];
}

export interface ProximityAlert {
  object_detected: boolean;
  distance_m: number;
  direction: 'left' | 'right' | 'rear' | 'front';
}

export interface MachineStatus {
  machine_id: string;
  model: string;
  engine_hours: number;
  fuel_level_pct: number;
  seatbelt_status: 'Fastened' | 'Unfastened';
  proximity_alert: ProximityAlert | null;
  timestamp: string;
}

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface StructuredIncident {
  type: string;
  location: string;
  severity: SeverityLevel;
}

export interface Incident {
  incident_id: string;
  operator_id: string;
  operator_name?: string;
  machine_id: string;
  raw_text: string;
  photo_base64?: string | null;
  structured: StructuredIncident;
  timestamp: string;
}

export type BehaviorFlagType =
  | 'Fatigue Risk'
  | 'Hard Braking'
  | 'Excessive Idling'
  | 'Speeding'
  | 'Rough Hydraulic Use';

export interface BehaviorFlag {
  flag_id: string;
  operator_id: string;
  operator_name: string;
  machine_id: string;
  flag_type: BehaviorFlagType;
  risk_level: SeverityLevel;
  details: string;
  timestamp: string;
}

export interface TrainingModule {
  module_id: string;
  title: string;
  topic: 'idling' | 'braking' | 'fuel efficiency' | 'safety' | string;
  duration_sec: number;
  thumbnail_url: string;
  video_url: string;
  description: string;
  reason?: string;
}

export interface TrainingRecommendation {
  flags: string[];
  recommended_modules: TrainingModule[];
}

export interface TrainingAssignment {
  assignment_id: number;
  operator_id: string;
  module_id: string;
  reason: string;
  status: 'assigned' | 'completed';
  assigned_at: string;
}

export interface TaskTimePrediction {
  predicted_time_min: number;
  baseline_estimate_min: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface ManagerOperatorRow {
  operator_id: string;
  name: string;
  machine_id: string;
  active_task: string;
  pace_status: 'on_track' | 'behind' | 'idle' | 'completed';
  flags_today: number;
}

export interface ManagerOverviewData {
  tasks_today: number;
  incidents_today: number;
  active_machines: number;
  operators: ManagerOperatorRow[];
}

export interface AssistantQueryResponse {
  intent: string;
  reply_text: string;
  data?: Record<string, unknown>;
}

export interface ManualQueryResponse {
  answer: string;
  source_manual: string;
}
