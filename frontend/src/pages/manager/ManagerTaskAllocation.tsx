import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService';
import type { Task, TaskTimePrediction } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Layers
} from 'lucide-react';

export const ManagerTaskAllocation: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machineId, setMachineId] = useState('EXC001');
  const [operatorId, setOperatorId] = useState('OP1001');
  const [taskType, setTaskType] = useState('Grading');
  const [zone, setZone] = useState('Site B - West Perimeter');
  const [scheduledStart, setScheduledStart] = useState('14:00');
  const [estimatedTimeMin, setEstimatedTimeMin] = useState<number>(35);
  const [prediction, setPrediction] = useState<TaskTimePrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadTasks = () => {
    setTasks([...api.getAllTasks()]);
  };

  useEffect(() => {
    loadTasks();
    const unsubscribe = api.subscribe(() => {
      loadTasks();
    });
    return unsubscribe;
  }, []);

  const handlePredictDuration = async () => {
    setIsPredicting(true);
    try {
      const pred = await api.predictTaskTime({
        task_type: taskType,
        weather: 'Sunny',
        operator_skill: 'Intermediate',
        machine_age_yrs: 3
      });
      setPrediction(pred);
      setEstimatedTimeMin(pred.predicted_time_min);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone.trim()) return;

    setIsSubmitting(true);
    try {
      const newTask = await api.allocateTask({
        machine_id: machineId,
        operator_id: operatorId,
        task_type: taskType,
        zone: zone.trim(),
        scheduled_start: scheduledStart,
        estimated_time_min: Number(estimatedTimeMin)
      });

      setSuccessToast(`Task ${newTask.task_id} successfully allocated to ${operatorId}. Broadcast to cab tablet.`);
      setTimeout(() => setSuccessToast(null), 4000);
      loadTasks();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <span className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-bold">
          Site Dispatch &amp; Machinery Scheduling
        </span>
        <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary">
          Manager Task Allocation
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Schedule tasks, assign operators and equipment, and leverage ML models for accurate cycle time forecasting.
        </p>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div
          role="status"
          className="bg-[#3C8C4A] text-white p-3.5 rounded flex items-center justify-between text-sm font-bold shadow-md animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-xs font-mono uppercase px-2 py-0.5 bg-black/20 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Assignment Form Card */}
      <div className="bg-surface border-2 border-border rounded p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <PlusCircle className="w-5 h-5 text-[#FFC300]" />
          <h2 className="font-industrial text-xl font-bold uppercase tracking-tight text-text-primary">
            New Task Assignment
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Machine Dropdown */}
            <div>
              <label className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1">
                Equipment Unit
              </label>
              <div className="relative">
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFC300]"
                >
                  <option value="EXC001">EXC001 — CAT 320 Hydraulic Excavator</option>
                  <option value="CAT745">CAT745 — CAT 745 Articulated Truck</option>
                  <option value="D8T02">D8T02 — CAT D8T Track-Type Tractor</option>
                </select>
              </div>
            </div>

            {/* Operator Dropdown */}
            <div>
              <label className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1">
                Assigned Operator
              </label>
              <div className="relative">
                <select
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFC300]"
                >
                  <option value="OP1001">OP1001 — Rahul Singh</option>
                  <option value="OP1002">OP1002 — Dave Miller</option>
                  <option value="OP1003">OP1003 — Marcus Vance</option>
                </select>
              </div>
            </div>

            {/* Task Type Dropdown */}
            <div>
              <label className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1">
                Operation Type
              </label>
              <div className="relative">
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-bold text-text-primary focus:outline-none focus:border-[#FFC300]"
                >
                  <option value="Grading">Grading</option>
                  <option value="Excavation">Excavation</option>
                  <option value="Loading">Loading</option>
                  <option value="Trenching">Trenching</option>
                  <option value="Hauling">Hauling</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Zone Input */}
            <div>
              <label className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1">
                Worksite Zone / Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Site B - West Cut"
                  required
                  className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-semibold text-text-primary focus:outline-none focus:border-[#FFC300]"
                />
              </div>
            </div>

            {/* Scheduled Start Time */}
            <div>
              <label className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1">
                Scheduled Start (Shift Time)
              </label>
              <input
                type="text"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                placeholder="14:00"
                required
                className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-bold text-text-primary font-mono focus:outline-none focus:border-[#FFC300]"
              />
            </div>

            {/* Duration Input & ML Predict Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase font-industrial font-bold text-text-secondary">
                  Target Duration (Minutes)
                </label>
                <button
                  type="button"
                  onClick={handlePredictDuration}
                  disabled={isPredicting}
                  className="text-[10px] font-industrial uppercase font-bold text-[#FFC300] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isPredicting ? 'Inferring...' : 'ML Predict'}</span>
                </button>
              </div>

              <input
                type="number"
                value={estimatedTimeMin}
                onChange={(e) => setEstimatedTimeMin(parseInt(e.target.value, 10) || 30)}
                required
                min={5}
                max={480}
                className="w-full btn-touch bg-bg border border-border px-3 py-2 rounded text-sm font-bold text-text-primary tabular-nums focus:outline-none focus:border-[#FFC300]"
              />
            </div>
          </div>

          {/* ML Prediction Insight Box */}
          {prediction && (
            <div className="bg-bg border border-border p-3 rounded flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FFC300]" />
                <span className="text-text-secondary">
                  Model Output: Baseline was <strong>{prediction.baseline_estimate_min}m</strong>, predicted duration is <strong>{prediction.predicted_time_min}m</strong> (Confidence: {prediction.confidence.toUpperCase()}).
                </span>
              </div>
              <span className="font-industrial font-bold text-[#3C8C4A] uppercase">
                Applied
              </span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-touch w-full sm:w-auto px-6 py-2.5 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-industrial font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? 'Allocating...' : 'Allocate & Dispatch Task'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Today's Scheduled Tasks Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FFC300]" />
            <h2 className="font-industrial text-xl font-bold uppercase tracking-tight text-text-primary">
              Site Scheduled Tasks Roster ({tasks.length})
            </h2>
          </div>
          <span className="text-xs text-text-secondary font-semibold">
            Live Shared with Operator In-Cab Tablets
          </span>
        </div>

        <div className="bg-surface border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[11px] font-industrial uppercase tracking-wider text-text-secondary">
                  <th className="p-3.5 font-bold">Task ID</th>
                  <th className="p-3.5 font-bold">Operation Type</th>
                  <th className="p-3.5 font-bold">Assigned Unit &amp; Operator</th>
                  <th className="p-3.5 font-bold">Zone</th>
                  <th className="p-3.5 font-bold">Start Time</th>
                  <th className="p-3.5 font-bold">Target</th>
                  <th className="p-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tasks.map((task) => (
                  <tr key={task.task_id} className="hover:bg-stone-100 dark:hover:bg-stone-800/60 transition">
                    <td className="p-3.5 font-mono text-xs font-bold text-text-primary">
                      {task.task_id}
                    </td>
                    <td className="p-3.5 font-bold font-industrial uppercase text-base text-text-primary">
                      {task.task_type}
                    </td>
                    <td className="p-3.5 text-xs">
                      <div className="font-semibold text-text-primary">{task.operator_id}</div>
                      <div className="text-text-secondary">{task.machine_id}</div>
                    </td>
                    <td className="p-3.5 text-xs font-semibold text-text-secondary">
                      {task.zone}
                    </td>
                    <td className="p-3.5 text-xs font-mono font-bold text-text-primary">
                      {task.scheduled_start}
                    </td>
                    <td className="p-3.5 text-xs tabular-nums font-semibold text-text-primary">
                      {task.estimated_time_min}m
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
