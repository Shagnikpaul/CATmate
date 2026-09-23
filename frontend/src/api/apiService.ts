import type {
  User,
  SessionResponse,
  DailyTasksResponse,
  Task,
  TaskStatus,
  MachineStatus,
  Incident,
  StructuredIncident,
  SeverityLevel,
  BehaviorFlag,
  TrainingModule,
  TrainingRecommendation,
  TrainingAssignment,
  TaskTimePrediction,
  ManagerOverviewData,
  AssistantQueryResponse,
  ManualQueryResponse,
  ProximityAlert
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_CONDITIONS,
  INITIAL_MACHINE_STATUS,
  INITIAL_TASKS,
  INITIAL_INCIDENTS,
  INITIAL_BEHAVIOR_FLAGS,
  INITIAL_TRAINING_MODULES,
  MANUAL_QA_DATABASE
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private useMock: boolean = true;
  private token: string | null = null;
  private currentUser: User | null = null;

  // Reactive state store
  private tasks: Task[] = [...INITIAL_TASKS];
  private machineStatuses: Record<string, MachineStatus> = { ...INITIAL_MACHINE_STATUS };
  private incidents: Incident[] = [...INITIAL_INCIDENTS];
  private flags: BehaviorFlag[] = [...INITIAL_BEHAVIOR_FLAGS];
  private trainingAssignments: TrainingAssignment[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    const savedToken = localStorage.getItem('catmate_token');
    const savedUser = localStorage.getItem('catmate_user');
    const savedMockPref = localStorage.getItem('catmate_use_mock');

    if (savedToken && savedUser) {
      try {
        this.token = savedToken;
        this.currentUser = JSON.parse(savedUser);
      } catch {
        // ignore parse error
      }
    }

    if (savedMockPref !== null) {
      this.useMock = savedMockPref === 'true';
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public isMockMode(): boolean {
    return this.useMock;
  }

  public setMockMode(val: boolean): void {
    this.useMock = val;
    localStorage.setItem('catmate_use_mock', String(val));
    this.notify();
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // --- Auth ---
  public async login(userId: string, password: string): Promise<SessionResponse> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, password })
        });
        if (res.ok) {
          const data = await res.json();
          this.token = data.token;
          this.currentUser = data.user;
          localStorage.setItem('catmate_token', data.token);
          localStorage.setItem('catmate_user', JSON.stringify(data.user));
          this.notify();
          return data;
        }
      } catch (err) {
        console.warn('Real backend login failed, falling back to mock:', err);
      }
    }

    // Mock Login: check if user exists and password is "pass123" or similar
    const user = INITIAL_USERS[userId.toUpperCase()];
    if (user && (password === 'pass123' || password === 'admin' || password === 'cat123')) {
      const token = `sess_${Math.random().toString(36).substring(2, 10)}`;
      this.token = token;
      this.currentUser = user;
      localStorage.setItem('catmate_token', token);
      localStorage.setItem('catmate_user', JSON.stringify(user));
      this.notify();
      return { success: true, token, user };
    }

    return { success: false, error: 'Invalid credentials. Try OP1001 or MGR01 with password: pass123' };
  }

  public async logout(): Promise<{ success: boolean }> {
    if (!this.useMock && this.token) {
      try {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders()
        });
      } catch {
        // ignore network error
      }
    }

    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('catmate_token');
    localStorage.removeItem('catmate_user');
    this.notify();
    return { success: true };
  }

  // --- Tasks ---
  public async getDailyTasks(operatorId?: string): Promise<DailyTasksResponse> {
    const opId = operatorId || this.currentUser?.user_id || 'OP1001';
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/tasks/today?operator_id=${opId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend call failed, using mock data:', e);
      }
    }

    const filtered = this.tasks.filter((t) => t.operator_id === opId);
    return {
      date: new Date().toISOString().split('T')[0],
      conditions: INITIAL_CONDITIONS,
      tasks: filtered.length > 0 ? filtered : this.tasks.slice(0, 3)
    };
  }

  public async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
    const task = this.tasks.find((t) => t.task_id === taskId);
    if (task) {
      task.status = status;
      if (status === 'completed' && !task.actual_time_min) {
        task.actual_time_min = task.estimated_time_min;
      }
      this.notify();
      return { ...task };
    }
    return null;
  }

  // --- Machine Status & Telemetry ---
  public async getMachineStatus(machineId?: string): Promise<MachineStatus> {
    const mId = machineId || this.currentUser?.assigned_machine_id || 'EXC001';
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/machines/${mId}/status`, {
          headers: this.getHeaders()
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend machine status failed, using mock data:', e);
      }
    }

    return (
      this.machineStatuses[mId] || {
        machine_id: mId,
        model: 'CAT 320 Hydraulic Excavator',
        engine_hours: 1524.8,
        fuel_level_pct: 62,
        seatbelt_status: 'Fastened',
        proximity_alert: null,
        timestamp: new Date().toISOString()
      }
    );
  }

  public simulateProximityHazard(machineId: string, alert?: ProximityAlert | null): ProximityAlert | null {
    const m = this.machineStatuses[machineId] || this.machineStatuses['EXC001'];
    if (m) {
      m.proximity_alert = alert !== undefined ? alert : {
        object_detected: true,
        distance_m: 2.1,
        direction: 'left'
      };
      m.timestamp = new Date().toISOString();
      this.notify();
      return m.proximity_alert;
    }
    return null;
  }

  public toggleSeatbelt(machineId: string, status?: 'Fastened' | 'Unfastened'): 'Fastened' | 'Unfastened' {
    const m = this.machineStatuses[machineId] || this.machineStatuses['EXC001'];
    if (m) {
      m.seatbelt_status = status || (m.seatbelt_status === 'Fastened' ? 'Unfastened' : 'Fastened');
      m.timestamp = new Date().toISOString();
      this.notify();
      return m.seatbelt_status;
    }
    return 'Fastened';
  }

  // --- Incidents ---
  public async logIncident(
    operatorId: string,
    machineId: string,
    rawText: string,
    photoBase64?: string | null,
    overrideStructured?: StructuredIncident
  ): Promise<Incident> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/incidents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            operator_id: operatorId,
            machine_id: machineId,
            raw_text: rawText,
            photo_base64: photoBase64
          })
        });
        if (res.ok) {
          const inc = await res.json();
          this.incidents.unshift(inc);
          this.notify();
          return inc;
        }
      } catch (e) {
        console.warn('Backend incident logging failed, falling back to mock:', e);
      }
    }

    // Smart structuring parser if override not provided
    let structured: StructuredIncident;
    if (overrideStructured) {
      structured = overrideStructured;
    } else {
      const lower = rawText.toLowerCase();
      let type = 'Equipment Anomaly';
      let location = 'Machine Perimeter';
      let severity: SeverityLevel = 'Medium';

      if (lower.includes('leak') || lower.includes('hydraulic')) {
        type = 'Hydraulic Fluid Leak';
        location = lower.includes('bucket') ? 'Bucket / Coupler Joint' : 'Boom Cylinder';
        severity = 'Medium';
      } else if (lower.includes('trench') || lower.includes('ground') || lower.includes('soil')) {
        type = 'Ground Stability Cave-in Risk';
        location = 'Trench Wall Edge';
        severity = 'High';
      } else if (lower.includes('track') || lower.includes('roller') || lower.includes('undercarriage')) {
        type = 'Undercarriage Jam';
        location = 'Left Track Roller';
        severity = 'Medium';
      } else if (lower.includes('brake') || lower.includes('steering')) {
        type = 'Critical Braking Failure';
        location = 'Primary Hydrostatic Loop';
        severity = 'Critical';
      }

      structured = { type, location, severity };
    }

    const opUser = INITIAL_USERS[operatorId] || this.currentUser;
    const newIncident: Incident = {
      incident_id: `INC${String(this.incidents.length + 43).padStart(4, '0')}`,
      operator_id: operatorId,
      operator_name: opUser ? opUser.name : 'Rahul Singh',
      machine_id: machineId,
      raw_text: rawText,
      photo_base64: photoBase64 || null,
      structured,
      timestamp: new Date().toISOString()
    };

    this.incidents.unshift(newIncident);
    this.notify();
    return newIncident;
  }

  public async getIncidents(operatorId?: string): Promise<Incident[]> {
    if (!this.useMock) {
      try {
        const url = operatorId ? `${BASE_URL}/api/incidents?operator_id=${operatorId}` : `${BASE_URL}/api/incidents`;
        const res = await fetch(url, { headers: this.getHeaders() });
        if (res.ok) {
          const data = await res.json();
          return data.incidents || data;
        }
      } catch (e) {
        console.warn('Backend incidents fetch failed:', e);
      }
    }

    if (operatorId) {
      return this.incidents.filter((i) => i.operator_id === operatorId);
    }
    return this.incidents;
  }

  // --- Training Hub ---
  public async getTrainingRecommendations(operatorId: string): Promise<TrainingRecommendation> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/training/recommendations?operator_id=${operatorId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend training recommendations failed:', e);
      }
    }

    return {
      flags: ['3 hard-braking events today (>0.45g deceleration)'],
      recommended_modules: [INITIAL_TRAINING_MODULES[0]]
    };
  }

  public getAllTrainingModules(): TrainingModule[] {
    return INITIAL_TRAINING_MODULES;
  }

  public async assignTraining(operatorId: string, moduleId: string, reason: string): Promise<TrainingAssignment> {
    const assignment: TrainingAssignment = {
      assignment_id: Math.floor(Math.random() * 900) + 100,
      operator_id: operatorId,
      module_id: moduleId,
      reason,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    };
    this.trainingAssignments.push(assignment);
    this.notify();
    return assignment;
  }

  // --- Behavior Flags ---
  public async getBehaviorFlags(operatorId?: string): Promise<BehaviorFlag[]> {
    if (!this.useMock) {
      try {
        const url = operatorId
          ? `${BASE_URL}/api/behavior/flags?operator_id=${operatorId}&date=${new Date().toISOString().split('T')[0]}`
          : `${BASE_URL}/api/behavior/flags`;
        const res = await fetch(url, { headers: this.getHeaders() });
        if (res.ok) {
          const data = await res.json();
          return data.flags || data;
        }
      } catch (e) {
        console.warn('Backend behavior flags failed:', e);
      }
    }

    if (operatorId) {
      return this.flags.filter((f) => f.operator_id === operatorId);
    }
    return this.flags;
  }

  public addBehaviorFlag(flag: Omit<BehaviorFlag, 'flag_id' | 'timestamp'>): BehaviorFlag {
    const newFlag: BehaviorFlag = {
      ...flag,
      flag_id: `FLG${Math.floor(Math.random() * 900) + 100}`,
      timestamp: new Date().toISOString()
    };
    this.flags.unshift(newFlag);
    this.notify();
    return newFlag;
  }

  // --- Time Prediction ---
  public async predictTaskTime(params: {
    task_type: string;
    weather: string;
    operator_skill?: string;
    machine_age_yrs?: number;
  }): Promise<TaskTimePrediction> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/predict/task-time`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend predict task time failed:', e);
      }
    }

    // Heuristic ML simulation
    let base = 45;
    if (params.task_type === 'Trenching') base = 60;
    if (params.task_type === 'Excavation') base = 55;
    if (params.task_type === 'Loading') base = 40;
    if (params.task_type === 'Grading') base = 50;

    let adjustment = 0;
    if (params.weather.toLowerCase().includes('rain')) adjustment += 12;
    if (params.weather.toLowerCase().includes('loose')) adjustment += 8;

    return {
      baseline_estimate_min: base,
      predicted_time_min: base + adjustment,
      confidence: adjustment > 10 ? 'medium' : 'high'
    };
  }

  // --- Voice Assistant & Manual RAG ---
  public async queryAssistant(operatorId: string, text: string): Promise<AssistantQueryResponse> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/assistant/query`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ operator_id: operatorId, text })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend assistant query failed, running client intent router:', e);
      }
    }

    const lower = text.toLowerCase();

    // 1. Plate / Tasks query
    if (lower.includes('plate') || lower.includes('task') || lower.includes('today') || lower.includes('schedule')) {
      const myTasks = this.tasks.filter((t) => t.operator_id === operatorId);
      const inProg = myTasks.find((t) => t.status === 'in_progress');
      const pending = myTasks.filter((t) => t.status === 'pending');
      const completed = myTasks.filter((t) => t.status === 'completed');

      const reply = `You have ${myTasks.length} tasks today. ${completed.length} completed. ${inProg ? `${inProg.task_type} is currently active at ${inProg.zone}.` : 'No task currently active.'} Next up: ${pending.length > 0 ? pending[0].task_type : 'Shift complete'}.`;
      return {
        intent: 'daily_tasks',
        reply_text: reply,
        data: { task_ids: myTasks.map((t) => t.task_id) }
      };
    }

    // 2. Machine telemetry / seatbelt / fuel / hours
    if (lower.includes('fuel') || lower.includes('seatbelt') || lower.includes('status') || lower.includes('hours')) {
      const m = await this.getMachineStatus();
      const reply = `Machine ${m.machine_id}: Fuel is at ${m.fuel_level_pct}%, engine hours ${m.engine_hours}, and seatbelt is currently ${m.seatbelt_status}.`;
      return {
        intent: 'machine_status',
        reply_text: reply,
        data: m as unknown as Record<string, unknown>
      };
    }

    // 3. Proximity / Hazard check
    if (lower.includes('hazard') || lower.includes('proximity') || lower.includes('weather')) {
      return {
        intent: 'hazard_check',
        reply_text: `Current site weather is ${INITIAL_CONDITIONS.weather}. Active caution: ${INITIAL_CONDITIONS.hazards.join(' and ')}. Maintain 5 meter swing perimeter.`,
        data: INITIAL_CONDITIONS as unknown as Record<string, unknown>
      };
    }

    // 4. Incident filing intent
    if (lower.includes('incident') || lower.includes('leak') || lower.includes('hazard') || lower.includes('break')) {
      return {
        intent: 'log_incident',
        reply_text: `Incident noted. I have opened the hands-free Incident Logger with your spoken details ready for confirmation.`,
        data: { raw_transcript: text }
      };
    }

    // 5. Technical question / manual RAG
    const rag = await this.queryManualRAG('EXC001', text);
    if (rag && rag.answer) {
      return {
        intent: 'manual_rag',
        reply_text: `${rag.answer} (Reference: ${rag.source_manual})`,
        data: { source: rag.source_manual }
      };
    }

    return {
      intent: 'general_assistant',
      reply_text: `CatMate ready. You can ask "what's on my plate today", query machine telemetry, ask troubleshooting questions from the CAT manual, or say "log incident".`
    };
  }

  public async queryManualRAG(machineId: string, question: string): Promise<ManualQueryResponse> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/assistant/manual-query`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ machine_id: machineId, question })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Backend manual RAG query failed:', e);
      }
    }

    const lower = question.toLowerCase();
    for (const item of MANUAL_QA_DATABASE) {
      const matchCount = item.keywords.filter((kw) => lower.includes(kw)).length;
      if (matchCount >= 1) {
        return {
          answer: item.answer,
          source_manual: item.source
        };
      }
    }

    return {
      answer: 'Consult the 320 Operation & Maintenance Manual Section 4 (Lubrication & Fluid Refills) or alert your site lead.',
      source: 'CAT Machinery Universal Operations Guide'
    } as unknown as ManualQueryResponse;
  }

  // --- Manager Endpoints ---
  public async getManagerOverview(_siteId?: string): Promise<ManagerOverviewData> {
    const operatorRows = [
      {
        operator_id: 'OP1001',
        name: 'Rahul Singh',
        machine_id: 'EXC001',
        active_task: 'Loading (Bay 2)',
        pace_status: 'on_track' as const,
        flags_today: this.flags.filter((f) => f.operator_id === 'OP1001').length
      },
      {
        operator_id: 'OP1002',
        name: 'Dave Miller',
        machine_id: 'CAT745',
        active_task: 'Hauling (Crusher)',
        pace_status: 'behind' as const,
        flags_today: this.flags.filter((f) => f.operator_id === 'OP1002').length
      },
      {
        operator_id: 'OP1003',
        name: 'Marcus Vance',
        machine_id: 'D8T02',
        active_task: 'Grading (East Road)',
        pace_status: 'on_track' as const,
        flags_today: this.flags.filter((f) => f.operator_id === 'OP1003').length
      }
    ];

    return {
      tasks_today: this.tasks.length,
      incidents_today: this.incidents.length,
      active_machines: Object.keys(this.machineStatuses).length,
      operators: operatorRows
    };
  }

  public async allocateTask(params: {
    machine_id: string;
    operator_id: string;
    task_type: string;
    zone: string;
    scheduled_start: string;
    estimated_time_min: number;
  }): Promise<Task> {

    if (!this.useMock) {
      try {
        const res = await fetch(`${BASE_URL}/api/manager/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params)
        });

        if (res.ok) {
          const data = await res.json();

          // Backend returns only:
          // { task_id, status }
          // Build the complete frontend Task using the original params.
          const newTask: Task = {
            task_id: data.task_id,
            operator_id: params.operator_id,
            machine_id: params.machine_id,
            task_type: params.task_type,
            zone: params.zone,
            scheduled_start: params.scheduled_start,
            estimated_time_min: params.estimated_time_min,
            status: 'pending'
          };

          this.tasks.push(newTask);
          this.notify();

          return newTask;
        }

        console.warn(
          'Backend task allocation failed:',
          await res.text()
        );
      } catch (e) {
        console.warn(
          'Backend task allocation failed, falling back to mock:',
          e
        );
      }
    }

    // Mock fallback
    const newTask: Task = {
      task_id: `T${String(this.tasks.length + 1).padStart(3, '0')}`,
      operator_id: params.operator_id,
      machine_id: params.machine_id,
      task_type: params.task_type,
      zone: params.zone,
      scheduled_start: params.scheduled_start,
      estimated_time_min: params.estimated_time_min,
      status: 'pending'
    };

    this.tasks.push(newTask);
    this.notify();

    return newTask;
  }

  public getAllTasks(): Task[] {
    return this.tasks;
  }
}

export const api = new ApiService();
