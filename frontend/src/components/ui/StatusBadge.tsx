import React from 'react';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import type { TaskStatus, SeverityLevel } from '../../types';

interface StatusBadgeProps {
  status?: TaskStatus | SeverityLevel | 'on_track' | 'behind' | 'idle' | 'assigned';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'pending',
  label,
  size = 'md',
  className = ''
}) => {
  let displayLabel = label;
  let bgClass = 'bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-700';
  let IconComponent = Clock;

  const s = String(status).toLowerCase();

  switch (s) {
    case 'completed':
      displayLabel = displayLabel || 'Completed';
      bgClass = 'bg-[#3C8C4A]/15 text-[#3C8C4A] border-[#3C8C4A]/30 dark:bg-[#57A967]/20 dark:text-[#57A967] dark:border-[#57A967]/40';
      IconComponent = CheckCircle2;
      break;
    case 'in_progress':
      displayLabel = displayLabel || 'In Progress';
      bgClass = 'bg-[#FFC300]/20 text-[#2E2725] border-[#FFC300] dark:bg-[#FFC300]/25 dark:text-[#FFC300] dark:border-[#FFC300]/60';
      IconComponent = PlayCircle;
      break;
    case 'pending':
    case 'idle':
      displayLabel = displayLabel || 'Pending';
      bgClass = 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800/80 dark:text-stone-300 dark:border-stone-700';
      IconComponent = Clock;
      break;
    case 'on_track':
      displayLabel = displayLabel || 'On Track';
      bgClass = 'bg-[#3C8C4A]/15 text-[#3C8C4A] border-[#3C8C4A]/30 dark:bg-[#57A967]/20 dark:text-[#57A967] dark:border-[#57A967]/40';
      IconComponent = CheckCircle2;
      break;
    case 'behind':
      displayLabel = displayLabel || 'Behind Pace';
      bgClass = 'bg-[#D63C2E]/15 text-[#D63C2E] border-[#D63C2E]/30 dark:bg-[#E5564A]/20 dark:text-[#E5564A] dark:border-[#E5564A]/40 font-bold';
      IconComponent = TrendingDown;
      break;
    case 'critical':
      displayLabel = displayLabel || 'Critical';
      bgClass = 'bg-[#D63C2E] text-white border-[#D63C2E] font-bold';
      IconComponent = AlertOctagon;
      break;
    case 'high':
      displayLabel = displayLabel || 'High Risk';
      bgClass = 'bg-[#D63C2E]/15 text-[#D63C2E] border-[#D63C2E]/30 dark:bg-[#E5564A]/20 dark:text-[#E5564A] dark:border-[#E5564A]/40 font-bold';
      IconComponent = AlertTriangle;
      break;
    case 'medium':
      displayLabel = displayLabel || 'Medium Risk';
      bgClass = 'bg-[#E88C1F]/15 text-[#B86500] border-[#E88C1F]/30 dark:bg-[#F2A63D]/20 dark:text-[#F2A63D] dark:border-[#F2A63D]/40';
      IconComponent = AlertTriangle;
      break;
    case 'low':
      displayLabel = displayLabel || 'Low Risk';
      bgClass = 'bg-[#3C8C4A]/15 text-[#3C8C4A] border-[#3C8C4A]/30 dark:bg-[#57A967]/20 dark:text-[#57A967] dark:border-[#57A967]/40';
      IconComponent = ShieldCheck;
      break;
    case 'assigned':
      displayLabel = displayLabel || 'Assigned';
      bgClass = 'bg-[#FFC300]/20 text-stone-900 border-[#FFC300] dark:text-[#FFC300]';
      IconComponent = PlayCircle;
      break;
    default:
      displayLabel = displayLabel || status;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${sizeClasses[size]} ${bgClass} ${className}`}
    >
      <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className="tracking-wide uppercase font-sans text-[11px] sm:text-xs">{displayLabel}</span>
    </span>
  );
};
