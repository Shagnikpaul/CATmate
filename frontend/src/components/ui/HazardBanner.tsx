import React from 'react';
import { Sun, AlertTriangle, CloudRain, Wind } from 'lucide-react';
import type { DailyConditions } from '../../types';

interface HazardBannerProps {
  conditions: DailyConditions;
  className?: string;
}

export const HazardBanner: React.FC<HazardBannerProps> = ({ conditions, className = '' }) => {
  const isRainy = conditions.weather.toLowerCase().includes('rain');
  const isWindy = conditions.weather.toLowerCase().includes('wind');

  return (
    <div
      role="region"
      aria-label="Site Conditions and Safety Hazards"
      className={`w-full rounded border border-[#E88C1F]/40 bg-[#E88C1F]/10 dark:bg-[#F2A63D]/10 p-3 sm:p-4 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded bg-[#FFC300] text-[#211E1C] shrink-0 font-bold">
          {isRainy ? <CloudRain className="w-5 h-5" /> : isWindy ? <Wind className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 font-semibold font-industrial">
            Site Conditions
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight">
            {conditions.weather}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {conditions.hazards.map((hazard, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-[#D63C2E]/15 border border-[#D63C2E]/30 text-[#D63C2E] dark:text-[#E5564A] px-3 py-1.5 rounded text-xs sm:text-sm font-semibold"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>CAUTION: {hazard}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
