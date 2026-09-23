import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService';
import type {
  ManagerOverviewData,
  ManagerOperatorRow,
  Task,
  BehaviorFlag,
  Incident
} from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Truck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const ManagerOverview: React.FC = () => {
  const [data, setData] = useState<ManagerOverviewData | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<ManagerOperatorRow | null>(null);
  const [operatorTasks, setOperatorTasks] = useState<Task[]>([]);
  const [operatorFlags, setOperatorFlags] = useState<BehaviorFlag[]>([]);
  const [operatorIncidents, setOperatorIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getManagerOverview();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live grid refresh
    const unsubscribe = api.subscribe(() => {
      loadData();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleSelectRow = async (op: ManagerOperatorRow) => {
    setSelectedOperator(op);
    const tasksRes = await api.getDailyTasks(op.operator_id);
    setOperatorTasks(tasksRes.tasks);
    const flagsRes = await api.getBehaviorFlags(op.operator_id);
    setOperatorFlags(flagsRes);
    const incRes = await api.getIncidents(op.operator_id);
    setOperatorIncidents(incRes);
  };

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-text-secondary font-semibold font-industrial text-xl">
        Loading Fleet Live Telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Page Title & Live Stream Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <span className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-bold">
            Site Command • SITE01 Quarry Operations
          </span>
          <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary">
            Manager Fleet Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#3C8C4A]/10 border border-[#3C8C4A]/30 text-[#3C8C4A] dark:text-[#57A967] text-xs font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-[#3C8C4A] animate-ping" />
            <span>WebSocket Live Stream Active</span>
          </div>

          <button
            onClick={loadData}
            title="Force refresh"
            className="btn-touch p-2 rounded border border-border bg-surface hover:border-[#FFC300] text-text-secondary hover:text-text-primary transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Summary Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border p-4 rounded shadow-none">
          <div className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-semibold">
            Tasks Scheduled Today
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums font-industrial text-text-primary mt-1">
            {data?.tasks_today || 12}
          </div>
          <div className="text-[11px] text-[#3C8C4A] font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>8 Active / Completed</span>
          </div>
        </div>

        <div className="bg-surface border border-border p-4 rounded shadow-none">
          <div className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-semibold">
            Incidents Reported
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums font-industrial text-[#D63C2E] mt-1">
            {data?.incidents_today || 2}
          </div>
          <div className="text-[11px] text-text-secondary font-semibold mt-0.5">
            1 Under Safety Review
          </div>
        </div>

        <div className="bg-surface border border-border p-4 rounded shadow-none">
          <div className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-semibold">
            Active Machinery Fleet
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums font-industrial text-text-primary mt-1">
            {data?.active_machines || 3}
          </div>
          <div className="text-[11px] text-text-secondary font-semibold mt-0.5">
            EXC001, CAT745, D8T02
          </div>
        </div>

        <div className="bg-surface border border-border p-4 rounded shadow-none">
          <div className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-semibold">
            Fleet Pace Index
          </div>
          <div className="text-2xl sm:text-3xl font-black tabular-nums font-industrial text-[#3C8C4A] mt-1">
            94%
          </div>
          <div className="text-[11px] text-text-secondary font-semibold mt-0.5">
            2 on track, 1 behind pace
          </div>
        </div>
      </div>

      {/* 2. Live Operator Grid & Drill-Down Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Grid Table */}
        <div className={`space-y-3 ${selectedOperator ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FFC300]" />
              <h2 className="font-industrial text-xl font-bold uppercase tracking-tight text-text-primary">
                Live Operator Status Roster
              </h2>
            </div>
            <span className="text-xs text-text-secondary font-medium">
              Click row to inspect telemetries &amp; flags
            </span>
          </div>

          <div className="bg-surface border border-border rounded overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border text-[11px] font-industrial uppercase tracking-wider text-text-secondary">
                    <th className="p-3.5 font-bold">Operator &amp; Machine</th>
                    <th className="p-3.5 font-bold">Active Operation</th>
                    <th className="p-3.5 font-bold">Cadence / Pace</th>
                    <th className="p-3.5 font-bold text-center">Flags Today</th>
                    <th className="p-3.5 text-right font-bold">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.operators.map((op) => {
                    const isSelected = selectedOperator?.operator_id === op.operator_id;
                    return (
                      <tr
                        key={op.operator_id}
                        onClick={() => handleSelectRow(op)}
                        className={`cursor-pointer transition hover:bg-stone-100 dark:hover:bg-stone-800/60 ${isSelected ? 'bg-stone-100 dark:bg-stone-800 border-l-4 border-l-[#FFC300]' : ''
                          }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-text-primary text-base font-industrial tracking-wide">
                            {op.name}
                          </div>
                          <div className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] font-bold">{op.operator_id}</span>
                            <span>•</span>
                            <span className="text-[#FFC300] font-bold flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {op.machine_id}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-text-primary text-sm">
                            {op.active_task}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <StatusBadge status={op.pace_status} size="sm" />
                        </td>

                        <td className="p-3.5 text-center">
                          {op.flags_today > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#D63C2E]/15 border border-[#D63C2E]/30 text-[#D63C2E] dark:text-[#E5564A] text-xs font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{op.flags_today}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-text-secondary font-mono">0</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <ChevronRight className="w-5 h-5 text-text-secondary inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Slide-over / Drill-down Operator Detail Panel */}
        {selectedOperator && (
          <div className="lg:col-span-5 bg-surface border-2 border-[#FFC300] rounded p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-right-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-industrial uppercase font-bold text-text-secondary">
                  Operator Inspection Dossier
                </span>
                <h3 className="font-industrial text-2xl font-black uppercase text-text-primary">
                  {selectedOperator.name}
                </h3>
                <div className="text-xs text-text-secondary font-semibold mt-0.5">
                  ID: {selectedOperator.operator_id} • Unit: {selectedOperator.machine_id}
                </div>
              </div>
              <button
                onClick={() => setSelectedOperator(null)}
                className="btn-touch p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operator's Tasks */}
            <div className="space-y-2">
              <span className="text-xs font-industrial uppercase font-bold text-text-secondary tracking-wider block">
                Shift Tasks ({operatorTasks.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {operatorTasks.map((t) => (
                  <div
                    key={t.task_id}
                    className="p-2.5 rounded bg-bg border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-text-primary font-industrial uppercase">
                        {t.task_type}
                      </div>
                      <div className="text-text-secondary text-[11px]">
                        Zone: {t.zone} • {t.scheduled_start} ({t.estimated_time_min}m)
                      </div>
                    </div>
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Operator's Behavior Flags */}
            <div className="space-y-2 pt-1 border-t border-border">
              <span className="text-xs font-industrial uppercase font-bold text-[#E88C1F] tracking-wider block">
                Telemetry Flags Triggered ({operatorFlags.length})
              </span>
              {operatorFlags.length === 0 ? (
                <div className="p-3 bg-bg rounded text-xs text-text-secondary">
                  No erratic driving or fatigue flags recorded today.
                </div>
              ) : (
                <div className="space-y-2">
                  {operatorFlags.map((f) => (
                    <div
                      key={f.flag_id}
                      className="p-3 rounded bg-[#E88C1F]/10 border border-[#E88C1F]/30 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-[#E88C1F]">
                        <span>{f.flag_type}</span>
                        <StatusBadge status={f.risk_level} size="sm" />
                      </div>
                      <p className="text-text-primary mt-1 font-medium">{f.details}</p>
                      <span className="text-[10px] text-text-secondary mt-1 block font-mono">
                        {new Date(f.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operator's Incidents */}
            <div className="space-y-2 pt-1 border-t border-border">
              <span className="text-xs font-industrial uppercase font-bold text-text-secondary tracking-wider block">
                Field Incidents Logged ({operatorIncidents.length})
              </span>
              {operatorIncidents.length === 0 ? (
                <div className="p-3 bg-bg rounded text-xs text-text-secondary">
                  No active incidents recorded for this operator.
                </div>
              ) : (
                <div className="space-y-2">
                  {operatorIncidents.map((inc) => (
                    <div
                      key={inc.incident_id}
                      className="p-3 rounded bg-bg border border-border text-xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-text-primary font-industrial uppercase">
                          {inc.incident_type}
                        </span>

                        <StatusBadge status={inc.severity} size="sm" />
                      </div>

                      <p className="text-text-secondary italic mt-1">
                        &ldquo;{inc.raw_voice_text}&rdquo;
                      </p>

                      <div className="text-[10px] text-text-secondary mt-1">
                        {inc.location}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
