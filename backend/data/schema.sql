-- CATmate Supabase PostgreSQL Database Schema

-- Users & sites
CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  name TEXT, 
  location TEXT
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,           -- e.g. OP1001, MGR2001
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('operator','manager')) NOT NULL,
  site_id TEXT REFERENCES sites(site_id),
  skill_level TEXT                     -- Beginner / Intermediate / Expert
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP
);

-- Machines & manuals
CREATE TABLE IF NOT EXISTS machines (
  machine_id TEXT PRIMARY KEY,         -- EXC001
  model TEXT, 
  type TEXT, 
  age_years INT, 
  site_id TEXT REFERENCES sites(site_id)
);

CREATE TABLE IF NOT EXISTS machine_manuals (
  manual_id TEXT PRIMARY KEY,
  machine_id TEXT REFERENCES machines(machine_id),
  title TEXT, 
  source_pdf_path TEXT
);

CREATE TABLE IF NOT EXISTS manual_chunks (             -- for RAG (FAISS index mirrors this)
  chunk_id SERIAL PRIMARY KEY,
  manual_id TEXT REFERENCES machine_manuals(manual_id),
  chunk_text TEXT, 
  page_number INT
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  machine_id TEXT REFERENCES machines(machine_id),
  operator_id TEXT REFERENCES users(user_id),
  task_type TEXT, 
  zone TEXT,
  scheduled_start TIMESTAMP,
  estimated_time_min INT,
  actual_time_min INT,
  weather TEXT,
  status TEXT CHECK (status IN ('pending','in_progress','completed')) DEFAULT 'pending'
);

-- Telemetry (synthetic, polled)
CREATE TABLE IF NOT EXISTS telemetry (
  id SERIAL PRIMARY KEY,
  machine_id TEXT REFERENCES machines(machine_id),
  operator_id TEXT REFERENCES users(user_id),
  timestamp TIMESTAMP,
  engine_hours FLOAT, 
  fuel_used_l FLOAT, 
  load_cycles INT,
  idling_time_min INT, 
  seatbelt_status TEXT, 
  safety_alert_triggered BOOLEAN
);

-- Incidents (hands-free voice log)
CREATE TABLE IF NOT EXISTS incidents (
  incident_id TEXT PRIMARY KEY,
  operator_id TEXT REFERENCES users(user_id),
  machine_id TEXT REFERENCES machines(machine_id),
  raw_voice_text TEXT,
  incident_type TEXT, 
  location TEXT, 
  severity TEXT,
  photo_url TEXT,
  timestamp TIMESTAMP DEFAULT now()
);

-- Behavior / fatigue flags
CREATE TABLE IF NOT EXISTS behavior_flags (
  flag_id SERIAL PRIMARY KEY,
  operator_id TEXT REFERENCES users(user_id),
  machine_id TEXT REFERENCES machines(machine_id),
  flag_type TEXT,                       -- Excessive Idling / Fuel Inefficiency / Low Productivity / Critical Safety Pattern / Fatigue Risk
  risk_level TEXT,
  details TEXT,
  timestamp TIMESTAMP
);

-- Training
CREATE TABLE IF NOT EXISTS training_modules (
  module_id TEXT PRIMARY KEY,
  title TEXT, 
  topic_tags TEXT[], 
  video_url TEXT, 
  duration_sec INT
);

CREATE TABLE IF NOT EXISTS training_assignments (
  assignment_id SERIAL PRIMARY KEY,
  operator_id TEXT REFERENCES users(user_id),
  module_id TEXT REFERENCES training_modules(module_id),
  reason TEXT, 
  assigned_at TIMESTAMP DEFAULT now(), 
  completed BOOLEAN DEFAULT false
);
