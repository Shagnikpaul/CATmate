import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/apiService';
import type { DailyConditions, Task } from '../../types';
import { HazardBanner } from '../../components/ui/HazardBanner';
import { MachineStatusStrip } from '../../components/ui/MachineStatusStrip';
import { TaskCard } from '../../components/ui/TaskCard';
import { useMachineTelemetry } from '../../hooks/useMachineTelemetry';
import { Calendar, ListChecks, RefreshCw } from 'lucide-react';

export const OperatorHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const machineId = user?.assigned_machine_id || 'EXC001';

  const { telemetry, toggleSeatbelt, simulateProximity, refetch } = useMachineTelemetry(machineId);

  const [conditions, setConditions] = useState<DailyConditions>({
    weather: 'Sunny, 28°C',
    hazards: ['Loose soil near Trench 3', 'Haul road crossing active at Bay 2']
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getDailyTasks(user?.user_id);
      setConditions(res.conditions);
      setTasks(res.tasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = api.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [user]);

  const inProgressTask = tasks.find((t) => t.status === 'in_progress');
  const otherTasks = tasks.filter((t) => t.status !== 'in_progress');

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* 1. Weather / Site Hazards Banner */}
      <HazardBanner conditions={conditions} />

      {/* 2. Machine Telemetry Status Strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase font-industrial font-bold text-text-secondary tracking-wider">
            Live Cab Equipment Status
          </div>
          <button
            onClick={() => {
              refetch();
              loadData();
            }}
            title="Refresh telemetry"
            className="flex items-center gap-1 text-[11px] uppercase font-bold text-text-secondary hover:text-[#FFC300] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Now</span>
          </button>
        </div>

        <MachineStatusStrip
          status={telemetry}
          onToggleSeatbelt={toggleSeatbelt}
          onSimulateHazard={() => simulateProximity(null)}
        />
      </div>

      {/* 3. Today's Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[#FFC300]" />
            <h2 className="font-industrial text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary">
              Today&apos;s Task Schedule
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-secondary font-semibold font-industrial text-lg">
            Loading scheduled operations...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded text-text-secondary">
            No scheduled tasks remaining for shift.
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Active / In-Progress highlighted at top */}
            {inProgressTask && (
              <div className="space-y-1">
                <span className="text-[11px] font-industrial uppercase font-bold tracking-wider text-[#FFC300] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FFC300] animate-ping" />
                  Currently In-Cab Active
                </span>
                <TaskCard
                  task={inProgressTask}
                  onClick={() => navigate(`/operator/task/${inProgressTask.task_id}`)}
                />
              </div>
            )}

            {/* Other tasks */}
            {otherTasks.map((t) => (
              <TaskCard
                key={t.task_id}
                task={t}
                onClick={() => navigate(`/operator/task/${t.task_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
