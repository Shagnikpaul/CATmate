import React, { useState, useEffect } from 'react';
import { api } from '../../api/apiService';
import type { SeverityLevel } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Truck,
  Zap,
  Mic
} from 'lucide-react';

interface CombinedLogItem {
  id: string;
  kind: 'incident' | 'behavior_flag';
  title: string;
  operator_id: string;
  operator_name?: string;
  machine_id: string;
  severity: SeverityLevel;
  timestamp: string;
  details: string;
  raw_transcript?: string;
  photo_base64?: string | null;
}

export const ManagerIncidentLog: React.FC = () => {
  const [items, setItems] = useState<CombinedLogItem[]>([]);
  const [filterOperator, setFilterOperator] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterKind, setFilterKind] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    const incidents = await api.getIncidents();
    const flags = await api.getBehaviorFlags();

    const incidentItems: CombinedLogItem[] = incidents.map((inc) => ({
      id: inc.incident_id,
      kind: 'incident',
      title: `${inc.structured.type} (${inc.structured.location})`,
      operator_id: inc.operator_id,
      operator_name: inc.operator_name || 'Rahul Singh',
      machine_id: inc.machine_id,
      severity: inc.structured.severity,
      timestamp: inc.timestamp,
      details: `Structured Location: ${inc.structured.location}. Logged via cab voice system.`,
      raw_transcript: inc.raw_text,
      photo_base64: inc.photo_base64
    }));

    const flagItems: CombinedLogItem[] = flags.map((f) => ({
      id: f.flag_id,
      kind: 'behavior_flag',
      title: `Rule Flag: ${f.flag_type}`,
      operator_id: f.operator_id,
      operator_name: f.operator_name,
      machine_id: f.machine_id,
      severity: f.risk_level,
      timestamp: f.timestamp,
      details: f.details
    }));

    const combined = [...incidentItems, ...flagItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setItems(combined);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = api.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesOp = filterOperator === 'all' || item.operator_id === filterOperator;
    const matchesSev = filterSeverity === 'all' || item.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesKind = filterKind === 'all' || item.kind === filterKind;
    return matchesOp && matchesSev && matchesKind;
  });

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <span className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-bold">
          Compliance &amp; Operational Audit
        </span>
        <h1 className="font-industrial text-2xl sm:text-3xl font-black uppercase tracking-tight text-text-primary">
          Site Incident &amp; Behavior Flag Log
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Comprehensive log correlating hands-free safety reports with machine telemetry behavior exceptions.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface border border-border p-4 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-text-secondary font-industrial font-bold uppercase">
          <Filter className="w-4 h-4 text-[#FFC300]" />
          <span>Filter Records:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Kind Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary uppercase font-industrial">Type:</span>
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              className="bg-bg border border-border px-2.5 py-1.5 rounded font-semibold text-text-primary focus:outline-none focus:border-[#FFC300]"
            >
              <option value="all">All Records</option>
              <option value="incident">Incidents Only</option>
              <option value="behavior_flag">Behavior Flags Only</option>
            </select>
          </div>

          {/* Operator Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary uppercase font-industrial">Operator:</span>
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="bg-bg border border-border px-2.5 py-1.5 rounded font-semibold text-text-primary focus:outline-none focus:border-[#FFC300]"
            >
              <option value="all">All Operators</option>
              <option value="OP1001">Rahul Singh (OP1001)</option>
              <option value="OP1002">Dave Miller (OP1002)</option>
              <option value="OP1003">Marcus Vance (OP1003)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-secondary uppercase font-industrial">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-bg border border-border px-2.5 py-1.5 rounded font-semibold text-text-primary focus:outline-none focus:border-[#FFC300]"
            >
              <option value="all">All Severities</option>
              <option value="high">High &amp; Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Combined Table */}
      <div className="bg-surface border border-border rounded overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[11px] font-industrial uppercase tracking-wider text-text-secondary">
                <th className="p-3.5 font-bold">Category</th>
                <th className="p-3.5 font-bold">Title / Event Description</th>
                <th className="p-3.5 font-bold">Operator &amp; Unit</th>
                <th className="p-3.5 font-bold">Timestamp</th>
                <th className="p-3.5 font-bold">Severity</th>
                <th className="p-3.5 text-right font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    No matching records found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isExpanded = expandedId === item.id;
                  const isIncident = item.kind === 'incident';

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => toggleRow(item.id)}
                        className={`cursor-pointer transition hover:bg-stone-100 dark:hover:bg-stone-800/60 ${
                          isExpanded ? 'bg-stone-100 dark:bg-stone-800/80 font-medium' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          {isIncident ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-industrial font-bold uppercase">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Incident</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-industrial font-bold uppercase">
                              <Zap className="w-3.5 h-3.5" />
                              <span>Rule Flag</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-text-primary text-base font-industrial tracking-wide">
                            {item.title}
                          </div>
                          <div className="text-xs text-text-secondary truncate max-w-sm sm:max-w-md">
                            {item.raw_transcript || item.details}
                          </div>
                        </td>

                        <td className="p-3.5 text-xs">
                          <div className="font-bold text-text-primary">
                            {item.operator_name || item.operator_id}
                          </div>
                          <div className="text-text-secondary font-mono flex items-center gap-1">
                            <Truck className="w-3 h-3 text-[#FFC300]" />
                            <span>{item.machine_id}</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-xs text-text-secondary font-mono whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="p-3.5">
                          <StatusBadge status={item.severity} size="sm" />
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            className="p-1 rounded text-text-secondary hover:text-text-primary"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-bg/90 border-b border-border">
                          <td colSpan={6} className="p-4 sm:p-5 animate-in fade-in">
                            <div className="bg-surface border border-border p-4 rounded space-y-3">
                              <div className="flex items-center justify-between border-b border-border pb-2">
                                <span className="font-industrial uppercase font-bold text-xs text-text-secondary">
                                  Expanded Forensic Details • Record #{item.id}
                                </span>
                                <span className="text-xs text-text-secondary font-mono">
                                  Full Timestamp: {new Date(item.timestamp).toLocaleString()}
                                </span>
                              </div>

                              {isIncident ? (
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-xs uppercase font-industrial font-bold text-text-secondary block">
                                      Raw Operator In-Cab Voice Transcript:
                                    </span>
                                    <div className="p-3 bg-bg border border-border rounded text-sm italic font-medium text-text-primary mt-1 flex items-start gap-2">
                                      <Mic className="w-4 h-4 text-[#FFC300] shrink-0 mt-0.5" />
                                      <span>&ldquo;{item.raw_transcript}&rdquo;</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="p-2.5 bg-bg rounded">
                                      <span className="text-text-secondary block font-industrial uppercase font-bold">
                                        Assigned Classification:
                                      </span>
                                      <span className="text-text-primary font-bold text-sm">{item.title}</span>
                                    </div>

                                    <div className="p-2.5 bg-bg rounded">
                                      <span className="text-text-secondary block font-industrial uppercase font-bold">
                                        Tablet Photo Evidence:
                                      </span>
                                      {item.photo_base64 ? (
                                        <div className="mt-1 flex items-center gap-2">
                                          <img
                                            src={item.photo_base64}
                                            alt="Incident attachment"
                                            className="w-14 h-14 object-cover rounded border border-border"
                                          />
                                          <span className="text-xs text-[#3C8C4A] font-bold">Image Attached</span>
                                        </div>
                                      ) : (
                                        <span className="text-text-secondary mt-1 block">No photo attached by cab tablet.</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <span className="text-xs uppercase font-industrial font-bold text-text-secondary block">
                                    Triggering Rule Engine Parameters:
                                  </span>
                                  <div className="p-3 bg-bg border border-border rounded text-sm font-semibold text-text-primary">
                                    {item.details}
                                  </div>
                                  <div className="text-xs text-text-secondary">
                                    Action Recommended: Push refresher module via Training Hub or dispatch site safety tech.
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
