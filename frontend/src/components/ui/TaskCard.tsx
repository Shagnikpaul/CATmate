import React from 'react';
import { Clock, MapPin, ChevronRight, HardHat } from 'lucide-react';
import type { Task } from '../../types';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`group w-full bg-surface border border-border hover:border-[#FFC300] p-4 rounded transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer btn-touch ${
        task.status === 'in_progress' ? 'ring-2 ring-[#FFC300]/80 bg-surface' : ''
      } ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
        <div className="p-3 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 group-hover:text-[#FFC300] transition">
          <HardHat className="w-6 h-6 shrink-0" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-industrial tracking-wider font-semibold text-text-secondary">
              Task #{task.task_id}
            </span>
            <span className="text-xs text-text-secondary">•</span>
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {task.scheduled_start} ({task.estimated_time_min}m est.)
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-industrial uppercase tracking-tight text-text-primary group-hover:text-[#FFC300] transition">
            {task.task_type}
          </h3>

          <div className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#FFC300]" />
            <span>Zone: <strong className="text-text-primary">{task.zone}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
        <StatusBadge status={task.status} size="md" />
        <div className="p-2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 group-hover:text-text-primary group-hover:bg-[#FFC300] transition shrink-0">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
