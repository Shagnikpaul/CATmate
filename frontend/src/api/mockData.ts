import type {
  User,
  Task,
  MachineStatus,
  Incident,
  BehaviorFlag,
  TrainingModule,
  DailyConditions
} from '../types';

export const INITIAL_USERS: Record<string, User> = {
  OP1001: {
    user_id: 'OP1001',
    name: 'Rahul Singh',
    role: 'operator',
    site_id: 'SITE01',
    assigned_machine_id: 'EXC001'
  },
  OP1002: {
    user_id: 'OP1002',
    name: 'Dave Miller',
    role: 'operator',
    site_id: 'SITE01',
    assigned_machine_id: 'CAT745'
  },
  OP1003: {
    user_id: 'OP1003',
    name: 'Marcus Vance',
    role: 'operator',
    site_id: 'SITE01',
    assigned_machine_id: 'D8T02'
  },
  MGR01: {
    user_id: 'MGR01',
    name: 'Anita Roy',
    role: 'manager',
    site_id: 'SITE01'
  }
};

export const INITIAL_CONDITIONS: DailyConditions = {
  weather: 'Sunny, 28°C',
  hazards: ['Loose soil near Trench 3', 'Haul road crossing active at Bay 2']
};

export const INITIAL_MACHINE_STATUS: Record<string, MachineStatus> = {
  EXC001: {
    machine_id: 'EXC001',
    model: 'CAT 320 Hydraulic Excavator',
    engine_hours: 1524.8,
    fuel_level_pct: 62,
    seatbelt_status: 'Fastened',
    proximity_alert: null,
    timestamp: new Date().toISOString()
  },
  CAT745: {
    machine_id: 'CAT745',
    model: 'CAT 745 Articulated Truck',
    engine_hours: 3108.2,
    fuel_level_pct: 44,
    seatbelt_status: 'Fastened',
    proximity_alert: null,
    timestamp: new Date().toISOString()
  },
  D8T02: {
    machine_id: 'D8T02',
    model: 'CAT D8T Track-Type Tractor',
    engine_hours: 890.5,
    fuel_level_pct: 78,
    seatbelt_status: 'Fastened',
    proximity_alert: null,
    timestamp: new Date().toISOString()
  }
};

export const INITIAL_TASKS: Task[] = [
  {
    task_id: 'T001',
    operator_id: 'OP1001',
    machine_id: 'EXC001',
    task_type: 'Excavation',
    zone: 'North Trench',
    scheduled_start: '08:00',
    estimated_time_min: 60,
    actual_time_min: 58,
    status: 'completed'
  },
  {
    task_id: 'T002',
    operator_id: 'OP1001',
    machine_id: 'EXC001',
    task_type: 'Loading',
    zone: 'Bay 2',
    scheduled_start: '10:00',
    estimated_time_min: 45,
    elapsed_sec: 1420,
    status: 'in_progress'
  },
  {
    task_id: 'T003',
    operator_id: 'OP1001',
    machine_id: 'EXC001',
    task_type: 'Trenching',
    zone: 'South Perimeter',
    scheduled_start: '13:30',
    estimated_time_min: 90,
    status: 'pending'
  },
  {
    task_id: 'T004',
    operator_id: 'OP1002',
    machine_id: 'CAT745',
    task_type: 'Hauling',
    zone: 'Sector 4 to Crusher',
    scheduled_start: '09:00',
    estimated_time_min: 120,
    status: 'in_progress'
  },
  {
    task_id: 'T005',
    operator_id: 'OP1003',
    machine_id: 'D8T02',
    task_type: 'Grading',
    zone: 'East Access Road',
    scheduled_start: '11:00',
    estimated_time_min: 80,
    status: 'pending'
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    incident_id: 'INC0042',
    operator_id: 'OP1001',
    operator_name: 'Rahul Singh',
    machine_id: 'EXC001',
    raw_text: 'Hydraulic leak detected near boom swing pivot and bucket hose joint',
    photo_base64: null,
    structured: {
      type: 'Hydraulic Leak',
      location: 'Near Bucket / Boom',
      severity: 'Medium'
    },
    timestamp: '2026-09-23T10:15:00Z'
  },
  {
    incident_id: 'INC0039',
    operator_id: 'OP1002',
    operator_name: 'Dave Miller',
    machine_id: 'CAT745',
    raw_text: 'Loose gravel bank slid into left haul lane after heavy vibration',
    photo_base64: null,
    structured: {
      type: 'Ground Stability Hazard',
      location: 'Haul Road Sector 4',
      severity: 'High'
    },
    timestamp: '2026-09-23T08:45:00Z'
  }
];

export const INITIAL_BEHAVIOR_FLAGS: BehaviorFlag[] = [
  {
    flag_id: 'FLG101',
    operator_id: 'OP1001',
    operator_name: 'Rahul Singh',
    machine_id: 'EXC001',
    flag_type: 'Fatigue Risk',
    risk_level: 'Medium',
    details: 'Idling 52min + late-shift timestamp (2/3 fatigue triggers met)',
    timestamp: '2026-09-23T14:00:00Z'
  },
  {
    flag_id: 'FLG102',
    operator_id: 'OP1001',
    operator_name: 'Rahul Singh',
    machine_id: 'EXC001',
    flag_type: 'Hard Braking',
    risk_level: 'High',
    details: '3 hard-braking events recorded within 30 min window (>0.45g deceleration)',
    timestamp: '2026-09-23T11:20:00Z'
  },
  {
    flag_id: 'FLG103',
    operator_id: 'OP1002',
    operator_name: 'Dave Miller',
    machine_id: 'CAT745',
    flag_type: 'Excessive Idling',
    risk_level: 'Medium',
    details: 'Stationary idle >40 min with AC on high at loading hopper',
    timestamp: '2026-09-23T12:15:00Z'
  }
];

export const INITIAL_TRAINING_MODULES: TrainingModule[] = [
  {
    module_id: 'M012',
    title: 'Smooth Operation & Deceleration Refresher',
    topic: 'braking',
    duration_sec: 90,
    thumbnail_url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Techniques for feathered deceleration, reducing brake wear, and eliminating bucket shock loads on hydraulic cylinders.',
    reason: '3 hard-braking events today'
  },
  {
    module_id: 'M015',
    title: 'Idling Mitigation & Power Mode Optimization',
    topic: 'idling',
    duration_sec: 75,
    thumbnail_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'When to engage Auto-Idle and Auto-Shutdown to save up to 15% fuel per shift without losing hydraulic responsiveness.'
  },
  {
    module_id: 'M022',
    title: 'Hydraulic Trenching Efficiency & Floor Leveling',
    topic: 'fuel efficiency',
    duration_sec: 110,
    thumbnail_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=600&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Optimal stick-to-boom angle sweeps to maximize cubic yard payload per cycle while minimizing engine load spikes.'
  },
  {
    module_id: 'M031',
    title: 'Trench Wall Collapse Hazards & Swing Radius Safety',
    topic: 'safety',
    duration_sec: 120,
    thumbnail_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    description: 'Critical safety buffer distances when operating on saturated or loose topsoil near deep excavations.'
  }
];

export const MANUAL_QA_DATABASE = [
  {
    keywords: ['hydraulic', 'fluid', 'level', 'check', 'oil'],
    answer: 'Locate the sight gauge on the left side of the hydraulic tank. Park machine on level ground with bucket curled and resting on floor. The oil level must register between the ADD and FULL marks in the amber temperature zone.',
    source: 'CAT 320 Hydraulic Excavator Operation & Maintenance Manual, p.42'
  },
  {
    keywords: ['seatbelt', 'buckle', 'sensor', 'unfasten'],
    answer: 'The cab seatbelt is equipped with an integrated interlock switch. If unfastened while the engine is engaged above 800 RPM, a persistent visual warning and cab audible horn triggers. Replace harness if webbing is cut or latch shows distortion.',
    source: 'CAT Cab Safety & Operator Restraint Guide, Section 3.2'
  },
  {
    keywords: ['engine', 'overheat', 'coolant', 'temperature'],
    answer: 'If coolant temperature exceeds 105°C (221°F), reduce engine speed to low idle. Do NOT shut down immediately. Allow coolant circulation to reduce heat soak. Inspect radiator core screen for dust debris.',
    source: 'CAT C4.4 Engine Systems Troubleshooting, p.88'
  },
  {
    keywords: ['proximity', 'sensor', 'radar', 'blindspot'],
    answer: 'Cat Detect with Smart Part Object Detection utilizes dual 77GHz radar heads. Sensor clean zone must be free of caked mud. Range defaults to 3-meter safety sphere around counterweight swing radius.',
    source: 'CAT Grade & Detection Systems Manual, p.15'
  }
];
