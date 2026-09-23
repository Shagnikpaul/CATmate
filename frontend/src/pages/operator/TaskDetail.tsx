import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/apiService';
import type { Task, TaskStatus } from '../../types';
import { PaceIndicator } from '../../components/ui/PaceIndicator';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Truck,
  Play,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [elapsedMin, setElapsedMin] = useState<number>(24);
  const [predictedTime, setPredictedTime] = useState<number>(48);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      const allTasks = api.getAllTasks();
      const current = allTasks.find((t) => t.task_id === id) || allTasks[1] || allTasks[0];
      setTask(current);

      if (current) {
        // Calculate mock or real elapsed time
        const elapsed = current.elapsed_sec ? Math.round(current.elapsed_sec / 60) : 24;
        setElapsedMin(elapsed);

        // Fetch predicted finish time from ML endpoint
        try {
          const pred = await api.predictTaskTime({
            task_type: current.task_type,
            weather: 'Sunny',
            operator_skill: 'Intermediate',
            machine_age_yrs: 3
          });
          setPredictedTime(pred.predicted_time_min);
        } catch {
          setPredictedTime(current.estimated_time_min);
        }
      }
      setLoading(false);
    };

    loadTask();
  }, [id]);

  // Live timer tick for in_progress tasks
  useEffect(() => {
    if (!task || task.status !== 'in_progress') return;
    const timer = setInterval(() => {
      setElapsedMin((prev) => prev + 1);
    }, 15000); // ticks every 15s for demo cadence

    return () => clearInterval(timer);
  }, [task]);

  const handleStatusChange = async (nextStatus: TaskStatus) => {
    if (!task) return;
    setUpdating(true);
    try {
      const updated = await api.updateTaskStatus(task.task_id, nextStatus);
      if (updated) {
        setTask(updated);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="p-8 text-center text-text-secondary font-semibold font-industrial text-xl">
        Loading task telemetry...
      </div>
    );
  }

  // Calculate predicted clock finish time string (e.g. 10:48 AM)
  const scheduledHour = parseInt(task.scheduled_start.split(':')[0] || '10', 10);
  const scheduledMinute = parseInt(task.scheduled_start.split(':')[1] || '00', 10);
  const finishDate = new Date();
  finishDate.setHours(scheduledHour, scheduledMinute + predictedTime);
  const predictedFinishTimeStr = finishDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isPending = task.status === 'pending';

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <button
        onClick={() => navigate('/operator')}
        className="btn-touch flex items-center gap-2 text-text-secondary hover:text-text-primary font-industrial font-bold uppercase text-sm transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Return to Shift Dashboard</span>
      </button>

      {/* Task Metadata Block */}
      <div className="bg-surface border border-border p-4 sm:p-6 rounded">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-industrial tracking-wider font-semibold text-text-secondary">
                Operation #{task.task_id}
              </span>
              <span className="text-xs text-text-secondary">•</span>
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Shift Phase Active
              </span>
            </div>
            <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary mt-1">
              {task.task_type}
            </h1>
          </div>

          <StatusBadge status={task.status} size="lg" />
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs sm:text-sm">
          <div className="bg-bg border border-border p-3 rounded">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial block font-semibold">
              Assigned Zone
            </span>
            <div className="font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-[#FFC300] shrink-0" />
              <span>{task.zone}</span>
            </div>
          </div>

          <div className="bg-bg border border-border p-3 rounded">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial block font-semibold">
              Machine Unit
            </span>
            <div className="font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
              <Truck className="w-4 h-4 text-[#FFC300] shrink-0" />
              <span>{task.machine_id}</span>
            </div>
          </div>

          <div className="bg-bg border border-border p-3 rounded">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial block font-semibold">
              Scheduled Start
            </span>
            <div className="font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-[#FFC300] shrink-0" />
              <span>{task.scheduled_start}</span>
            </div>
          </div>

          <div className="bg-bg border border-border p-3 rounded">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial block font-semibold">
              Target Baseline
            </span>
            <div className="font-bold text-text-primary mt-0.5 tabular-nums">
              {task.estimated_time_min} minutes
            </div>
          </div>
        </div>
      </div>

      {/* Pace Indicator Metronome Component */}
      <PaceIndicator
        elapsedMin={elapsedMin}
        estimatedMin={task.estimated_time_min}
        predictedFinishTime={predictedFinishTimeStr}
        isCompleted={isCompleted}
      />

      {/* Predictive ML Model Banner */}
      <div className="bg-bg border border-border p-3 sm:p-4 rounded flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-[#FFC300]/20 text-[#FFC300] shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-industrial uppercase font-bold text-text-primary text-sm">
              Trained Time Predictor Model (/api/predict/task-time)
            </span>
            <p className="text-text-secondary mt-0.5">
              Adjusted for current site weather (Sunny), machine age (3 yrs), and operator skill. Confidence: High.
            </p>
          </div>
        </div>
        <div className="font-industrial text-right shrink-0">
          <div className="text-[11px] text-text-secondary uppercase">ML Predicted</div>
          <div className="text-lg font-bold tabular-nums text-text-primary">{predictedTime} min</div>
        </div>
      </div>

      {/* Big Tactile Start / Complete Action Button */}
      <div className="pt-2">
        {isPending && (
          <button
            onClick={() => handleStatusChange('in_progress')}
            disabled={updating}
            className="w-full btn-touch py-4 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-industrial font-black text-xl uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-sm"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>Engage &amp; Start Task</span>
          </button>
        )}

        {isInProgress && (
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={updating}
            className="w-full btn-touch py-4 rounded bg-[#3C8C4A] hover:bg-[#347A40] text-white font-industrial font-black text-xl uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-sm"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Mark Operation Completed</span>
          </button>
        )}

        {isCompleted && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3.5 rounded bg-[#3C8C4A]/15 border border-[#3C8C4A]/40 text-[#3C8C4A] dark:text-[#57A967] font-industrial font-bold uppercase text-base flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Task Verified Completed</span>
            </div>
            <button
              onClick={() => handleStatusChange('in_progress')}
              disabled={updating}
              className="btn-touch px-4 py-3 rounded border border-border bg-surface hover:bg-stone-200 dark:hover:bg-stone-800 text-xs uppercase font-bold text-text-secondary flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
