import React from 'react';
import { Gauge, Clock, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface PaceIndicatorProps {
  elapsedMin: number;
  estimatedMin: number;
  predictedFinishTime?: string;
  isCompleted?: boolean;
  className?: string;
}

export const PaceIndicator: React.FC<PaceIndicatorProps> = ({
  elapsedMin,
  estimatedMin,
  predictedFinishTime,
  isCompleted = false,
  className = ''
}) => {
  const ratio = estimatedMin > 0 ? (elapsedMin / estimatedMin) * 100 : 0;
  const isBehind = ratio > 100;
  const isWarning = ratio > 80 && ratio <= 100;

  // Pace status color tokens
  let barColor = 'bg-[#3C8C4A]';
  let paceLabel = 'ON PACE';
  let statusIcon = CheckCircle;

  if (isCompleted) {
    paceLabel = 'COMPLETED';
    statusIcon = CheckCircle;
    barColor = 'bg-[#3C8C4A]';
  } else if (isBehind) {
    paceLabel = 'BEHIND PACE';
    statusIcon = AlertTriangle;
    barColor = 'bg-[#D63C2E]';
  } else if (isWarning) {
    paceLabel = 'APPROACHING TARGET';
    statusIcon = Activity;
    barColor = 'bg-[#E88C1F]';
  }

  const StatusIcon = statusIcon;

  return (
    <div
      role="region"
      aria-label="Task Rhythm & Pace Metronome"
      className={`bg-surface border border-border p-4 sm:p-5 rounded flex flex-col gap-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#FFC300]" />
          <div>
            <span className="text-xs uppercase tracking-wider text-text-secondary font-industrial font-semibold">
              Rhythm &amp; Pace Metronome
            </span>
            <h4 className="text-lg sm:text-xl font-bold font-industrial uppercase tracking-tight text-text-primary">
              Cadence Indicator
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
              isBehind
                ? 'bg-[#D63C2E]/15 text-[#D63C2E] border-[#D63C2E]/40'
                : isWarning
                ? 'bg-[#E88C1F]/15 text-[#E88C1F] border-[#E88C1F]/40'
                : 'bg-[#3C8C4A]/15 text-[#3C8C4A] border-[#3C8C4A]/40'
            }`}
          >
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span>{paceLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar resembling heavy machine gauge */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-text-secondary">
          <span>Elapsed: <strong className="tabular-nums text-text-primary">{elapsedMin} min</strong></span>
          <span>Target: <strong className="tabular-nums text-text-primary">{estimatedMin} min</strong></span>
        </div>

        <div className="w-full h-4 sm:h-5 bg-stone-200 dark:bg-stone-800 rounded-sm overflow-hidden p-0.5 border border-border flex items-center">
          <div
            className={`h-full rounded-sm transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, ratio)}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-sm">
        <div className="bg-bg border border-border p-2.5 rounded">
          <div className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial">
            Cycle Percentage
          </div>
          <div className="text-lg font-bold tabular-nums text-text-primary">
            {Math.round(ratio)}%
          </div>
        </div>

        <div className="bg-bg border border-border p-2.5 rounded">
          <div className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial">
            Variance
          </div>
          <div
            className={`text-lg font-bold tabular-nums ${
              isBehind ? 'text-[#D63C2E]' : 'text-[#3C8C4A]'
            }`}
          >
            {isBehind ? `+${elapsedMin - estimatedMin}m (Slow)` : `-${estimatedMin - elapsedMin}m (Ahead)`}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-bg border border-border p-2.5 rounded flex flex-col justify-center">
          <div className="text-[11px] uppercase tracking-wider text-text-secondary font-industrial flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#FFC300]" />
            Predicted Finish
          </div>
          <div className="text-base font-bold tabular-nums text-text-primary">
            {predictedFinishTime || '10:45 AM'}
          </div>
        </div>
      </div>
    </div>
  );
};
