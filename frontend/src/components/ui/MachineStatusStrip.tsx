import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Fuel,
  Clock,
  Truck,
  AlertOctagon
} from 'lucide-react';
import type { MachineStatus } from '../../types';

interface MachineStatusStripProps {
  status: MachineStatus;
  onToggleSeatbelt?: () => void;
  onSimulateHazard?: () => void;
  className?: string;
}

export const MachineStatusStrip: React.FC<MachineStatusStripProps> = ({
  status,
  onToggleSeatbelt,
  onSimulateHazard,
  className = ''
}) => {
  const isSeatbeltFastened = status.seatbelt_status === 'Fastened';
  const fuelPct = Math.round(status.fuel_level_pct);
  const isFuelLow = fuelPct < 25;
  const hasProximityHazard = Boolean(status.proximity_alert && status.proximity_alert.object_detected);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Active Proximity Critical Hazard Banner */}
      {hasProximityHazard && (
        <div
          role="alert"
          className="w-full bg-[#D63C2E] text-white p-3 rounded flex items-center justify-between border-2 border-red-700 animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-industrial text-sm tracking-wide">COLLISION PROXIMITY ALERT</div>
              <div className="text-base font-bold">
                Object detected <span className="tabular-nums underline font-extrabold">{status.proximity_alert?.distance_m}m</span> on <span className="uppercase">{status.proximity_alert?.direction}</span> side!
              </div>
            </div>
          </div>
          {onSimulateHazard && (
            <button
              onClick={onSimulateHazard}
              className="bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded font-bold uppercase transition"
            >
              Clear Hazard
            </button>
          )}
        </div>
      )}

      {/* Main Cab Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-surface border border-border p-3 sm:p-4 rounded shadow-none">
        {/* Machine ID & Model */}
        <div className="flex items-center gap-3 border-r border-border/50 pr-2">
          <div className="p-2.5 rounded bg-stone-200 dark:bg-stone-800 text-[#FFC300]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-secondary font-industrial font-semibold">
              Machine ID
            </div>
            <div className="text-base sm:text-lg font-bold font-industrial tracking-wide text-text-primary">
              {status.machine_id}
            </div>
            <div className="text-xs text-text-secondary truncate max-w-[120px] sm:max-w-[150px]">
              {status.model}
            </div>
          </div>
        </div>

        {/* Seatbelt Status */}
        <div
          onClick={onToggleSeatbelt}
          role="button"
          tabIndex={0}
          title="Click to toggle seatbelt interlock for demo"
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition border ${
            isSeatbeltFastened
              ? 'bg-[#3C8C4A]/10 border-[#3C8C4A]/30 text-[#3C8C4A] dark:text-[#57A967]'
              : 'bg-[#D63C2E]/15 border-[#D63C2E] text-[#D63C2E] dark:text-[#E5564A]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isSeatbeltFastened ? (
              <ShieldCheck className="w-6 h-6 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 shrink-0 animate-bounce" />
            )}
            <div>
              <div className="text-[11px] uppercase tracking-wider font-industrial font-semibold">
                Seatbelt
              </div>
              <div className="text-base sm:text-lg font-bold uppercase tracking-tight">
                {status.seatbelt_status}
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline-block">
            {isSeatbeltFastened ? 'OK' : 'ALERT'}
          </span>
        </div>

        {/* Engine Hours */}
        <div className="flex items-center gap-3 border-r border-border/50 pr-2">
          <div className="p-2.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-secondary font-industrial font-semibold">
              Engine Hours
            </div>
            <div className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-text-primary">
              {status.engine_hours.toFixed(1)} <span className="text-xs font-normal text-text-secondary">hrs</span>
            </div>
            <div className="text-[10px] text-text-secondary uppercase">Telemetry Polled</div>
          </div>
        </div>

        {/* Fuel Level */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded ${
                isFuelLow
                  ? 'bg-[#D63C2E]/20 text-[#D63C2E]'
                  : 'bg-stone-200 dark:bg-stone-800 text-[#FFC300]'
              }`}
            >
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-secondary font-industrial font-semibold">
                Fuel Level
              </div>
              <div className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-text-primary">
                {fuelPct}%
              </div>
            </div>
          </div>

          <div className="w-16 h-2.5 bg-stone-200 dark:bg-stone-800 rounded-sm overflow-hidden self-center border border-border">
            <div
              className={`h-full transition-all duration-300 ${
                isFuelLow ? 'bg-[#D63C2E]' : 'bg-[#FFC300]'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, fuelPct))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
